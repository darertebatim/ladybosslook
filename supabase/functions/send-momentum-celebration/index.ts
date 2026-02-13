import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

/**
 * Momentum Keeper Push Notifications
 * 
 * Detects user INACTIVITY and nudges them back before they lose momentum.
 * Also celebrates key milestones (7, 14, 21, 30 days) as in-app only.
 * 
 * Logic (checks last_active_date gap):
 * - 1 day inactive: gentle nudge with active days count
 * - 2 days: momentum-focused nudge
 * - 3+ days: empathetic come-back message
 * - 5+ days: minimal pressure nudge
 * - 7+ days: final gentle message, then stops
 * 
 * Runs daily. Respects 8 AM - 8 PM in user timezone.
 * Uses momentum_celebration preference toggle.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InactivityMessage {
  minGap: number;
  maxGap: number;
  title: string;
  body: (ctx: { gap: number; activeDays: number; coins: number; firstName?: string }) => string;
}

const INACTIVITY_MESSAGES: InactivityMessage[] = [
  {
    minGap: 1, maxGap: 1,
    title: '💪 Keep Going!',
    body: ({ activeDays }) => `You showed up ${activeDays} days this month. One more today?`,
  },
  {
    minGap: 2, maxGap: 2,
    title: '✨ Your Momentum is Waiting',
    body: ({ activeDays }) => `Your ${activeDays}-day momentum is waiting. Come back and keep it alive.`,
  },
  {
    minGap: 3, maxGap: 4,
    title: '🌿 We Miss You',
    body: ({ gap }) => `You've been away for ${gap} days. Your strength doesn't expire — come back when you're ready.`,
  },
  {
    minGap: 5, maxGap: 6,
    title: '🌸 Your Actions Miss You',
    body: ({ coins }) => coins > 0
      ? `You have ${coins} coins waiting. Even 1 minute counts. Tap to return.`
      : 'Your actions miss you. Even 1 minute counts. Tap to return.',
  },
  {
    minGap: 7, maxGap: 14,
    title: '🕊️ No Pressure',
    body: () => "No pressure. When you're ready, everything is still here for you.",
  },
];

function getInactivityMessage(gap: number): InactivityMessage | null {
  return INACTIVITY_MESSAGES.find(m => gap >= m.minGap && gap <= m.maxGap) || null;
}

function isWithinActiveWindow(userTimezone: string | null): boolean {
  try {
    const tz = userTimezone || 'America/Los_Angeles';
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false });
    const hour = parseInt(formatter.format(now), 10);
    return hour >= 8 && hour < 20; // 8 AM - 8 PM
  } catch {
    return true; // default to sending if timezone parsing fails
  }
}

/**
 * Get today's date string in the user's local timezone
 */
function getTodayInUserTz(userTimezone: string | null): string {
  try {
    const tz = userTimezone || 'America/Los_Angeles';
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: tz }); // en-CA gives YYYY-MM-DD
    return formatter.format(now);
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

