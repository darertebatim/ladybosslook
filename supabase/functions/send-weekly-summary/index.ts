import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sign JWT for APNs
async function signJWT(header: Record<string, unknown>, payload: Record<string, unknown>, privateKey: string): Promise<string> {
  const encoder = new TextEncoder();
  
  const base64urlEncode = (data: Uint8Array): string => {
    const base64 = btoa(String.fromCharCode(...data));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  
  const stringToBase64url = (str: string): string => {
    const bytes = encoder.encode(str);
    return base64urlEncode(bytes);
  };
  
  const headerB64 = stringToBase64url(JSON.stringify(header));
  const payloadB64 = stringToBase64url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;
  
  const pemContents = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    encoder.encode(signingInput)
  );
  
  const signatureArray = new Uint8Array(signature);
  const signatureB64 = base64urlEncode(signatureArray);
  
  return `${signingInput}.${signatureB64}`;
}

function generateAPNsJWT(keyId: string, teamId: string, privateKey: string): Promise<string> {
  const header = { alg: 'ES256', kid: keyId };
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: teamId, iat: now };
  return signJWT(header, payload, privateKey);
}

async function sendToApns(
  deviceToken: string,
  title: string,
  body: string,
  data: Record<string, unknown>,
  jwt: string,
  topic: string,
  environment: string
): Promise<{ success: boolean; error?: string }> {
  const host = environment === 'production' 
    ? 'api.push.apple.com' 
    : 'api.sandbox.push.apple.com';
  
  const url = `https://${host}/3/device/${deviceToken}`;
  
  const payload = {
    aps: {
      alert: { title, body },
      sound: 'default',
      badge: 1,
      'mutable-content': 1,
    },
    ...data,
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'authorization': `bearer ${jwt}`,
        'apns-topic': topic,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (response.ok) {
      return { success: true };
    }
    
    const errorBody = await response.text();
    console.error(`[Weekly Summary] APNs error for ${deviceToken}:`, response.status, errorBody);
    return { success: false, error: `APNs ${response.status}: ${errorBody}` };
  } catch (error) {
    console.error(`[Weekly Summary] Failed to send to ${deviceToken}:`, error);
    return { success: false, error: String(error) };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const apnsKeyId = Deno.env.get('APNS_KEY_ID');
    const apnsTeamId = Deno.env.get('APNS_TEAM_ID');
    const apnsPrivateKey = Deno.env.get('APNS_AUTH_KEY');
    const apnsEnvironment = Deno.env.get('APNS_ENVIRONMENT') || 'production';
    const bundleId = Deno.env.get('APNS_TOPIC') || 'app.lovable.9d54663c1af540669ceb1723206ae5f8';
    
    if (!apnsKeyId || !apnsTeamId || !apnsPrivateKey) {
      console.error('[Weekly Summary] Missing APNs credentials');
      return new Response(
        JSON.stringify({ error: 'APNs not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    
    console.log(`[Weekly Summary] Running at UTC ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);
    
    // Get date range for the past week
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekStart = oneWeekAgo.toISOString();
    
    // Get users with push subscriptions along with their timezone preference
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('user_id, endpoint')
      .like('endpoint', 'native:%');
    
    if (subsError || !subscriptions || subscriptions.length === 0) {
      console.log('[Weekly Summary] No push subscriptions found');
      return new Response(
        JSON.stringify({ success: true, message: 'No users to notify', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Group subscriptions by user
    const userSubscriptions = new Map<string, string[]>();
    for (const sub of subscriptions) {
      const tokens = userSubscriptions.get(sub.user_id) || [];
      tokens.push(sub.endpoint.replace('native:', ''));
      userSubscriptions.set(sub.user_id, tokens);
    }
    
    const userIds = Array.from(userSubscriptions.keys());
    
    // Get timezone preferences from journal_reminder_settings (if available)
    const { data: timezoneSettings } = await supabase
      .from('journal_reminder_settings')
      .select('user_id, timezone')
      .in('user_id', userIds);
    
    const userTimezones = new Map<string, string>();
    for (const setting of timezoneSettings || []) {
      if (setting.timezone) {
        userTimezones.set(setting.user_id, setting.timezone);
      }
    }
    
    // Filter users whose local time is 9 AM on a Monday
    const usersToNotify: string[] = [];
    for (const userId of userIds) {
      const timezone = userTimezones.get(userId) || 'America/Los_Angeles';
      
      try {
        // Get current time in user's timezone
        const userTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
        const userHour = userTime.getHours();
        const userDay = userTime.getDay(); // 0 = Sunday, 1 = Monday
        
        // Check if it's Monday (day 1) at 9 AM (within 30-minute window)
        if (userDay === 1 && userHour === 9 && userTime.getMinutes() < 30) {
          usersToNotify.push(userId);
          console.log(`[Weekly Summary] User ${userId} in ${timezone} - it's Monday 9 AM for them`);
        }
      } catch (e) {
        console.error(`[Weekly Summary] Invalid timezone for user ${userId}:`, timezone);
      }
    }
    
    if (usersToNotify.length === 0) {
      console.log('[Weekly Summary] No users to notify at this time');
      return new Response(
        JSON.stringify({ success: true, message: 'No users in Monday 9 AM window', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get completed tasks for users to notify this week
    const { data: completedTasks } = await supabase
      .from('user_tasks')
      .select('user_id, id')
      .in('user_id', usersToNotify)
      .eq('completed', true)
      .gte('updated_at', weekStart);
    
    // Get audio progress for users to notify this week
    const { data: audioProgress } = await supabase
      .from('user_audio_progress')
      .select('user_id, audio_id')
      .in('user_id', usersToNotify)
      .eq('completed', true)
      .gte('updated_at', weekStart);
    
    // Get journal entries for users to notify this week
    const { data: journalEntries } = await supabase
      .from('journal_entries')
      .select('user_id, id')
      .in('user_id', usersToNotify)
      .gte('created_at', weekStart);
    
    // Aggregate stats per user (only for users to notify)
    const userStats = new Map<string, { tasks: number; audio: number; journals: number }>();
    
    for (const userId of usersToNotify) {
      userStats.set(userId, { tasks: 0, audio: 0, journals: 0 });
    }
    
    for (const task of completedTasks || []) {
      const stats = userStats.get(task.user_id);
      if (stats) stats.tasks++;
    }
    
    for (const audio of audioProgress || []) {
      const stats = userStats.get(audio.user_id);
      if (stats) stats.audio++;
    }
    
    for (const journal of journalEntries || []) {
      const stats = userStats.get(journal.user_id);
      if (stats) stats.journals++;
    }
    
    // Generate JWT once for all notifications
    const jwt = await generateAPNsJWT(apnsKeyId, apnsTeamId, apnsPrivateKey);
    
    let sentCount = 0;
    let failedCount = 0;
    
    for (const [userId, stats] of userStats) {
      const tokens = userSubscriptions.get(userId) || [];
      if (tokens.length === 0) continue;
      
      // Skip users with no activity
      if (stats.tasks === 0 && stats.audio === 0 && stats.journals === 0) {
        continue;
      }
      
      // Generate personalized message
      const parts: string[] = [];
      if (stats.tasks > 0) parts.push(`${stats.tasks} task${stats.tasks > 1 ? 's' : ''} completed`);
      if (stats.audio > 0) parts.push(`${stats.audio} lesson${stats.audio > 1 ? 's' : ''} listened`);
      if (stats.journals > 0) parts.push(`${stats.journals} journal entr${stats.journals > 1 ? 'ies' : 'y'}`);
      
      const title = '🎉 Your Weekly Progress';
      const body = parts.length > 0 
        ? `Great week! ${parts.join(', ')}. Keep up the momentum!`
        : 'Start this week strong! Open the app to continue your journey.';
      
      const data = {
        type: 'weekly_summary',
        url: '/app',
        stats: {
          tasks: stats.tasks,
          audio: stats.audio,
          journals: stats.journals
        }
      };
      
      // Send to all user's devices
      for (const token of tokens) {
        const result = await sendToApns(token, title, body, data, jwt, bundleId, apnsEnvironment);
        
        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
        }
      }
    }
    
    // Log the run
    await supabase.from('pn_schedule_logs').insert({
      function_name: 'send-weekly-summary',
      sent_count: sentCount,
      failed_count: failedCount,
      status: failedCount === 0 ? 'success' : 'partial',
    });
    
    // Update schedule last run
    await supabase
      .from('push_notification_schedules')
      .update({ 
        last_run_at: new Date().toISOString(),
        last_run_status: failedCount === 0 ? 'success' : 'partial',
        last_run_count: sentCount
      })
      .eq('function_name', 'send-weekly-summary');
    
    console.log(`[Weekly Summary] Sent: ${sentCount}, Failed: ${failedCount}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount, 
        failed: failedCount,
        users_processed: userIds.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[Weekly Summary] Error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
