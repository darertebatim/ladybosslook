import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { Resend } from "https://esm.sh/resend@2.0.0";
import { create } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BroadcastRequest {
  title: string;
  content: string;
  targetType: 'all' | 'course' | 'round';
  targetCourse?: string;
  targetRoundId?: string;
  sendPush: boolean;
  sendEmail: boolean;
  linkUrl?: string;
  linkText?: string;
  excludeUserIds?: string[];
  excludeProgramSlugs?: string[];
  /** Optional saved-audience filter (mirrors banners/feed-channels). When set,
   * we intersect `targetUserIds` with users who satisfy the audience rules. */
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
  include_update_status?: string[]; // 'latest' | 'previous'
  target_instructor_ids?: string[];
}

/**
 * Resolve a saved-audience filter to a Set of user_ids.
 * Returns `null` when the filter is empty/no-op (caller should treat as "no filter").
 */
async function resolveAudienceUserIds(
  supabase: any,
  audience: AudienceFilter | null | undefined,
): Promise<Set<string> | null> {
  if (!audience) return null;
  // Paginated SELECT helper — works around Supabase's default 1000-row cap so a
  // language/timezone/program filter doesn't silently truncate matched users.
  async function pagedIds(
    table: string,
    column: string,
    builder: (q: any) => any,
  ): Promise<Set<string>> {
    const out = new Set<string>();
    const PAGE = 1000;
    let from = 0;
    while (true) {
      const q = supabase.from(table).select(column).range(from, from + PAGE - 1);
      const { data, error } = await builder(q);
      if (error || !data) break;
      for (const r of data) {
        const id = r[column];
        if (id) out.add(id);
      }
      if (data.length < PAGE) break;
      from += PAGE;
    }
    return out;
  }
  const hasAnyRule =
    (audience.target_type && audience.target_type !== 'all') ||
    (audience.include_programs?.length ?? 0) > 0 ||
    (audience.exclude_programs?.length ?? 0) > 0 ||
    (audience.include_playlists?.length ?? 0) > 0 ||
    (audience.exclude_playlists?.length ?? 0) > 0 ||
    (audience.include_tools?.length ?? 0) > 0 ||
    (audience.exclude_tools?.length ?? 0) > 0 ||
    (audience.target_languages?.length ?? 0) > 0 ||
    (audience.target_timezones?.length ?? 0) > 0 ||
    (audience.include_update_status?.length ?? 0) > 0 ||
    (audience.target_instructor_ids?.length ?? 0) > 0;
  if (!hasAnyRule) return null;

  // Start from "all profiles", then narrow.
  let candidates: Set<string>;

  if (audience.target_type === 'enrolled') {
    const { data } = await supabase
      .from('course_enrollments')
      .select('user_id')
      .eq('status', 'active');
    candidates = new Set((data ?? []).map((r: any) => r.user_id));
  } else {
    // start from the union of profiles (paginate to bypass 1000-row default)
    candidates = new Set();
    const PAGE = 1000;
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .range(from, from + PAGE - 1);
      if (error) break;
      for (const r of data ?? []) candidates.add(r.id);
      if (!data || data.length < PAGE) break;
      from += PAGE;
    }
  }

  // include_programs (must be in at least one)
  if ((audience.include_programs?.length ?? 0) > 0) {
    const allowed = await pagedIds('course_enrollments', 'user_id', (q) =>
      q.in('program_slug', audience.include_programs!).eq('status', 'active'),
    );
    candidates = new Set([...candidates].filter((id) => allowed.has(id)));
  }

  // exclude_programs (must NOT be in any)
  if ((audience.exclude_programs?.length ?? 0) > 0) {
    const blocked = await pagedIds('course_enrollments', 'user_id', (q) =>
      q.in('program_slug', audience.exclude_programs!).eq('status', 'active'),
    );
    candidates = new Set([...candidates].filter((id) => !blocked.has(id)));
  }

  // include_playlists (saved-or-enrolled-via-program)
  if ((audience.include_playlists?.length ?? 0) > 0) {
    const allowed = await pagedIds('playlist_saves', 'user_id', (q) =>
      q.in('playlist_id', audience.include_playlists!),
    );
    candidates = new Set([...candidates].filter((id) => allowed.has(id)));
  }

  // exclude_playlists
  if ((audience.exclude_playlists?.length ?? 0) > 0) {
    const blocked = await pagedIds('playlist_saves', 'user_id', (q) =>
      q.in('playlist_id', audience.exclude_playlists!),
    );
    candidates = new Set([...candidates].filter((id) => !blocked.has(id)));
  }

  // target_languages (profiles.preferred_language)
  if ((audience.target_languages?.length ?? 0) > 0) {
    const allowed = await pagedIds('profiles', 'id', (q) =>
      q.in('preferred_language', audience.target_languages!),
    );
    candidates = new Set([...candidates].filter((id) => allowed.has(id)));
  }

  // target_timezones (profiles.timezone)
  if ((audience.target_timezones?.length ?? 0) > 0) {
    const allowed = await pagedIds('profiles', 'id', (q) =>
      q.in('timezone', audience.target_timezones!),
    );
    candidates = new Set([...candidates].filter((id) => allowed.has(id)));
  }

  // target_instructor_ids (referrals)
  if ((audience.target_instructor_ids?.length ?? 0) > 0) {
    const allowed = await pagedIds('instructor_referrals', 'user_id', (q) =>
      q.in('instructor_id', audience.target_instructor_ids!),
    );
    candidates = new Set([...candidates].filter((id) => allowed.has(id)));
  }

  // include_update_status: 'latest' | 'previous' based on app_installations + app_settings
  if ((audience.include_update_status?.length ?? 0) > 0) {
    const wantLatest = audience.include_update_status!.includes('latest');
    const wantPrev = audience.include_update_status!.includes('previous');
    if (!(wantLatest && wantPrev)) {
      const { data: settings } = await supabase
        .from('app_settings')
        .select('key,value')
        .in('key', ['latest_ios_version', 'latest_android_version']);
      const latestIos = settings?.find((s: any) => s.key === 'latest_ios_version')?.value ?? null;
      const latestAndroid = settings?.find((s: any) => s.key === 'latest_android_version')?.value ?? null;

      // Pull latest install row per user (paged)
      const userToInstall = new Map<string, { app_version: string | null; platform: string | null }>();
      let from = 0;
      const PAGE = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('app_installations')
          .select('user_id, app_version, platform, last_seen_at')
          .order('last_seen_at', { ascending: false })
          .range(from, from + PAGE - 1);
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
          if (!inst) return wantPrev; // unknown ≈ not on latest
          const latest =
            inst.platform === 'ios' ? latestIos :
            inst.platform === 'android' ? latestAndroid : null;
          const isLatest = !!latest && inst.app_version === latest;
          return isLatest ? wantLatest : wantPrev;
        }),
      );
    }
  }

  // include_tools / exclude_tools — no first-class "tool usage" table; skip
  // server-side. (PromoBanner evaluates client-side from local activity.)

  return candidates;
}

