import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Sync PN Config - Send silent push to all devices to resync notification config
 * 
 * Called when admin updates pn_config table.
 * Sends a silent/background push notification to wake up apps and trigger config resync.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all active push subscriptions with device tokens
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, device_token, platform')
      .not('device_token', 'is', null)
      .eq('platform', 'ios');

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No subscriptions to sync', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // APNs credentials
    const APNS_KEY_ID = Deno.env.get('APNS_KEY_ID');
    const APNS_TEAM_ID = Deno.env.get('APNS_TEAM_ID');
    const APNS_AUTH_KEY = Deno.env.get('APNS_AUTH_KEY');
    const APNS_TOPIC = Deno.env.get('APNS_TOPIC');
    const APNS_ENVIRONMENT = Deno.env.get('APNS_ENVIRONMENT') || 'production';

    if (!APNS_KEY_ID || !APNS_TEAM_ID || !APNS_AUTH_KEY || !APNS_TOPIC) {
      throw new Error('Missing APNs credentials');
    }

    // Import JWT library for APNs auth
    const { default: jwt } = await import('https://esm.sh/jsonwebtoken@9.0.0');

    // Create APNs JWT token
    const token = jwt.sign(
      { iss: APNS_TEAM_ID, iat: Math.floor(Date.now() / 1000) },
      APNS_AUTH_KEY.replace(/\\n/g, '\n'),
      { algorithm: 'ES256', header: { alg: 'ES256', kid: APNS_KEY_ID } }
    );

    const apnsHost = APNS_ENVIRONMENT === 'production'
      ? 'https://api.push.apple.com'
      : 'https://api.development.push.apple.com';

    let sent = 0;
    let failed = 0;

    // Send silent push to each device
    for (const sub of subscriptions) {
      try {
        // Silent push payload - content-available triggers background fetch
        const payload = {
          aps: {
            'content-available': 1,
          },
          type: 'pn_config_sync',
        };

        const response = await fetch(
          `${apnsHost}/3/device/${sub.device_token}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'apns-topic': APNS_TOPIC,
              'apns-push-type': 'background',
              'apns-priority': '5', // Low priority for background
            },
            body: JSON.stringify(payload),
          }
        );

        if (response.ok) {
          sent++;
        } else {
          const errorText = await response.text();
          console.error(`Failed to send to ${sub.id}:`, errorText);
          failed++;

          // Remove invalid tokens
          if (response.status === 410 || response.status === 400) {
            await supabase
              .from('push_subscriptions')
              .update({ device_token: null })
              .eq('id', sub.id);
          }
        }
      } catch (err) {
        console.error(`Error sending to ${sub.id}:`, err);
        failed++;
      }
    }

    console.log(`[SyncPNConfig] Sent: ${sent}, Failed: ${failed}`);

    return new Response(
      JSON.stringify({ success: true, sent, failed, total: subscriptions.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in sync-pn-config:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
