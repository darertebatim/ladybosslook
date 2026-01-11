import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Convert PEM to ArrayBuffer for crypto operations
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate APNs JWT token
async function generateApnsJwt(privateKeyPem: string, keyId: string, teamId: string): Promise<string> {
  const header = { alg: 'ES256', kid: keyId };
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: teamId, iat: now };
  
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${headerB64}.${payloadB64}`;
  
  const keyData = pemToArrayBuffer(privateKeyPem);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    encoder.encode(unsignedToken)
  );
  
  const signatureArray = new Uint8Array(signature);
  let signatureB64 = btoa(String.fromCharCode(...signatureArray));
  signatureB64 = signatureB64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  return `${unsignedToken}.${signatureB64}`;
}

// Send push notification via APNs
async function sendToApns(
  deviceToken: string,
  jwt: string,
  topic: string,
  title: string,
  body: string,
  data: Record<string, string>,
  environment: string
): Promise<{ success: boolean; error?: string }> {
  const apnsHost = environment === 'production' 
    ? 'api.push.apple.com' 
    : 'api.sandbox.push.apple.com';

  const payload = {
    aps: {
      alert: { title, body },
      sound: 'default',
      badge: 1,
    },
    ...data,
  };

  try {
    const response = await fetch(`https://${apnsHost}/3/device/${deviceToken}`, {
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
    } else {
      const errorText = await response.text();
      return { success: false, error: `${response.status}: ${errorText}` };
    }
  } catch (error) {
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get APNs credentials
    const apnsAuthKey = Deno.env.get('APNS_AUTH_KEY');
    const apnsKeyId = Deno.env.get('APNS_KEY_ID');
    const apnsTeamId = Deno.env.get('APNS_TEAM_ID');
    const apnsTopic = Deno.env.get('APNS_TOPIC');
    const apnsEnvironment = Deno.env.get('APNS_ENVIRONMENT') || 'production';

    if (!apnsAuthKey || !apnsKeyId || !apnsTeamId || !apnsTopic) {
      console.error('Missing APNs configuration');
      return new Response(JSON.stringify({ error: 'Missing APNs configuration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching journal reminder settings...');

    // Get all users with reminders enabled
    const { data: reminderSettings, error: settingsError } = await supabase
      .from('journal_reminder_settings')
      .select('*')
      .eq('enabled', true);

    if (settingsError) {
      console.error('Error fetching reminder settings:', settingsError);
      throw settingsError;
    }

    if (!reminderSettings || reminderSettings.length === 0) {
      console.log('No active journal reminders found');
      return new Response(JSON.stringify({ message: 'No active reminders', sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${reminderSettings.length} active reminder settings`);

    // Get current time for each timezone and check who should be notified
    const usersToNotify: string[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (const setting of reminderSettings) {
      // Skip if already reminded today
      if (setting.last_reminded_at === today) {
        console.log(`User ${setting.user_id} already reminded today, skipping`);
        continue;
      }

      // Get current time in user's timezone
      const now = new Date();
      const userTime = new Date(now.toLocaleString('en-US', { timeZone: setting.timezone }));
      const currentHour = userTime.getHours();
      const currentMinute = userTime.getMinutes();
      
      // Parse reminder time (format: "HH:MM:SS" or "HH:MM")
      const [reminderHour, reminderMinute] = setting.reminder_time.split(':').map(Number);
      
      // Check if current time is within 15 minutes of reminder time
      const currentTotalMinutes = currentHour * 60 + currentMinute;
      const reminderTotalMinutes = reminderHour * 60 + reminderMinute;
      
      // Within a 15-minute window (the cron runs every 15 minutes)
      if (currentTotalMinutes >= reminderTotalMinutes && currentTotalMinutes < reminderTotalMinutes + 15) {
        console.log(`User ${setting.user_id} is due for reminder at ${setting.reminder_time} (current: ${currentHour}:${currentMinute})`);
        usersToNotify.push(setting.user_id);
      }
    }

    if (usersToNotify.length === 0) {
      console.log('No users need reminders at this time');
      return new Response(JSON.stringify({ message: 'No users to notify', sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`${usersToNotify.length} users to notify`);

    // Get push subscriptions for these users
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', usersToNotify);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found for users to notify');
      return new Response(JSON.stringify({ message: 'No subscriptions', sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${subscriptions.length} push subscriptions`);

    // Generate APNs JWT
    const jwt = await generateApnsJwt(apnsAuthKey, apnsKeyId, apnsTeamId);

    let sentCount = 0;
    let failedCount = 0;
    const notifiedUsers: string[] = [];

    // Send notifications
    for (const sub of subscriptions) {
      const result = await sendToApns(
        sub.endpoint, // This is the device token for iOS
        jwt,
        apnsTopic,
        '📔 Time to Journal',
        'Take a moment to reflect on your day and write in your journal.',
        { url: '/app/journal/new' },
        apnsEnvironment
      );

      if (result.success) {
        sentCount++;
        if (!notifiedUsers.includes(sub.user_id)) {
          notifiedUsers.push(sub.user_id);
        }
        console.log(`Successfully sent to user ${sub.user_id}`);
      } else {
        failedCount++;
        console.error(`Failed to send to user ${sub.user_id}:`, result.error);
        
        // Remove invalid tokens
        if (result.error?.includes('BadDeviceToken') || result.error?.includes('Unregistered')) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id);
          console.log(`Removed invalid subscription ${sub.id}`);
        }
      }
    }

    // Update last_reminded_at for notified users
    if (notifiedUsers.length > 0) {
      const { error: updateError } = await supabase
        .from('journal_reminder_settings')
        .update({ last_reminded_at: today })
        .in('user_id', notifiedUsers);

      if (updateError) {
        console.error('Error updating last_reminded_at:', updateError);
      }
    }

    console.log(`Journal reminders complete: ${sentCount} sent, ${failedCount} failed`);

    return new Response(JSON.stringify({
      message: 'Journal reminders sent',
      sent: sentCount,
      failed: failedCount,
      usersNotified: notifiedUsers.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-journal-reminders:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
