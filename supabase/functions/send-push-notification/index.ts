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
  targetUserEmail?: string;
  title: string;
  body: string;
  icon?: string;
  url?: string;
  badge?: number; // Phase 6: Custom badge count
}

// Helper function to convert PEM format to ArrayBuffer
function pemToArrayBuffer(pem: string): ArrayBuffer {
  // Remove PEM header/footer and newlines
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  
  // Convert base64 to binary
  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate JWT token for APNs authentication
async function generateApnsJwt(authKey: string, keyId: string, teamId: string): Promise<string> {
  try {
    // Parse the .p8 file content to get the private key
    const keyData = pemToArrayBuffer(authKey);
    
    const key = await crypto.subtle.importKey(
      'pkcs8',
      keyData,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );
    
    const jwt = await create(
      { alg: 'ES256', kid: keyId },
      { iss: teamId, iat: Math.floor(Date.now() / 1000) },
      key
    );
    
    return jwt;
  } catch (error: any) {
    console.error('Error generating APNs JWT:', error);
    throw new Error(`Failed to generate APNs JWT: ${error.message}`);
  }
}

// Send push notification to iOS via APNs
async function sendToApns(token: string, payload: { title: string; body: string; url: string; badge?: number }): Promise<Response> {
  const authKey = Deno.env.get('APNS_AUTH_KEY');
  const keyId = Deno.env.get('APNS_KEY_ID');
  const teamId = Deno.env.get('APNS_TEAM_ID');
  const topic = Deno.env.get('APNS_TOPIC') || 'com.ladybosslook.academy';
  const environment = Deno.env.get('APNS_ENVIRONMENT') || 'production'; // 'sandbox' or 'production'
  
  if (!authKey || !keyId || !teamId) {
    throw new Error('APNs credentials not configured');
  }
  
  // Generate JWT token for authentication
  const jwt = await generateApnsJwt(authKey, keyId, teamId);
  
  // Use sandbox or production APNs URL based on environment
  const apnsUrl = environment === 'sandbox'
    ? `https://api.sandbox.push.apple.com/3/device/${token}`
    : `https://api.push.apple.com/3/device/${token}`;
  
  console.log(`📱 Sending to APNs (${environment}):`, token.substring(0, 20) + '...');
  
  const response = await fetch(apnsUrl, {
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
        alert: {
          title: payload.title,
          body: payload.body,
        },
        sound: 'default',
        badge: payload.badge || 1, // Phase 6: Allow custom badge
      },
      url: payload.url,
    }),
  });
  
  return response;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userIds, targetCourse, targetUserEmail, title, body, icon, url, badge }: PushNotificationRequest = await req.json();

    // Debug logging
    console.log('🔔 Received push notification request:', {
      hasUserIds: !!userIds,
      userIdsLength: userIds?.length,
      targetCourse,
      targetUserEmail,
      targetUserEmailTrimmed: targetUserEmail?.trim(),
      title,
      bodyLength: body?.length,
      url,
    });

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

    const adminUserId = user.id;

    // Get target user subscriptions
    let query = supabase.from('push_subscriptions').select('*');

    if (userIds && userIds.length > 0) {
      console.log('📧 Filtering by userIds:', userIds);
      query = query.in('user_id', userIds);
    } else if (targetUserEmail) {
      const trimmedEmail = targetUserEmail.trim().toLowerCase();
      console.log('📧 Looking up user by email:', trimmedEmail);
      
      // Get user by email from profiles table
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', trimmedEmail)
        .single();

      console.log('📧 Profile lookup result:', { 
        found: !!profiles, 
        userId: profiles?.id,
        error: profileError?.message 
      });

      if (profiles) {
        query = query.eq('user_id', profiles.id);
        console.log('📧 Filtering subscriptions for user:', profiles.id);
      } else {
        console.error('❌ User not found with email:', trimmedEmail);
        return new Response(
          JSON.stringify({ message: 'User not found with that email', sent: 0, failed: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }
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

    console.log(`📊 Found ${subscriptions.length} native iOS subscriptions to notify`);

    let successCount = 0;
    let failedCount = 0;
    const failedSubscriptions: string[] = [];

    // Send push notifications to native iOS devices only
    for (const subscription of subscriptions) {
      try {
        // Extract native iOS token
        const token = subscription.endpoint.replace('native:', '');
        console.log(`📱 Sending to native iOS device for user ${subscription.user_id}`);
        
        const response = await sendToApns(token, {
          title,
          body,
          url: url || '/app/home',
          badge, // Phase 6: Pass custom badge
        });
        
        if (response.ok) {
          successCount++;
          console.log(`✅ Push notification sent successfully to user ${subscription.user_id}`);
        } else {
          const errorBody = await response.text();
          console.error(`❌ APNs error (${response.status}):`, errorBody);
          
          // Mark invalid tokens for deletion (410 = Unregistered, 400 = BadDeviceToken)
          if (response.status === 410 || response.status === 400) {
            failedSubscriptions.push(subscription.id);
            console.log(`Marking subscription ${subscription.id} for deletion (invalid token)`);
          }
          
          failedCount++;
        }
      } catch (error: any) {
        failedCount++;
        
        if (!failedSubscriptions.includes(subscription.id)) {
          failedSubscriptions.push(subscription.id);
        }
        
        console.error(`Error sending push notification to user ${subscription.user_id}:`, error.message);
      }
    }

    // Remove failed subscriptions from database
    if (failedSubscriptions.length > 0) {
      console.log(`🗑️ Removing ${failedSubscriptions.length} invalid subscriptions`);
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', failedSubscriptions);
      console.log(`✅ Removed ${failedSubscriptions.length} invalid subscriptions`);
    }

    // Log the push notification
    const targetType = userIds?.length ? 'specific' : targetUserEmail ? 'user' : targetCourse ? 'course' : 'all';
    const { error: logError } = await supabase
      .from('push_notification_logs')
      .insert({
        title,
        message: body,
        destination_url: url || '/app/home',
        target_type: targetType,
        target_course: targetCourse || null,
        sent_count: successCount,
        failed_count: failedCount,
        created_by: adminUserId,
      });

    if (logError) {
      console.error('Error logging notification:', logError);
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
