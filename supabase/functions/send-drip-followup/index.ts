import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

/**
 * Drip Content Follow-up Push Notifications
 * 
 * Checks for users who have unlocked drip content but haven't listened.
 * Sends a follow-up notification if content was unlocked 2+ days ago
 * and no audio_progress exists for that item.
 * 
 * Only 1 follow-up per content item (tracked in pn_schedule_logs).
 * Runs daily via cron.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function signJWT(header: Record<string, unknown>, payload: Record<string, unknown>, privateKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const base64urlEncode = (data: Uint8Array): string => {
    const base64 = btoa(String.fromCharCode(...data));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  const stringToBase64url = (str: string): string => base64urlEncode(encoder.encode(str));
  
  const headerB64 = stringToBase64url(JSON.stringify(header));
  const payloadB64 = stringToBase64url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;
  
  const pemContents = privateKey.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\s/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey('pkcs8', binaryKey, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, cryptoKey, encoder.encode(signingInput));
  
  return `${signingInput}.${base64urlEncode(new Uint8Array(signature))}`;
}

async function sendToApns(
  deviceToken: string, title: string, body: string,
  data: Record<string, unknown>, jwt: string, topic: string, environment: string
): Promise<{ success: boolean; shouldRemove?: boolean }> {
  const host = environment === 'production' ? 'api.push.apple.com' : 'api.sandbox.push.apple.com';
  try {
    const response = await fetch(`https://${host}/3/device/${deviceToken}`, {
      method: 'POST',
      headers: {
        'authorization': `bearer ${jwt}`,
        'apns-topic': topic,
        'apns-push-type': 'alert',
        'apns-priority': '5',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ aps: { alert: { title, body }, sound: 'default', badge: 1, 'mutable-content': 1 }, ...data }),
    });
    if (response.ok) return { success: true };
    const err = await response.text();
    console.error(`[DripFollowup] APNs error:`, response.status, err);
    return { success: false, shouldRemove: response.status === 410 || response.status === 400 };
  } catch (e) {
    console.error('[DripFollowup] Send failed:', e);
    return { success: false };
  }
}

function isWithinActiveWindow(userTimezone: string | null): boolean {
  try {
    const tz = userTimezone || 'America/Los_Angeles';
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false });
    const hour = parseInt(formatter.format(now), 10);
    return hour >= 8 && hour < 20;
  } catch {
    return true;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apnsKeyId = Deno.env.get('APNS_KEY_ID');
    const apnsTeamId = Deno.env.get('APNS_TEAM_ID');
    const apnsPrivateKey = Deno.env.get('APNS_AUTH_KEY');
    const apnsEnvironment = Deno.env.get('APNS_ENVIRONMENT') || 'production';
    const bundleId = Deno.env.get('APNS_TOPIC') || 'app.lovable.9d54663c1af540669ceb1723206ae5f8';

    if (!apnsKeyId || !apnsTeamId || !apnsPrivateKey) {
      return new Response(JSON.stringify({ error: 'APNs not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    console.log(`[DripFollowup] Running at ${now.toISOString()}`);

    // Get all enrollments with their dates
    const { data: enrollments, error: enrollError } = await supabase
      .from('course_enrollments')
      .select('user_id, enrolled_at, round_id');

    if (enrollError) throw enrollError;
    if (!enrollments || enrollments.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No enrollments', count: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get all playlist items with drip delays
    const { data: playlistItems } = await supabase
      .from('audio_playlist_items')
      .select('id, audio_id, playlist_id, drip_delay_days, sort_order')
      .gt('drip_delay_days', 0);

    if (!playlistItems || playlistItems.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No drip items', count: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get audio titles for messages
    const audioIds = [...new Set(playlistItems.map(p => p.audio_id))];
    const { data: audioContent } = await supabase
      .from('audio_content')
      .select('id, title')
      .in('id', audioIds);
    const audioTitles = new Map(audioContent?.map(a => [a.id, a.title]) || []);

    // Get round -> playlist mapping
    const roundIds = [...new Set(enrollments.map(e => e.round_id).filter(Boolean))];
    const { data: rounds } = await supabase
      .from('program_rounds')
      .select('id, audio_playlist_id')
      .in('id', roundIds);
    const roundPlaylistMap = new Map(rounds?.map(r => [r.id, r.audio_playlist_id]) || []);

    // Check which followups we already sent
    const { data: alreadySent } = await supabase
      .from('pn_schedule_logs')
      .select('user_id, notification_type')
      .like('notification_type', 'drip_followup_%');
    const sentSet = new Set(alreadySent?.map(s => `${s.user_id}:${s.notification_type}`) || []);

    // Get all user audio progress
    const { data: progress } = await supabase
      .from('audio_progress')
      .select('user_id, audio_id');
    const progressSet = new Set(progress?.map(p => `${p.user_id}:${p.audio_id}`) || []);

    // Check preferences and get timezones
    const allUserIds = [...new Set(enrollments.map(e => e.user_id))];
    const { data: prefs } = await supabase
      .from('user_notification_preferences')
      .select('user_id, content_drip')
      .in('user_id', allUserIds);
    const prefsMap = new Map(prefs?.map(p => [p.user_id, p.content_drip]) || []);

    // Get user timezones for active window check
    const { data: userProfiles } = await supabase
      .from('profiles')
      .select('id, timezone')
      .in('id', allUserIds);
    const timezoneMap = new Map(userProfiles?.map(p => [p.id, p.timezone]) || []);

    // Build notifications to send — MAX 1 per user (most recently unlocked item)
    const userBestItem = new Map<string, { userId: string; audioId: string; title: string; itemId: string; dripDelay: number }>();

    for (const enrollment of enrollments) {
      const pref = prefsMap.get(enrollment.user_id);
      if (pref === false) continue;

      // Skip if user is outside their active window (8 AM - 8 PM local)
      const userTz = timezoneMap.get(enrollment.user_id);
      if (!isWithinActiveWindow(userTz)) continue;

      const playlistId = enrollment.round_id ? roundPlaylistMap.get(enrollment.round_id) : null;
      if (!playlistId) continue;

      const enrollDate = new Date(enrollment.enrolled_at);
      const daysSinceEnroll = Math.floor((now.getTime() - enrollDate.getTime()) / (1000 * 60 * 60 * 24));

      const relevantItems = playlistItems.filter(p => 
        p.playlist_id === playlistId &&
        p.drip_delay_days <= daysSinceEnroll && // unlocked
        daysSinceEnroll - p.drip_delay_days >= 2 // unlocked 2+ days ago
      );

      for (const item of relevantItems) {
        const logKey = `drip_followup_${item.audio_id}`;
        if (sentSet.has(`${enrollment.user_id}:${logKey}`)) continue;
        if (progressSet.has(`${enrollment.user_id}:${item.audio_id}`)) continue;

        const title = audioTitles.get(item.audio_id) || 'New Content';
        
        // Keep only the most recently unlocked item per user
        const existing = userBestItem.get(enrollment.user_id);
        if (!existing || item.drip_delay_days > existing.dripDelay) {
          userBestItem.set(enrollment.user_id, { userId: enrollment.user_id, audioId: item.audio_id, title, itemId: item.id, dripDelay: item.drip_delay_days });
        }
      }
    }

    const toSend = Array.from(userBestItem.values());

    console.log(`[DripFollowup] Found ${toSend.length} follow-ups to send`);

    if (toSend.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No followups needed', count: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get push subscriptions for these users
    const targetUserIds = [...new Set(toSend.map(t => t.userId))];
    const { data: subs } = await supabase.from('push_subscriptions').select('user_id, endpoint, id').in('user_id', targetUserIds).like('endpoint', 'native:%');

    const userSubs = new Map<string, typeof subs>();
    for (const sub of (subs || [])) {
      const existing = userSubs.get(sub.user_id) || [];
      existing.push(sub);
      userSubs.set(sub.user_id, existing);
    }

    const jwt = await signJWT({ alg: 'ES256', kid: apnsKeyId }, { iss: apnsTeamId, iat: Math.floor(Date.now() / 1000) }, apnsPrivateKey);

    let sentCount = 0;
    const invalidIds: string[] = [];
    const logsToInsert: any[] = [];

    for (const item of toSend) {
      const devices = userSubs.get(item.userId);
      if (!devices || devices.length === 0) continue;

      const messages = [
        `🎧 "${item.title}" is waiting for you. Tap to listen.`,
        `🔓 You unlocked "${item.title}" — don't miss it!`,
      ];
      const body = messages[Math.floor(Math.random() * messages.length)];

      for (const device of devices) {
        const token = device.endpoint.replace('native:', '');
        const result = await sendToApns(token, '🎧 Content Waiting', body, { type: 'drip_followup', url: '/app/audio' }, jwt, bundleId, apnsEnvironment);
        if (result.success) sentCount++;
        else if (result.shouldRemove) invalidIds.push(device.id);
      }

      logsToInsert.push({
        user_id: item.userId,
        function_name: 'send-drip-followup',
        notification_type: `drip_followup_${item.audioId}`,
        scheduled_for: now.toISOString(),
        sent_at: now.toISOString(),
        status: 'sent',
      });
    }

    if (logsToInsert.length > 0) await supabase.from('pn_schedule_logs').insert(logsToInsert);
    if (invalidIds.length > 0) await supabase.from('push_subscriptions').delete().in('id', invalidIds);

    console.log(`[DripFollowup] Complete: Sent ${sentCount}`);
    return new Response(JSON.stringify({ success: true, sent: sentCount, followups: toSend.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[DripFollowup] Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
