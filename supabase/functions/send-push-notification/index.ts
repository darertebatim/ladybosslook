import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { create } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  userIds?: string[];
  targetCourse?: string;
  targetRoundId?: string;
  targetUserEmail?: string;
  title: string;
  message?: string;
  body?: string;
  icon?: string;
  url?: string;
  destinationUrl?: string;
  badge?: number;
  environment?: 'development' | 'production';
  isUrgent?: boolean;
  /** Optional saved-audience filter — narrows recipients via additional rules. */
  audience?: AudienceFilter | null;
  audiencePresetId?: string | null;
}

interface AudienceFilter {
  target_type?: 'all' | 'enrolled' | 'custom';
  include_programs?: string[];
  exclude_programs?: string[];
  include_playlists?: string[];
  exclude_playlists?: string[];
  include_tools?: string[];
  exclude_tools?: string[];
  target_languages?: string[];
  target_timezones?: string[];
  include_update_status?: string[];
  target_instructor_ids?: string[];
}

/** Resolve a saved-audience filter to a Set of allowed user_ids, or null if no rule. */
async function resolveAudienceUserIds(
  supabase: any,
  audience: AudienceFilter | null | undefined,
): Promise<Set<string> | null> {
  if (!audience) return null;
  const hasAnyRule =
    (audience.target_type && audience.target_type !== 'all') ||
    (audience.include_programs?.length ?? 0) > 0 ||
    (audience.exclude_programs?.length ?? 0) > 0 ||
    (audience.include_playlists?.length ?? 0) > 0 ||
    (audience.exclude_playlists?.length ?? 0) > 0 ||
    (audience.target_languages?.length ?? 0) > 0 ||
    (audience.target_timezones?.length ?? 0) > 0 ||
    (audience.include_update_status?.length ?? 0) > 0 ||
    (audience.target_instructor_ids?.length ?? 0) > 0;
  if (!hasAnyRule) return null;

  let candidates: Set<string>;
  if (audience.target_type === 'enrolled') {
    const { data } = await supabase
      .from('course_enrollments').select('user_id').eq('status', 'active');
    candidates = new Set((data ?? []).map((r: any) => r.user_id));
  } else {
    candidates = new Set();
    const PAGE = 1000;
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('profiles').select('id').range(from, from + PAGE - 1);
      if (error) break;
      for (const r of data ?? []) candidates.add(r.id);
      if (!data || data.length < PAGE) break;
      from += PAGE;
    }
  }

  if ((audience.include_programs?.length ?? 0) > 0) {
    const { data } = await supabase
      .from('course_enrollments').select('user_id')
      .in('program_slug', audience.include_programs!).eq('status', 'active');
    const allowed = new Set((data ?? []).map((r: any) => r.user_id));
    candidates = new Set([...candidates].filter((id) => allowed.has(id)));
  }
  if ((audience.exclude_programs?.length ?? 0) > 0) {
    const { data } = await supabase
      .from('course_enrollments').select('user_id')
      .in('program_slug', audience.exclude_programs!).eq('status', 'active');
    const blocked = new Set((data ?? []).map((r: any) => r.user_id));
    candidates = new Set([...candidates].filter((id) => !blocked.has(id)));
  }
  if ((audience.include_playlists?.length ?? 0) > 0) {
    const { data } = await supabase
      .from('playlist_saves').select('user_id').in('playlist_id', audience.include_playlists!);
    const allowed = new Set((data ?? []).map((r: any) => r.user_id));
    candidates = new Set([...candidates].filter((id) => allowed.has(id)));
  }
  if ((audience.exclude_playlists?.length ?? 0) > 0) {
    const { data } = await supabase
      .from('playlist_saves').select('user_id').in('playlist_id', audience.exclude_playlists!);
    const blocked = new Set((data ?? []).map((r: any) => r.user_id));
    candidates = new Set([...candidates].filter((id) => !blocked.has(id)));
  }
  if ((audience.target_languages?.length ?? 0) > 0) {
    const { data } = await supabase
      .from('profiles').select('id').in('preferred_language', audience.target_languages!);
    const allowed = new Set((data ?? []).map((r: any) => r.id));
    candidates = new Set([...candidates].filter((id) => allowed.has(id)));
  }
  if ((audience.target_timezones?.length ?? 0) > 0) {
    const { data } = await supabase
      .from('profiles').select('id').in('timezone', audience.target_timezones!);
    const allowed = new Set((data ?? []).map((r: any) => r.id));
    candidates = new Set([...candidates].filter((id) => allowed.has(id)));
  }
  if ((audience.target_instructor_ids?.length ?? 0) > 0) {
    const { data } = await supabase
      .from('instructor_referrals').select('user_id')
      .in('instructor_id', audience.target_instructor_ids!);
    const allowed = new Set((data ?? []).map((r: any) => r.user_id));
    candidates = new Set([...candidates].filter((id) => allowed.has(id)));
  }
  if ((audience.include_update_status?.length ?? 0) > 0) {
    const wantLatest = audience.include_update_status!.includes('latest');
    const wantPrev = audience.include_update_status!.includes('previous');
    if (!(wantLatest && wantPrev)) {
      const { data: settings } = await supabase
        .from('app_settings').select('key,value')
        .in('key', ['latest_ios_version', 'latest_android_version']);
      const latestIos = settings?.find((s: any) => s.key === 'latest_ios_version')?.value ?? null;
      const latestAndroid = settings?.find((s: any) => s.key === 'latest_android_version')?.value ?? null;
      const userToInstall = new Map<string, { app_version: string | null; platform: string | null }>();
      let from = 0;
      const PAGE = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('app_installations').select('user_id, app_version, platform, last_seen_at')
          .order('last_seen_at', { ascending: false }).range(from, from + PAGE - 1);
        if (error || !data) break;
        for (const r of data) {
          if (!userToInstall.has(r.user_id)) {
            userToInstall.set(r.user_id, { app_version: r.app_version, platform: r.platform });
          }
        }
        if (data.length < PAGE) break;
        from += PAGE;
      }
      candidates = new Set(
        [...candidates].filter((id) => {
          const inst = userToInstall.get(id);
          if (!inst) return wantPrev;
          const latest =
            inst.platform === 'ios' ? latestIos :
            inst.platform === 'android' ? latestAndroid : null;
          const isLatest = !!latest && inst.app_version === latest;
          return isLatest ? wantLatest : wantPrev;
        }),
      );
    }
  }
  return candidates;
}

