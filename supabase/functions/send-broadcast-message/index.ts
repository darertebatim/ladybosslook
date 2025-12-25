import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, content, targetType, targetCourse, targetRoundId, sendPush, sendEmail }: BroadcastRequest = await req.json();

    console.log('📢 Broadcast request:', { title, targetType, targetCourse, targetRoundId, sendPush, sendEmail });

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
      // Get all users with profiles (they are registered)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id');
      targetUserIds = profiles?.map(p => p.id) || [];
    } else if (targetType === 'round' && targetRoundId) {
      // Get users enrolled in specific round
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('user_id')
        .eq('round_id', targetRoundId)
        .eq('status', 'active');
      targetUserIds = [...new Set(enrollments?.map(e => e.user_id) || [])];
    } else if (targetType === 'course' && targetCourse) {
      // Get users enrolled in course
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('user_id')
        .eq('program_slug', targetCourse)
        .eq('status', 'active');
      targetUserIds = [...new Set(enrollments?.map(e => e.user_id) || [])];
    }

    console.log(`📊 Found ${targetUserIds.length} target users`);

    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          broadcastId: broadcast.id,
          messagesSent: 0,
          pushSent: 0,
          message: 'No target users found'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Step 3: For each user, get or create conversation and insert broadcast message
    let messagesSent = 0;
    const conversationsToNotify: { conversationId: string; userId: string }[] = [];

    for (const userId of targetUserIds) {
      try {
        // Get existing conversation or create new one
        let { data: conversation } = await supabase
          .from('chat_conversations')
          .select('id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!conversation) {
          // Create new conversation for this user
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

        // Insert broadcast message into their conversation
        const { error: msgError } = await supabase
          .from('chat_messages')
          .insert({
            conversation_id: conversation.id,
            sender_id: user.id,
            sender_type: 'admin',
            content: `📢 **${title}**\n\n${content}`,
            is_broadcast: true,
            broadcast_id: broadcast.id,
          });

        if (msgError) {
          console.error(`❌ Error sending message to ${userId}:`, msgError);
          continue;
        }

        // Update conversation unread count
        await supabase
          .from('chat_conversations')
          .update({ 
            unread_count_user: supabase.rpc ? 1 : 1, // Increment
            last_message_at: new Date().toISOString()
          })
          .eq('id', conversation.id);

        messagesSent++;
        conversationsToNotify.push({ conversationId: conversation.id, userId });
      } catch (err) {
        console.error(`❌ Error processing user ${userId}:`, err);
      }
    }

    console.log(`✅ Messages sent to ${messagesSent} users`);

    // Step 4: Send push notifications if enabled
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

          // Get push subscriptions for target users
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
                { title: `📢 ${title}`, body: content.substring(0, 100), url: '/app/support-chat' },
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
            } catch (err) {
              console.error('❌ Push error:', err);
              failedSubscriptions.push(subscription.id);
            }
          }

          // Clean up invalid subscriptions
          if (failedSubscriptions.length > 0) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .in('id', failedSubscriptions);
          }

          console.log(`✅ Push notifications sent: ${pushSent}`);
        } catch (err) {
          console.error('❌ Error sending push notifications:', err);
        }
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
