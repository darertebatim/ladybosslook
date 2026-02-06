import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

/**
 * Momentum Celebration Push Notifications
 * 
 * Celebrates user consistency milestones:
 * - Every 3 active days (3, 6, 9, 12...)
 * - Weekly milestones (7, 14, 21, 30 days)
 * 
 * Runs daily at midnight UTC to check all users' active day counts.
 * Uses strength-first language - celebrating presence, not streaks.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Milestone configurations with Simora-aligned messaging
const MILESTONES: Record<number, { title: string; body: string; isMajor: boolean }> = {
  3: { title: '✨ 3 Days of Presence', body: "You're showing up for yourself. That's strength.", isMajor: false },
  6: { title: '✨ 6 Days Strong', body: "You keep choosing to be here. Beautiful.", isMajor: false },
  7: { title: '🌟 A Full Week!', body: "7 days of honoring yourself. Your strength is growing.", isMajor: true },
  9: { title: '✨ 9 Days Present', body: "Steady and strong. You're building something real.", isMajor: false },
  12: { title: '✨ 12 Days', body: "You keep returning. That's what strength looks like.", isMajor: false },
  14: { title: '💫 Two Weeks!', body: "14 days of showing up. You're becoming who you want to be.", isMajor: true },
  15: { title: '✨ 15 Days', body: "Halfway through the month. You're still here. 🌸", isMajor: false },
  18: { title: '✨ 18 Days', body: "Almost three weeks of presence. Remarkable.", isMajor: false },
  21: { title: '🌙 Three Weeks!', body: "21 days. This is who you're becoming now.", isMajor: true },
  24: { title: '✨ 24 Days', body: "You keep showing up. Your strength inspires.", isMajor: false },
  27: { title: '✨ 27 Days', body: "Almost a month of presence. Extraordinary.", isMajor: false },
  30: { title: '🏛️ One Month!', body: "30 days of honoring yourself. That's extraordinary strength.", isMajor: true },
};

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
): Promise<{ success: boolean; error?: string; shouldRemove?: boolean }> {
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
    console.error(`[Momentum] APNs error for ${deviceToken.substring(0, 20)}...:`, response.status, errorBody);
    
    const shouldRemove = response.status === 410 || response.status === 400;
    return { success: false, error: `APNs ${response.status}: ${errorBody}`, shouldRemove };
  } catch (error) {
    console.error(`[Momentum] Failed to send to ${deviceToken.substring(0, 20)}...:`, error);
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
      console.error('[Momentum] Missing APNs credentials');
      return new Response(
        JSON.stringify({ error: 'APNs not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    console.log(`[Momentum] Running at ${now.toISOString()}`);
    
    // Get all users who have this_month_active_days at a milestone number
    const milestoneNumbers = Object.keys(MILESTONES).map(Number);
    
    const { data: eligibleUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, this_month_active_days')
      .in('this_month_active_days', milestoneNumbers);
    
    if (usersError) {
      console.error('[Momentum] Error fetching profiles:', usersError);
      throw usersError;
    }
    
    if (!eligibleUsers || eligibleUsers.length === 0) {
      console.log('[Momentum] No users at milestone counts');
      return new Response(
        JSON.stringify({ success: true, message: 'No milestone users', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[Momentum] Found ${eligibleUsers.length} users at milestones`);
    
    // Check user preferences - only send to users who have momentum_celebration enabled
    const userIds = eligibleUsers.map(u => u.id);
    
    const { data: preferences } = await supabase
      .from('user_notification_preferences')
      .select('user_id, momentum_celebration')
      .in('user_id', userIds);
    
    const prefsMap = new Map(preferences?.map(p => [p.user_id, p.momentum_celebration]) || []);
    
    // Filter users who want momentum celebrations (default to true if no preferences)
    const usersToNotify = eligibleUsers.filter(u => {
      const pref = prefsMap.get(u.id);
      return pref === undefined || pref === true; // Default to true
    });
    
    console.log(`[Momentum] ${usersToNotify.length} users want momentum celebrations`);
    
    // Check which users already received this milestone notification today
    const { data: sentToday } = await supabase
      .from('pn_schedule_logs')
      .select('user_id, notification_type')
      .in('user_id', userIds)
      .like('notification_type', 'momentum_%')
      .gte('sent_at', `${today}T00:00:00Z`);
    
    const alreadySentSet = new Set(sentToday?.map(s => `${s.user_id}:${s.notification_type}`) || []);
    
    // Get push subscriptions
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('user_id, endpoint, id')
      .in('user_id', userIds)
      .like('endpoint', 'native:%');
    
    if (!subscriptions || subscriptions.length === 0) {
      console.log('[Momentum] No push subscriptions found');
      return new Response(
        JSON.stringify({ success: true, message: 'No devices', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Build user -> subscriptions map
    const userSubscriptions = new Map<string, typeof subscriptions>();
    for (const sub of subscriptions) {
      const existing = userSubscriptions.get(sub.user_id) || [];
      existing.push(sub);
      userSubscriptions.set(sub.user_id, existing);
    }
    
    // Generate JWT
    const jwt = await generateAPNsJWT(apnsKeyId, apnsTeamId, apnsPrivateKey);
    
    let sentCount = 0;
    let skipCount = 0;
    const invalidSubscriptionIds: string[] = [];
    const logsToInsert: any[] = [];
    
    for (const user of usersToNotify) {
      const activeDays = user.this_month_active_days || 0;
      const milestone = MILESTONES[activeDays];
      
      if (!milestone) continue;
      
      const notificationType = `momentum_${activeDays}`;
      
      // Skip if already sent today
      if (alreadySentSet.has(`${user.id}:${notificationType}`)) {
        skipCount++;
        continue;
      }
      
      const userSubs = userSubscriptions.get(user.id);
      if (!userSubs || userSubs.length === 0) {
        continue;
      }
      
      // Personalize if we have a name
      const firstName = user.full_name?.split(' ')[0];
      let title = milestone.title;
      if (firstName && milestone.isMajor) {
        title = `${milestone.title.split('!')[0]}, ${firstName}!`;
      }
      
      const data = {
        type: 'momentum_celebration',
        url: '/app/home',
        milestone: activeDays,
      };
      
      // Send to all devices
      for (const sub of userSubs) {
        const deviceToken = sub.endpoint.replace('native:', '');
        const result = await sendToApns(deviceToken, title, milestone.body, data, jwt, bundleId, apnsEnvironment);
        
        if (result.success) {
          sentCount++;
          console.log(`[Momentum] ✅ Sent ${activeDays}-day celebration to ${user.id}`);
        } else if (result.shouldRemove) {
          invalidSubscriptionIds.push(sub.id);
        }
      }
      
      // Log to prevent duplicates
      logsToInsert.push({
        user_id: user.id,
        notification_type: notificationType,
        scheduled_for: now.toISOString(),
        sent_at: now.toISOString(),
        status: 'sent',
      });
    }
    
    // Insert logs
    if (logsToInsert.length > 0) {
      await supabase.from('pn_schedule_logs').insert(logsToInsert);
    }
    
    // Remove invalid subscriptions
    if (invalidSubscriptionIds.length > 0) {
      console.log(`[Momentum] Removing ${invalidSubscriptionIds.length} invalid subscriptions`);
      await supabase.from('push_subscriptions').delete().in('id', invalidSubscriptionIds);
    }
    
    console.log(`[Momentum] Complete: Sent ${sentCount}, Skipped ${skipCount}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount,
        skipped: skipCount,
        eligibleUsers: eligibleUsers.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[Momentum] Error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
