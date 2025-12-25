import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { create } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatNotificationRequest {
  conversationId: string;
  messageContent: string;
  senderType: 'user' | 'admin';
  senderId: string;
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
  
  const jwt = await create(
    { alg: 'ES256', kid: keyId },
    { iss: teamId, iat: Math.floor(Date.now() / 1000) },
    key
  );
  
  return jwt;
}

// Send push notification to iOS via APNs
async function sendToApns(
  deviceToken: string, 
  payload: { title: string; body: string; url: string }, 
  jwt: string,
  topic: string,
  environment: 'development' | 'production'
): Promise<Response> {
  const apnsUrl = (environment === 'sandbox' || environment === 'development')
    ? `https://api.sandbox.push.apple.com/3/device/${deviceToken}`
    : `https://api.push.apple.com/3/device/${deviceToken}`;
  
  console.log(`📱 Sending chat notification to APNs (${environment}):`, deviceToken.substring(0, 20) + '...');
  
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
        badge: 1,
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
    const { conversationId, messageContent, senderType, senderId }: ChatNotificationRequest = await req.json();

    console.log('💬 Chat notification request:', {
      conversationId,
      senderType,
      messagePreview: messageContent.substring(0, 50),
    });

    if (!conversationId || !messageContent || !senderType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the sender is authenticated
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

    // Get conversation details
    const { data: conversation, error: convError } = await supabase
      .from('chat_conversations')
      .select('user_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      console.error('Conversation not found:', convError);
      return new Response(
        JSON.stringify({ error: 'Conversation not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Determine who to notify
    let targetUserIds: string[] = [];
    let notificationTitle = '';
    let notificationBody = messageContent.length > 100 
      ? messageContent.substring(0, 100) + '...' 
      : messageContent;

    if (senderType === 'user') {
      // User sent a message - notify all admins
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (adminRoles) {
        targetUserIds = adminRoles.map(r => r.user_id);
      }

      // Get user's name
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', senderId)
        .single();

      notificationTitle = `New support message from ${senderProfile?.full_name || senderProfile?.email || 'User'}`;
    } else {
      // Admin sent a message - notify the user
      targetUserIds = [conversation.user_id];
      notificationTitle = 'New reply from Support';
    }

    if (targetUserIds.length === 0) {
      console.log('No target users to notify');
      return new Response(
        JSON.stringify({ message: 'No users to notify', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Get push subscriptions for target users
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', targetUserIds);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      return new Response(
        JSON.stringify({ error: subError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found for target users');
      return new Response(
        JSON.stringify({ message: 'No subscriptions found', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`📊 Found ${subscriptions.length} subscriptions to notify`);

    // Generate APNs JWT
    const authKey = Deno.env.get('APNS_AUTH_KEY');
    const keyId = Deno.env.get('APNS_KEY_ID');
    const teamId = Deno.env.get('APNS_TEAM_ID');
    const topic = Deno.env.get('APNS_TOPIC') || 'com.ladybosslook.academy';
    const apnsEnvironment = Deno.env.get('APNS_ENVIRONMENT') || 'production';

    if (!authKey || !keyId || !teamId) {
      console.log('APNs credentials not configured, skipping push notifications');
      return new Response(
        JSON.stringify({ message: 'APNs not configured', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const apnsJwt = await generateApnsJwt(authKey, keyId, teamId);
    
    let successCount = 0;
    let failedCount = 0;
    const failedSubscriptions: string[] = [];

    for (const subscription of subscriptions) {
      try {
        const deviceToken = subscription.endpoint.replace('native:', '');
        
        const response = await sendToApns(
          deviceToken,
          {
            title: notificationTitle,
            body: notificationBody,
            url: '/app/support-chat',
          },
          apnsJwt,
          topic,
          apnsEnvironment as 'development' | 'production'
        );
        
        if (response.ok) {
          successCount++;
          console.log(`✅ Chat notification sent to user ${subscription.user_id}`);
        } else {
          const errorBody = await response.text();
          console.error(`❌ APNs error (${response.status}):`, errorBody);
          
          if (response.status === 410 || response.status === 400) {
            failedSubscriptions.push(subscription.id);
          }
          failedCount++;
        }
      } catch (error: any) {
        failedCount++;
        console.error(`Error sending to user ${subscription.user_id}:`, error.message);
      }
    }

    // Remove failed subscriptions
    if (failedSubscriptions.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', failedSubscriptions);
      console.log(`Removed ${failedSubscriptions.length} invalid subscriptions`);
    }

    return new Response(
      JSON.stringify({ message: 'Chat notifications sent', sent: successCount, failed: failedCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in send-chat-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
};

serve(handler);
