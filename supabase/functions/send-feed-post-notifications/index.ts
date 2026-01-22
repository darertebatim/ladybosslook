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
    console.error(`[Feed Post PN] APNs error for ${deviceToken}:`, response.status, errorBody);
    return { success: false, error: `APNs ${response.status}: ${errorBody}` };
  } catch (error) {
    console.error(`[Feed Post PN] Failed to send to ${deviceToken}:`, error);
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
      console.error('[Feed Post PN] Missing APNs credentials');
      return new Response(
        JSON.stringify({ error: 'APNs not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get request body - can be triggered manually or with a specific post_id
    let postId: string | null = null;
    try {
      const body = await req.json();
      postId = body.post_id;
    } catch {
      // No body provided, will check for recent posts
    }
    
    console.log(`[Feed Post PN] Running${postId ? ` for post ${postId}` : ' for recent posts'}`);
    
    // Get posts that need notifications sent
    let postsQuery = supabase
      .from('feed_posts')
      .select(`
        id,
        title,
        content,
        channel_id,
        created_at,
        feed_channels (
          id,
          name,
          round_id,
          program_slug
        )
      `)
      .eq('send_push', true);
    
    if (postId) {
      postsQuery = postsQuery.eq('id', postId);
    } else {
      // Get posts from last 15 minutes that haven't been notified
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      postsQuery = postsQuery.gte('created_at', fifteenMinutesAgo);
    }
    
    const { data: posts, error: postsError } = await postsQuery;
    
    if (postsError) {
      console.error('[Feed Post PN] Error fetching posts:', postsError);
      throw postsError;
    }
    
    if (!posts || posts.length === 0) {
      console.log('[Feed Post PN] No posts to notify');
      return new Response(
        JSON.stringify({ success: true, message: 'No posts to notify', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Generate JWT once for all notifications
    const jwt = await generateAPNsJWT(apnsKeyId, apnsTeamId, apnsPrivateKey);
    
    let totalSent = 0;
    let totalFailed = 0;
    
    for (const post of posts) {
      const channel = post.feed_channels;
      if (!channel) continue;
      
      // Get users who should receive this notification
      // Based on round enrollment or program enrollment
      let userIds: string[] = [];
      
      if (channel.round_id) {
        // Get users enrolled in this specific round
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select('user_id')
          .eq('round_id', channel.round_id);
        
        userIds = enrollments?.map(e => e.user_id) || [];
      } else if (channel.program_slug) {
        // Get users enrolled in any round of this program
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select('user_id')
          .eq('program_slug', channel.program_slug);
        
        userIds = [...new Set(enrollments?.map(e => e.user_id) || [])];
      }
      
      if (userIds.length === 0) {
        console.log(`[Feed Post PN] No users to notify for post ${post.id}`);
        continue;
      }
      
      // Get push subscriptions for these users
      const { data: subscriptions, error: subsError } = await supabase
        .from('push_subscriptions')
        .select('user_id, endpoint')
        .in('user_id', userIds)
        .like('endpoint', 'native:%');
      
      if (subsError || !subscriptions || subscriptions.length === 0) {
        console.log(`[Feed Post PN] No push subscriptions for post ${post.id}`);
        continue;
      }
      
      // Prepare notification content
      const title = post.title || channel.name || 'New Post';
      const body = post.content 
        ? post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '')
        : 'Check out the latest update!';
      
      const data = {
        type: 'feed_post',
        post_id: post.id,
        channel_id: channel.id,
        url: `/app/feed/${channel.id}/${post.id}`,
      };
      
      // Send notifications
      for (const sub of subscriptions) {
        const deviceToken = sub.endpoint.replace('native:', '');
        const result = await sendToApns(deviceToken, title, body, data, jwt, bundleId, apnsEnvironment);
        
        if (result.success) {
          totalSent++;
        } else {
          totalFailed++;
          console.error(`[Feed Post PN] Failed for user ${sub.user_id}:`, result.error);
        }
      }
      
      // Mark post as notified by setting send_push to false
      await supabase
        .from('feed_posts')
        .update({ send_push: false })
        .eq('id', post.id);
    }
    
    // Log the run
    await supabase.from('pn_schedule_logs').insert({
      function_name: 'send-feed-post-notifications',
      sent_count: totalSent,
      failed_count: totalFailed,
      status: totalFailed === 0 ? 'success' : 'partial',
    });
    
    // Update schedule last run
    await supabase
      .from('push_notification_schedules')
      .update({ 
        last_run_at: new Date().toISOString(),
        last_run_status: totalFailed === 0 ? 'success' : 'partial',
        last_run_count: totalSent
      })
      .eq('function_name', 'send-feed-post-notifications');
    
    console.log(`[Feed Post PN] Sent: ${totalSent}, Failed: ${totalFailed}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: totalSent, 
        failed: totalFailed,
        posts_processed: posts.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[Feed Post PN] Error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
