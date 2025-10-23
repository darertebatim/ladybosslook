import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { encode as base64UrlEncode } from "https://deno.land/std@0.190.0/encoding/base64url.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  userIds?: string[];
  targetCourse?: string;
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userIds, targetCourse, title, body, icon, url }: PushNotificationRequest = await req.json();

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: 'Title and body are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get target user subscriptions
    let query = supabase.from('push_subscriptions').select('*');

    if (userIds && userIds.length > 0) {
      query = query.in('user_id', userIds);
    } else if (targetCourse) {
      // Get users enrolled in the target course
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('user_id')
        .eq('course_name', targetCourse);

      if (enrollments && enrollments.length > 0) {
        const enrolledUserIds = enrollments.map(e => e.user_id);
        query = query.in('user_id', enrolledUserIds);
      }
    }

    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscriptions found for target users');
      return new Response(
        JSON.stringify({ message: 'No subscriptions found', sent: 0, failed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    let successCount = 0;
    let failedCount = 0;
    const failedSubscriptions: string[] = [];

    // Generate VAPID JWT token
    const vapidHeader = {
      typ: 'JWT',
      alg: 'ES256',
    };

    const jwtPayload = {
      aud: new URL(subscriptions[0]?.endpoint).origin,
      exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 hours
      sub: 'mailto:noreply@lovable.app',
    };

    // Import VAPID private key
    const privateKeyBuffer = Uint8Array.from(atob(vapidPrivateKey.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );

    // Create JWT
    const encoder = new TextEncoder();
    const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(vapidHeader)));
    const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(jwtPayload)));
    const unsignedToken = `${headerB64}.${payloadB64}`;
    
    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      privateKey,
      encoder.encode(unsignedToken)
    );
    
    const signatureB64 = base64UrlEncode(new Uint8Array(signature));
    const jwt = `${unsignedToken}.${signatureB64}`;

    // Send push notifications
    for (const subscription of subscriptions) {
      try {
        const payload = JSON.stringify({
          title,
          body,
          icon: icon || '/pwa-192x192.png',
          url: url || '/app/home',
        });

        const response = await fetch(subscription.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Encoding': 'aes128gcm',
            'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
            'TTL': '86400',
          },
          body: payload,
        });

        if (response.ok || response.status === 201) {
          successCount++;
          console.log(`Push notification sent to user ${subscription.user_id}`);
        } else {
          failedCount++;
          failedSubscriptions.push(subscription.id);
          console.error(`Failed to send push notification to user ${subscription.user_id}:`, response.status, await response.text());
        }
      } catch (error: any) {
        failedCount++;
        failedSubscriptions.push(subscription.id);
        console.error(`Error sending push notification to user ${subscription.user_id}:`, error);
      }
    }

    // Remove failed subscriptions from database
    if (failedSubscriptions.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', failedSubscriptions);
      console.log(`Removed ${failedSubscriptions.length} invalid subscriptions`);
    }

    return new Response(
      JSON.stringify({
        message: 'Push notifications sent',
        sent: successCount,
        failed: failedCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
};

serve(handler);