async function signJWT(header: Record<string, unknown>, payload: Record<string, unknown>, privateKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const base64urlEncode = (data: Uint8Array): string => {
    const base64 = btoa(String.fromCharCode(...data));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  const stringToBase64url = (str: string): string => base64urlEncode(encoder.encode(str));
  
  const headerB64 = stringToBase64url(JSON.stringify(header));
  const payloadB64 = stringToBase64url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;
  
  const pemContents = privateKey.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\s/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey('pkcs8', binaryKey, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, cryptoKey, encoder.encode(signingInput));
  
  return `${signingInput}.${base64urlEncode(new Uint8Array(signature))}`;
}

async function sendToApns(
  deviceToken: string, title: string, body: string,
  data: Record<string, unknown>, jwt: string, topic: string, environment: string
): Promise<{ success: boolean; error?: string; shouldRemove?: boolean }> {
  const host = environment === 'production' ? 'api.push.apple.com' : 'api.sandbox.push.apple.com';
  const url = `https://${host}/3/device/${deviceToken}`;
  
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
      body: JSON.stringify({
        aps: { alert: { title, body }, sound: 'default', badge: 1, 'mutable-content': 1 },
        ...data,
      }),
    });
    
    if (response.ok) return { success: true };
    
    const errorBody = await response.text();
    console.error(`[MomentumKeeper] APNs error for ${deviceToken.substring(0, 20)}...:`, response.status, errorBody);
    return { success: false, error: `APNs ${response.status}: ${errorBody}`, shouldRemove: response.status === 410 || response.status === 400 };
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
    const apnsKeyId = Deno.env.get('APNS_KEY_ID');
    const apnsTeamId = Deno.env.get('APNS_TEAM_ID');
    const apnsPrivateKey = Deno.env.get('APNS_AUTH_KEY');
    const apnsEnvironment = Deno.env.get('APNS_ENVIRONMENT') || 'production';
    const bundleId = Deno.env.get('APNS_TOPIC') || 'app.lovable.9d54663c1af540669ceb1723206ae5f8';
    
    if (!apnsKeyId || !apnsTeamId || !apnsPrivateKey) {
      return new Response(JSON.stringify({ error: 'APNs not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    console.log(`[MomentumKeeper] Running at ${now.toISOString()}`);
    
    // Get all users with last_active_date to check inactivity
    const { data: allUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, last_active_date, this_month_active_days, timezone')
      .not('last_active_date', 'is', null);
    
    if (usersError) throw usersError;
    if (!allUsers || allUsers.length === 0) {
      console.log('[MomentumKeeper] No users with activity data');
      return new Response(JSON.stringify({ success: true, message: 'No users', count: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // Filter users who are inactive (1-14 days gap) and within active window
    // Use user's local timezone for gap calculation to prevent false positives
    const inactiveUsers = allUsers.filter(u => {
      if (!isWithinActiveWindow(u.timezone)) return false;
      const userToday = getTodayInUserTz(u.timezone);
      if (u.last_active_date === userToday) return false; // Active today in their TZ
      // Calculate gap using local dates
      const lastActiveDate = new Date(u.last_active_date + 'T12:00:00Z');
      const todayDate = new Date(userToday + 'T12:00:00Z');
      const gap = Math.floor((todayDate.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
      return gap >= 1 && gap <= 14;
    });
    
    console.log(`[MomentumKeeper] Found ${inactiveUsers.length} inactive users in active window`);
    
    if (inactiveUsers.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No inactive users in active window', count: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // Check preferences
    const userIds = inactiveUsers.map(u => u.id);
    const { data: preferences } = await supabase.from('user_notification_preferences').select('user_id, momentum_celebration').in('user_id', userIds);
    const prefsMap = new Map(preferences?.map(p => [p.user_id, p.momentum_celebration]) || []);
    
    const usersToNotify = inactiveUsers.filter(u => {
      const pref = prefsMap.get(u.id);
      return pref === undefined || pref === true;
    });
    
    // Cross-function daily cooldown: check if user already got ANY server-side PN today
    const { data: anyPnToday } = await supabase
      .from('pn_schedule_logs')
      .select('user_id')
      .in('function_name', ['send-momentum-celebration', 'send-streak-challenges', 'send-drip-followup'])
      .in('user_id', userIds)
      .gte('sent_at', `${today}T00:00:00Z`);
    const alreadySentSet = new Set(anyPnToday?.map(s => s.user_id) || []);
    
    // Get push subscriptions
    const { data: subscriptions } = await supabase.from('push_subscriptions').select('user_id, endpoint, id').in('user_id', userIds).like('endpoint', 'native:%');
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No devices', count: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    const userSubscriptions = new Map<string, typeof subscriptions>();
    for (const sub of subscriptions) {
      const existing = userSubscriptions.get(sub.user_id) || [];
      existing.push(sub);
      userSubscriptions.set(sub.user_id, existing);
    }
    
    // Get coins for users (for messaging)
    const { data: wallets } = await supabase.from('user_wallets').select('user_id, credits_balance').in('user_id', userIds);
    const walletMap = new Map(wallets?.map(w => [w.user_id, w.credits_balance]) || []);
    
    const jwt = await signJWT({ alg: 'ES256', kid: apnsKeyId }, { iss: apnsTeamId, iat: Math.floor(Date.now() / 1000) }, apnsPrivateKey);
    
    let sentCount = 0;
    let skipCount = 0;
    const invalidSubscriptionIds: string[] = [];
    const logsToInsert: any[] = [];
    
    for (const user of usersToNotify) {
      if (alreadySentSet.has(user.id)) { skipCount++; continue; }
      
      const lastActive = new Date(user.last_active_date!);
      // Use local timezone for accurate gap calculation
      const userToday = getTodayInUserTz(user.timezone);
      const todayDate = new Date(userToday + 'T12:00:00Z');
      const lastActiveDate = new Date(user.last_active_date! + 'T12:00:00Z');
      const gap = Math.floor((todayDate.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
      const message = getInactivityMessage(gap);
      if (!message) continue;
      
      const userSubs = userSubscriptions.get(user.id);
      if (!userSubs || userSubs.length === 0) continue;
      
      const firstName = user.full_name?.split(' ')[0];
      const activeDays = user.this_month_active_days || 0;
      const coins = walletMap.get(user.id) || 0;
      
      const title = firstName ? `${message.title.split('!')[0]}, ${firstName}!` : message.title;
      const body = message.body({ gap, activeDays, coins, firstName });
      
      const data = { type: 'momentum_keeper', url: '/app/home', gap };
      
      for (const sub of userSubs) {
        const deviceToken = sub.endpoint.replace('native:', '');
        const result = await sendToApns(deviceToken, title, body, data, jwt, bundleId, apnsEnvironment);
        if (result.success) {
          sentCount++;
          console.log(`[MomentumKeeper] ✅ Sent ${gap}-day nudge to ${user.id}`);
        } else if (result.shouldRemove) {
          invalidSubscriptionIds.push(sub.id);
        }
      }
      
      logsToInsert.push({
        user_id: user.id,
        function_name: 'send-momentum-celebration',
        notification_type: `momentum_keeper_${gap}d`,
        scheduled_for: now.toISOString(),
        sent_at: now.toISOString(),
        status: 'sent',
      });
    }
    
    if (logsToInsert.length > 0) await supabase.from('pn_schedule_logs').insert(logsToInsert);
    if (invalidSubscriptionIds.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', invalidSubscriptionIds);
    }
    
    console.log(`[MomentumKeeper] Complete: Sent ${sentCount}, Skipped ${skipCount}`);
    
    return new Response(JSON.stringify({ success: true, sent: sentCount, skipped: skipCount, checked: inactiveUsers.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[MomentumKeeper] Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