// Helper function to convert PEM format to ArrayBuffer
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

// Generate JWT token for APNs authentication
async function generateApnsJwt(authKey: string, keyId: string, teamId: string): Promise<string> {
  const keyData = pemToArrayBuffer(authKey);
  
  const key = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  
  return await create(
    { alg: 'ES256', kid: keyId },
    { iss: teamId, iat: Math.floor(Date.now() / 1000) },
    key
  );
}

// Send push notification to iOS via APNs
async function sendToApns(
  deviceToken: string, 
  payload: { title: string; body: string; url: string }, 
  jwt: string,
  topic: string,
  environment: string
): Promise<Response> {
  const apnsUrl = (environment === 'sandbox' || environment === 'development')
    ? `https://api.sandbox.push.apple.com/3/device/${deviceToken}`
    : `https://api.push.apple.com/3/device/${deviceToken}`;
  
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
      aps: {
        alert: { title: payload.title, body: payload.body },
        sound: 'default',
        badge: 1,
      },
      url: payload.url,
    }),
  });
}

// Generate email HTML
function generateEmailHtml(title: string, content: string, linkUrl?: string, linkText?: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .message { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: 600; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">📢 ${title}</h1>
          </div>
          <div class="content">
            <div class="message">
              ${content.replace(/\n/g, '<br>')}
            </div>
            ${linkUrl ? `<a href="${linkUrl}" class="button">${linkText || 'View Details'}</a>` : ''}
            <div class="footer">
              <p>© ${new Date().getFullYear()} Ladybosslook Academy. All rights reserved.</p>
              <p><a href="https://ladybosslook.com" style="color: #667eea; text-decoration: none;">ladybosslook.com</a></p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, content, targetType, targetCourse, targetRoundId, sendPush, sendEmail, linkUrl, linkText, excludeUserIds, excludeProgramSlugs, audience, audiencePresetId }: BroadcastRequest = await req.json();

    console.log('📢 Broadcast request:', { title, targetType, targetCourse, targetRoundId, sendPush, sendEmail, linkUrl, excludeUserIds: excludeUserIds?.length, excludeProgramSlugs, audiencePresetId });

    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: 'Title and content are required' }),
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

    // Verify admin role
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

    // Step 1: Create broadcast record
    const { data: broadcast, error: broadcastError } = await supabase
      .from('broadcast_messages')
      .insert({
        title,
        content,
        target_type: targetType,
        target_course: targetCourse || null,
        target_round_id: targetRoundId || null,
        created_by: user.id,
        send_push: sendPush,
        send_email: sendEmail,
        link_url: linkUrl || null,
        link_text: linkText || 'View Details',
      })
      .select()
      .single();

    if (broadcastError) {
      console.error('❌ Error creating broadcast:', broadcastError);
      throw broadcastError;
    }

    console.log('✅ Broadcast created:', broadcast.id);

    // Step 2: Get target users based on targeting
    let targetUserIds: string[] = [];

    if (targetType === 'all') {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id');
      targetUserIds = profiles?.map(p => p.id) || [];
    } else if (targetType === 'round' && targetRoundId) {
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('user_id')
        .eq('round_id', targetRoundId)
        .eq('status', 'active');
      targetUserIds = [...new Set(enrollments?.map(e => e.user_id) || [])];
    } else if (targetType === 'course' && targetCourse) {
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('user_id')
        .eq('program_slug', targetCourse)
        .eq('status', 'active');
      targetUserIds = [...new Set(enrollments?.map(e => e.user_id) || [])];
    }

    // Step 2b: Apply exclusions
    if (excludeUserIds && excludeUserIds.length > 0) {
      const excludeSet = new Set(excludeUserIds);
      targetUserIds = targetUserIds.filter(id => !excludeSet.has(id));
      console.log(`🚫 Excluded ${excludeUserIds.length} specific users`);
    }

    if (excludeProgramSlugs && excludeProgramSlugs.length > 0) {
      // Get all user IDs enrolled in excluded programs
      const { data: excludedEnrollments } = await supabase
        .from('course_enrollments')
        .select('user_id')
        .in('program_slug', excludeProgramSlugs)
        .eq('status', 'active');
      
      if (excludedEnrollments && excludedEnrollments.length > 0) {
        const excludeSet = new Set(excludedEnrollments.map(e => e.user_id));
        const before = targetUserIds.length;
        targetUserIds = targetUserIds.filter(id => !excludeSet.has(id));
        console.log(`🚫 Excluded ${before - targetUserIds.length} users from ${excludeProgramSlugs.length} program(s)`);
      }
    }

    // Step 2c: Apply Saved Audience filter (intersection)
    const audienceSet = await resolveAudienceUserIds(supabase, audience);
    if (audienceSet) {
      const before = targetUserIds.length;
      targetUserIds = targetUserIds.filter((id) => audienceSet.has(id));
      console.log(`🎯 Saved Audience narrowed ${before} → ${targetUserIds.length}`);
    }

    console.log(`📊 Found ${targetUserIds.length} target users after exclusions`);

    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          broadcastId: broadcast.id,
          messagesSent: 0,
          pushSent: 0,
          emailsSent: 0,
          message: 'No target users found'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Step 3: Build chat message content with link button indicator
    let chatContent = `📢 **${title}**\n\n${content}`;
    if (linkUrl) {
      chatContent += `\n\n🔗 LINK_BUTTON:${linkUrl}:${linkText || 'View Details'}`;
    }

    // Step 4: For each user, get or create conversation and insert broadcast message
    let messagesSent = 0;
    const conversationsToNotify: { conversationId: string; userId: string }[] = [];

    for (const userId of targetUserIds) {
      try {
        let { data: conversation } = await supabase
          .from('chat_conversations')
          .select('id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!conversation) {
          const { data: newConv, error: convError } = await supabase
            .from('chat_conversations')
            .insert({ user_id: userId, status: 'open' })
            .select()
            .single();

          if (convError) {
            console.error(`❌ Error creating conversation for ${userId}:`, convError);
            continue;
          }
          conversation = newConv;
        }
        if (!conversation) continue;

        const { error: msgError } = await supabase
          .from('chat_messages')
          .insert({
            conversation_id: conversation.id,
            sender_id: user.id,
            sender_type: 'admin',
            content: chatContent,
            is_broadcast: true,
            broadcast_id: broadcast.id,
          });

        if (msgError) {
          console.error(`❌ Error sending message to ${userId}:`, msgError);
          continue;
        }

        await supabase
          .from('chat_conversations')
          .update({ 
            unread_count_user: 1,
            last_message_at: new Date().toISOString()
          })
          .eq('id', conversation.id);

        messagesSent++;
        conversationsToNotify.push({ conversationId: conversation.id, userId });
      } catch (err: any) {
        console.error(`❌ Error processing user ${userId}:`, err);
      }
    }

    console.log(`✅ Messages sent to ${messagesSent} users`);

    // Step 5: Send push notifications if enabled
    let pushSent = 0;
    if (sendPush && conversationsToNotify.length > 0) {
      const authKey = Deno.env.get('APNS_AUTH_KEY');
      const keyId = Deno.env.get('APNS_KEY_ID');
      const teamId = Deno.env.get('APNS_TEAM_ID');
      const topic = Deno.env.get('APNS_TOPIC') || 'com.ladybosslook.academy';
      const apnsEnvironment = Deno.env.get('APNS_ENVIRONMENT') || 'production';

      if (authKey && keyId && teamId) {
        try {
          console.log('🔔 Generating APNs JWT...');
          const apnsJwt = await generateApnsJwt(authKey, keyId, teamId);

          const { data: subscriptions } = await supabase
            .from('push_subscriptions')
            .select('*')
            .in('user_id', conversationsToNotify.map(c => c.userId));

          console.log(`📲 Found ${subscriptions?.length || 0} push subscriptions`);

          const failedSubscriptions: string[] = [];

          for (const subscription of subscriptions || []) {
            try {
              const deviceToken = subscription.endpoint.replace('native:', '');
              const response = await sendToApns(
                deviceToken,
                { title: `📢 ${title}`, body: content.substring(0, 100), url: '/app/chat' },
                apnsJwt,
                topic,
                apnsEnvironment
              );

              if (response.ok) {
                pushSent++;
              } else {
                const errorBody = await response.text();
                console.error(`❌ APNs error (${response.status}):`, errorBody);
                if (response.status === 410 || response.status === 400) {
                  failedSubscriptions.push(subscription.id);
                }
              }
            } catch (err: any) {
              console.error('❌ Push error:', err);
              failedSubscriptions.push(subscription.id);
            }
          }

          if (failedSubscriptions.length > 0) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .in('id', failedSubscriptions);
          }

          console.log(`✅ Push notifications sent: ${pushSent}`);
        } catch (err: any) {
          console.error('❌ Error sending push notifications:', err);
        }
      }
    }

    // Step 6: Send emails if enabled
    let emailsSent = 0;
    if (sendEmail && conversationsToNotify.length > 0) {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      
      if (resendApiKey) {
        console.log('📧 Sending emails...');
        const resend = new Resend(resendApiKey);

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', conversationsToNotify.map(c => c.userId))
          .not('email', 'is', null);

        const emailHtml = generateEmailHtml(title, content, linkUrl, linkText);

        for (const profile of profiles || []) {
          try {
            const result = await resend.emails.send({
              from: "Support Ladyboss <support@ladybosslook.com>",
              to: [profile.email],
              subject: `📢 ${title}`,
              html: emailHtml,
            });

            if (result.data?.id) {
              emailsSent++;
              console.log(`✅ Email sent to ${profile.email}`);
            }
          } catch (err: any) {
            console.error(`❌ Email error for ${profile.email}:`, err);
          }
        }

        console.log(`✅ Emails sent: ${emailsSent}`);
      } else {
        console.log('⚠️ RESEND_API_KEY not configured, skipping emails');
      }
    }

    // Update broadcast with sent count
    await supabase
      .from('broadcast_messages')
      .update({ sent_count: messagesSent })
      .eq('id', broadcast.id);

    return new Response(
      JSON.stringify({
        success: true,
        broadcastId: broadcast.id,
        messagesSent,
        pushSent,
        emailsSent,
        targetUsers: targetUserIds.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Error in send-broadcast-message:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
};

serve(handler);