// ─── APNs (iOS) helpers ───

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

async function generateApnsJwt(authKey: string, keyId: string, teamId: string): Promise<string> {
  const keyData = pemToArrayBuffer(authKey);
  const key = await crypto.subtle.importKey(
    'pkcs8', keyData, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
  );
  return await create(
    { alg: 'ES256', kid: keyId },
    { iss: teamId, iat: Math.floor(Date.now() / 1000) },
    key
  );
}

async function sendToApns(
  deviceToken: string,
  payload: { title: string; body: string; url: string; badge?: number; isUrgent?: boolean },
  jwt: string, topic: string, environment: string
): Promise<Response> {
  const isProduction = environment === 'production';
  const apnsHost = isProduction ? 'api.push.apple.com' : 'api.sandbox.push.apple.com';
  const apnsUrl = `https://${apnsHost}/3/device/${deviceToken}`;

  console.log(`📱 [APNs] Sending (${isProduction ? 'prod' : 'sandbox'}):`, deviceToken.substring(0, 20) + '...', payload.isUrgent ? '⚠️ URGENT' : '');

  const apsPayload: Record<string, unknown> = {
    alert: { title: payload.title, body: payload.body },
    sound: payload.isUrgent ? 'alarm.wav' : 'default',
    badge: payload.badge || 1,
  };

  if (payload.isUrgent) {
    apsPayload['interruption-level'] = 'time-sensitive';
    apsPayload['relevance-score'] = 1.0;
  }

  return await fetch(apnsUrl, {
    method: 'POST',
    headers: {
      'authorization': `bearer ${jwt}`,
      'apns-topic': topic,
      'apns-push-type': 'alert',
      'apns-priority': '10',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      aps: apsPayload,
      url: payload.url,
      isUrgent: payload.isUrgent || false,
    }),
  });
}

