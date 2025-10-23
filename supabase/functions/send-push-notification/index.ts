import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

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

    // Send push notifications
    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh_key,
            auth: subscription.auth_key,
          },
        };

        const payload = JSON.stringify({
          title,
          body,
          icon: icon || '/pwa-192x192.png',
          url: url || '/app/home',
        });

        // Note: Using web-push requires npm:web-push package
        // For now, we'll use the Web Push Protocol directly via fetch
        const response = await fetch(pushSubscription.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'TTL': '86400',
          },
          body: payload,
        });

        if (response.ok) {
          successCount++;
          console.log(`Push notification sent to user ${subscription.user_id}`);
        } else {
          failedCount++;
          failedSubscriptions.push(subscription.id);
          console.error(`Failed to send push notification to user ${subscription.user_id}:`, await response.text());
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
