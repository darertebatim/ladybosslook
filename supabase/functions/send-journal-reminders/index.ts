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
    console.error(`[Journal Reminder] APNs error for ${deviceToken}:`, response.status, errorBody);
    return { success: false, error: `APNs ${response.status}: ${errorBody}` };
  } catch (error) {
    console.error(`[Journal Reminder] Failed to send to ${deviceToken}:`, error);
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
    const apnsPrivateKey = Deno.env.get('APNS_AUTH_KEY'); // Fixed: was APNS_PRIVATE_KEY
    const apnsEnvironment = Deno.env.get('APNS_ENVIRONMENT') || 'production';
    const bundleId = Deno.env.get('APNS_TOPIC') || 'app.lovable.9d54663c1af540669ceb1723206ae5f8';
    
    if (!apnsKeyId || !apnsTeamId || !apnsPrivateKey) {
      console.error('[Journal Reminder] Missing APNs credentials');
      return new Response(
        JSON.stringify({ error: 'APNs not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get current time in various timezones and find users who should be reminded
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    
    console.log(`[Journal Reminder] Running at UTC ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);
    
    // Get users with enabled reminders
    // We'll calculate which users should be reminded based on their timezone
    const { data: reminderSettings, error: settingsError } = await supabase
      .from('journal_reminder_settings')
      .select('user_id, reminder_time, timezone')
      .eq('enabled', true);
    
    if (settingsError) {
      console.error('[Journal Reminder] Error fetching settings:', settingsError);
      throw settingsError;
    }
    
    if (!reminderSettings || reminderSettings.length === 0) {
      console.log('[Journal Reminder] No enabled reminders found');
      return new Response(
        JSON.stringify({ success: true, message: 'No reminders to send', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Filter users whose reminder time matches current time in their timezone
    const usersToNotify: string[] = [];
    
    for (const setting of reminderSettings) {
      const [reminderHour, reminderMinute] = setting.reminder_time.split(':').map(Number);
      const userTimezone = setting.timezone || 'America/Los_Angeles';
      
      try {
        // Get current time in user's timezone
        const userTime = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
        const userHour = userTime.getHours();
        const userMinuteBucket = Math.floor(userTime.getMinutes() / 15) * 15; // Round to 15-min bucket
        
        // Check if it's time to remind (within 15-minute window)
        if (userHour === reminderHour && Math.abs(userTime.getMinutes() - reminderMinute) < 15) {
          usersToNotify.push(setting.user_id);
          console.log(`[Journal Reminder] User ${setting.user_id} scheduled for reminder at ${setting.reminder_time} (${userTimezone})`);
        }
      } catch (e) {
        console.error(`[Journal Reminder] Invalid timezone for user ${setting.user_id}:`, userTimezone);
      }
    }
    
    if (usersToNotify.length === 0) {
      console.log('[Journal Reminder] No users to notify at this time');
      return new Response(
        JSON.stringify({ success: true, message: 'No reminders due now', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get push subscriptions for these users
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('user_id, endpoint')
      .in('user_id', usersToNotify)
      .like('endpoint', 'native:%');
    
    if (subsError) {
      console.error('[Journal Reminder] Error fetching subscriptions:', subsError);
      throw subsError;
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      console.log('[Journal Reminder] No push subscriptions found for users');
      return new Response(
        JSON.stringify({ success: true, message: 'No devices to notify', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Generate JWT once for all notifications
    const jwt = await generateAPNsJWT(apnsKeyId, apnsTeamId, apnsPrivateKey);
    
    // Send notifications
    let sentCount = 0;
    let failedCount = 0;
    
    const title = '✏️ Time to Journal';
    const body = 'Take a moment to reflect on your day';
    const data = {
      type: 'journal_reminder',
      url: '/app/journal/new',
    };
    
    for (const sub of subscriptions) {
      const deviceToken = sub.endpoint.replace('native:', '');
      const result = await sendToApns(deviceToken, title, body, data, jwt, bundleId, apnsEnvironment);
      
      if (result.success) {
        sentCount++;
        
        // Update last_reminded_at
        await supabase
          .from('journal_reminder_settings')
          .update({ last_reminded_at: new Date().toISOString() })
          .eq('user_id', sub.user_id);
      } else {
        failedCount++;
        console.error(`[Journal Reminder] Failed for user ${sub.user_id}:`, result.error);
      }
    }
    
    console.log(`[Journal Reminder] Sent: ${sentCount}, Failed: ${failedCount}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount, 
        failed: failedCount,
        totalUsers: usersToNotify.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[Journal Reminder] Error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});