// ─── FCM (Android) helpers ───

// Cache for FCM access token (valid ~1 hour)
let fcmAccessToken: string | null = null;
let fcmTokenExpiry = 0;

async function getFcmAccessToken(serviceAccountJson: string): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (fcmAccessToken && Date.now() < fcmTokenExpiry - 300000) {
    return fcmAccessToken;
  }

  const sa = JSON.parse(serviceAccountJson);

  // Import the RSA private key
  const keyData = pemToArrayBuffer(sa.private_key);
  const key = await crypto.subtle.importKey(
    'pkcs8', keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );

  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const payload = btoa(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: sa.token_uri,
    iat: now,
    exp: now + 3600,
  })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const signingInput = new TextEncoder().encode(`${header}.${payload}`);
  const signatureBuffer = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, signingInput);
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const jwt = `${header}.${payload}.${signature}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    const err = await tokenResponse.text();
    throw new Error(`FCM token exchange failed: ${err}`);
  }

  const tokenData = await tokenResponse.json();
  fcmAccessToken = tokenData.access_token;
  fcmTokenExpiry = Date.now() + (tokenData.expires_in * 1000);

  return fcmAccessToken!;
}

async function sendToFcm(
  fcmToken: string,
  payload: { title: string; body: string; url: string; isUrgent?: boolean },
  accessToken: string,
  projectId: string
): Promise<Response> {
  const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  console.log(`🤖 [FCM] Sending to Android:`, fcmToken.substring(0, 20) + '...', payload.isUrgent ? '⚠️ URGENT' : '');

  const message: Record<string, unknown> = {
    token: fcmToken,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: {
      url: payload.url,
      isUrgent: String(payload.isUrgent || false),
    },
    android: {
      priority: payload.isUrgent ? 'HIGH' : 'NORMAL',
      notification: {
        channel_id: payload.isUrgent ? 'urgent' : 'default',
        sound: payload.isUrgent ? 'alarm' : 'default',
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
    },
  };

  return await fetch(fcmUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });
}

// ─── Main handler ───

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody: PushNotificationRequest = await req.json();
    const { userIds, targetCourse, targetRoundId, targetUserEmail, title, icon, badge, environment, isUrgent } = requestBody;
    const body = requestBody.body || requestBody.message || '';
    const url = requestBody.url || requestBody.destinationUrl || '';

    console.log('🔔 Received push notification request:', {
      hasUserIds: !!userIds,
      userIdsLength: userIds?.length,
      targetCourse, targetRoundId, targetUserEmail: targetUserEmail?.trim(),
      title, bodyLength: body?.length, url,
    });

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'Title and body/message are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const adminUserId = user.id;

    // Get target user subscriptions
    let query = supabase.from('push_subscriptions').select('*');

    if (userIds && userIds.length > 0) {
      query = query.in('user_id', userIds);
    } else if (targetUserEmail) {
      const trimmedEmail = targetUserEmail.trim().toLowerCase();
      const { data: profiles, error: profileError } = await supabase
        .from('profiles').select('id').eq('email', trimmedEmail).single();

      if (profiles) {
        query = query.eq('user_id', profiles.id);
      } else {
        return new Response(
          JSON.stringify({ message: 'User not found with that email', sent: 0, failed: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }
    } else if (targetRoundId) {
      const { data: enrollments } = await supabase
        .from('course_enrollments').select('user_id').eq('round_id', targetRoundId);
      if (enrollments && enrollments.length > 0) {
        query = query.in('user_id', enrollments.map(e => e.user_id));
      }
    } else if (targetCourse) {
      const { data: enrollments } = await supabase
        .from('course_enrollments').select('user_id').eq('course_name', targetCourse);
      if (enrollments && enrollments.length > 0) {
        query = query.in('user_id', enrollments.map(e => e.user_id));
      }
    }

    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscriptions found', sent: 0, failed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Split subscriptions by platform
    const iosSubs = subscriptions.filter(s => s.p256dh_key === 'native-ios');
    const androidSubs = subscriptions.filter(s => s.p256dh_key === 'native-android');
    
    console.log(`📊 Found ${iosSubs.length} iOS + ${androidSubs.length} Android subscriptions`);

    let successCount = 0;
    let failedCount = 0;
    const failedSubscriptions: string[] = [];

    const notificationPayload = {
      title,
      body,
      url: url || '/app/home',
      badge,
      isUrgent: isUrgent || false,
    };

    // ─── Send to iOS via APNs ───
    if (iosSubs.length > 0) {
      const authKey = Deno.env.get('APNS_AUTH_KEY');
      const keyId = Deno.env.get('APNS_KEY_ID');
      const teamId = Deno.env.get('APNS_TEAM_ID');
      const topic = Deno.env.get('APNS_TOPIC') || 'com.ladybosslook.academy';
      const apnsEnvironment = environment || Deno.env.get('APNS_ENVIRONMENT') || 'production';

      if (!authKey || !keyId || !teamId) {
        console.error('❌ APNs credentials not configured, skipping iOS');
      } else {
        console.log('🔑 Generating APNs JWT token...');
        const apnsJwt = await generateApnsJwt(authKey, keyId, teamId);

        for (const subscription of iosSubs) {
          try {
            const deviceToken = subscription.endpoint.replace('native:', '');
            const response = await sendToApns(deviceToken, notificationPayload, apnsJwt, topic, apnsEnvironment);
            
            if (response.ok) {
              successCount++;
            } else {
              const errorBody = await response.text();
              console.error(`❌ APNs error (${response.status}):`, errorBody);
              if (response.status === 410 || response.status === 400) {
                failedSubscriptions.push(subscription.id);
              }
              failedCount++;
            }
          } catch (error: any) {
            failedCount++;
            failedSubscriptions.push(subscription.id);
            console.error(`Error sending to iOS user ${subscription.user_id}:`, error.message);
          }
        }
      }
    }

    // ─── Send to Android via FCM ───
    if (androidSubs.length > 0) {
      const fcmServiceAccountJson = Deno.env.get('FCM_SERVICE_ACCOUNT_KEY');

      if (!fcmServiceAccountJson) {
        console.error('❌ FCM_SERVICE_ACCOUNT_KEY not configured, skipping Android');
      } else {
        try {
          const sa = JSON.parse(fcmServiceAccountJson);
          const accessToken = await getFcmAccessToken(fcmServiceAccountJson);
          console.log('🔑 FCM access token obtained');

          for (const subscription of androidSubs) {
            try {
              const fcmToken = subscription.endpoint.replace('native:', '');
              const response = await sendToFcm(fcmToken, notificationPayload, accessToken, sa.project_id);

              if (response.ok) {
                successCount++;
                console.log(`✅ FCM sent to user ${subscription.user_id}`);
              } else {
                const errorBody = await response.text();
                console.error(`❌ FCM error (${response.status}):`, errorBody);
                // 404 = unregistered token, INVALID_ARGUMENT = bad token
                if (response.status === 404 || response.status === 400) {
                  failedSubscriptions.push(subscription.id);
                }
                failedCount++;
              }
            } catch (error: any) {
              failedCount++;
              failedSubscriptions.push(subscription.id);
              console.error(`Error sending to Android user ${subscription.user_id}:`, error.message);
            }
          }
        } catch (error: any) {
          console.error('❌ FCM initialization error:', error.message);
          failedCount += androidSubs.length;
        }
      }
    }

    // Remove failed subscriptions
    if (failedSubscriptions.length > 0) {
      console.log(`🗑️ Removing ${failedSubscriptions.length} invalid subscriptions`);
      await supabase.from('push_subscriptions').delete().in('id', failedSubscriptions);
    }

    // Log the push notification
    const targetType = userIds?.length ? 'specific' : targetUserEmail ? 'user' : targetCourse ? 'course' : 'all';
    await supabase.from('push_notification_logs').insert({
      title,
      message: body,
      destination_url: url || '/app/home',
      target_type: targetType,
      target_course: targetCourse || null,
      sent_count: successCount,
      failed_count: failedCount,
      created_by: adminUserId,
    });

    return new Response(
      JSON.stringify({ message: 'Push notifications sent', sent: successCount, failed: failedCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
};

serve(handler);
