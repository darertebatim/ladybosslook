import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

/**
 * Server-Side Daily Notifications
 * 
 * Sends time-based push notifications that were previously handled locally:
 * - Morning Summary (at user's wake time or 7 AM)
 * - Evening Check-in (6 PM)
 * - Time Period Reminders (Morning 6AM, Afternoon 12PM, Evening 5PM, Bedtime 9PM)
 * - Goal Nudges (9AM, 12PM, 3PM, 6PM)
 * 
 * Runs hourly via cron and checks each user's timezone to send at correct local time.
 * Respects user preferences and quiet hours (wake_time to sleep_time).
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Notification definitions with their target hours
const NOTIFICATION_TYPES = {
  morning_summary: {
    hour: 7,
    title: '☀️ Good morning!',
    body: "Your actions for today are ready. Let's make it count.",
    url: '/app/home',
    prefKey: 'morning_summary',
  },
  evening_checkin: {
    hour: 18,
    title: '🌅 Evening check-in',
    body: 'A few actions are still waiting for you today.',
    url: '/app/home',
    prefKey: 'evening_checkin',
  },
  period_morning: {
    hour: 6,
    title: '🌅 Morning time',
    body: 'Your morning actions are waiting gently.',
    url: '/app/home',
    prefKey: 'time_period_reminders',
  },
  period_afternoon: {
    hour: 12,
    title: '🌤️ Afternoon is here',
    body: 'Time for your afternoon actions.',
    url: '/app/home',
    prefKey: 'time_period_reminders',
  },
  period_evening: {
    hour: 17,
    title: '🌇 Evening ritual',
    body: 'Your evening actions await.',
    url: '/app/home',
    prefKey: 'time_period_reminders',
  },
  period_bedtime: {
    hour: 21,
    title: '🌙 Bedtime routine',
    body: 'Time to wind down with your bedtime actions.',
    url: '/app/home',
    prefKey: 'time_period_reminders',
  },
  goal_nudge_9am: {
    hour: 9,
    title: '💧 Goal Check',
    body: "How's your water intake going? 💧",
    url: '/app/home',
    prefKey: 'goal_nudges',
  },
  goal_nudge_12pm: {
    hour: 12,
    title: '💧 Goal Check',
    body: 'Midday check: Keep going on your goals! 💧',
    url: '/app/home',
    prefKey: 'goal_nudges',
  },
  goal_nudge_3pm: {
    hour: 15,
    title: '💧 Goal Check',
    body: 'Afternoon hydration reminder 💧',
    url: '/app/home',
    prefKey: 'goal_nudges',
  },
  goal_nudge_6pm: {
    hour: 18,
    title: '💧 Goal Check',
    body: 'Almost there! Final push on your goals 💧',
    url: '/app/home',
    prefKey: 'goal_nudges',
  },
} as const;

type NotificationType = keyof typeof NOTIFICATION_TYPES;

// APNs JWT signing
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
  url: string,
  jwt: string,
  topic: string,
  environment: string
): Promise<{ success: boolean; error?: string; shouldRemove?: boolean }> {
  const host = environment === 'production' 
    ? 'api.push.apple.com' 
    : 'api.sandbox.push.apple.com';
  
  const apnsUrl = `https://${host}/3/device/${deviceToken}`;
  
  const payload = {
    aps: {
      alert: { title, body },
      sound: 'default',
      badge: 1,
    },
    url,
    type: 'daily_notification',
  };
  
  try {
    const response = await fetch(apnsUrl, {
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
    console.error(`[DailyPN] APNs error for ${deviceToken.substring(0, 15)}...:`, response.status, errorBody);
    
    const shouldRemove = response.status === 410 || response.status === 400;
    return { success: false, error: `APNs ${response.status}`, shouldRemove };
  } catch (error) {
    console.error(`[DailyPN] Failed to send:`, error);
    return { success: false, error: String(error) };
  }
}

// Parse time string (HH:mm or HH:mm:ss) to hour
function parseTimeToHour(timeStr: string | null): number {
  if (!timeStr) return 7; // Default wake time
  const [hour] = timeStr.split(':').map(Number);
  return hour;
}

// Check if notification hour is within active hours (respects quiet time)
function isWithinActiveHours(notificationHour: number, wakeHour: number, sleepHour: number): boolean {
  // Handle midnight crossing (e.g., sleep at 23:00, wake at 07:00)
  if (sleepHour < wakeHour) {
    return notificationHour >= wakeHour || notificationHour < sleepHour;
  }
  return notificationHour >= wakeHour && notificationHour < sleepHour;
}

// Get user's current local hour based on their timezone
function getUserLocalHour(timezone: string | null): number {
  const tz = timezone || 'America/Los_Angeles'; // Default timezone (LA)
  try {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      hour: 'numeric', 
      hour12: false, 
      timeZone: tz 
    };
    const hourStr = new Intl.DateTimeFormat('en-US', options).format(now);
    return parseInt(hourStr, 10);
  } catch {
    // Fallback if invalid timezone
    return new Date().getUTCHours();
  }
}

// Get today's date in user's timezone (for duplicate prevention)
function getUserLocalDate(timezone: string | null): string {
  const tz = timezone || 'America/New_York';
  try {
    const now = new Date();
    return now.toLocaleDateString('en-CA', { timeZone: tz }); // YYYY-MM-DD format
  } catch {
    return new Date().toISOString().split('T')[0];
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
    const bundleId = Deno.env.get('APNS_TOPIC') || 'com.ladybosslook.academy';
    
    if (!apnsKeyId || !apnsTeamId || !apnsPrivateKey) {
      console.error('[DailyPN] Missing APNs credentials');
      return new Response(
        JSON.stringify({ error: 'APNs not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const now = new Date();
    console.log(`[DailyPN] Running at ${now.toISOString()}`);
    
    // Get all users with push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint')
      .like('endpoint', 'native:%');
    
    if (subError) {
      console.error('[DailyPN] Error fetching subscriptions:', subError);
      throw subError;
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      console.log('[DailyPN] No push subscriptions found');
      return new Response(
        JSON.stringify({ success: true, message: 'No subscriptions', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get unique user IDs
    const userIds = [...new Set(subscriptions.map(s => s.user_id))];
    console.log(`[DailyPN] Found ${userIds.length} users with push subscriptions`);
    
    // Get user profiles (for timezone)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, timezone, full_name')
      .in('id', userIds);
    
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    
    // Get notification preferences
    const { data: preferences } = await supabase
      .from('user_notification_preferences')
      .select('user_id, morning_summary, evening_checkin, time_period_reminders, goal_nudges, wake_time, sleep_time')
      .in('user_id', userIds);
    
    const prefsMap = new Map(preferences?.map(p => [p.user_id, p]) || []);
    
    // Get today's logs to prevent duplicates
    const today = now.toISOString().split('T')[0];
    const { data: sentToday } = await supabase
      .from('pn_schedule_logs')
      .select('user_id, notification_type')
      .eq('function_name', 'send-daily-notifications')
      .gte('sent_at', `${today}T00:00:00Z`);
    
    const alreadySentSet = new Set(
      sentToday?.map(s => `${s.user_id}:${s.notification_type}`) || []
    );
    
    // Build user -> subscriptions map
    const userSubscriptions = new Map<string, typeof subscriptions>();
    for (const sub of subscriptions) {
      const existing = userSubscriptions.get(sub.user_id) || [];
      existing.push(sub);
      userSubscriptions.set(sub.user_id, existing);
    }
    
    // Generate JWT once
    const jwt = await generateAPNsJWT(apnsKeyId, apnsTeamId, apnsPrivateKey);
    
    let totalSent = 0;
    let totalSkipped = 0;
    const invalidSubscriptionIds: string[] = [];
    const logsToInsert: any[] = [];
    const notificationsSentByType: Record<string, number> = {};
    
    // Process each user
    for (const userId of userIds) {
      const profile = profileMap.get(userId);
      const prefs = prefsMap.get(userId);
      const userSubs = userSubscriptions.get(userId);
      
      if (!userSubs || userSubs.length === 0) continue;
      
      // Get user's local time info
      const timezone = profile?.timezone || null;
      const userLocalHour = getUserLocalHour(timezone);
      const userLocalDate = getUserLocalDate(timezone);
      
      // Get user's quiet hours
      const wakeHour = parseTimeToHour(prefs?.wake_time);
      const sleepHour = parseTimeToHour(prefs?.sleep_time) || 22;
      
      // Check each notification type
      for (const [notificationType, config] of Object.entries(NOTIFICATION_TYPES)) {
        // Special handling for morning_summary - use wake time if later than 7
        let targetHour = config.hour;
        if (notificationType === 'morning_summary') {
          targetHour = Math.max(7, wakeHour);
        }
        
        // Skip if not the right hour for this user
        if (userLocalHour !== targetHour) continue;
        
        // Skip if outside active hours
        if (!isWithinActiveHours(targetHour, wakeHour, sleepHour)) {
          continue;
        }
        
        // Check if user has this preference enabled (default to true)
        const prefKey = config.prefKey as keyof typeof prefs;
        const isEnabled = prefs ? prefs[prefKey] !== false : true;
        if (!isEnabled) {
          continue;
        }
        
        // Skip if already sent today for this user
        const logKey = `${userId}:${notificationType}:${userLocalDate}`;
        if (alreadySentSet.has(`${userId}:${notificationType}`)) {
          totalSkipped++;
          continue;
        }
        
        // Send to all user's devices
        for (const sub of userSubs) {
          const deviceToken = sub.endpoint.replace('native:', '');
          const result = await sendToApns(
            deviceToken,
            config.title,
            config.body,
            config.url,
            jwt,
            bundleId,
            apnsEnvironment
          );
          
          if (result.success) {
            totalSent++;
            notificationsSentByType[notificationType] = (notificationsSentByType[notificationType] || 0) + 1;
            console.log(`[DailyPN] ✅ Sent ${notificationType} to user ${userId.substring(0, 8)}`);
          } else if (result.shouldRemove) {
            invalidSubscriptionIds.push(sub.id);
          }
        }
        
        // Log to prevent duplicates
        logsToInsert.push({
          user_id: userId,
          function_name: 'send-daily-notifications',
          notification_type: notificationType,
          scheduled_for: now.toISOString(),
          sent_at: now.toISOString(),
          status: 'sent',
          sent_count: 1,
        });
      }
    }
    
    // Insert logs
    if (logsToInsert.length > 0) {
      const { error: logError } = await supabase
        .from('pn_schedule_logs')
        .insert(logsToInsert);
      if (logError) {
        console.error('[DailyPN] Error inserting logs:', logError);
      }
    }
    
    // Remove invalid subscriptions
    if (invalidSubscriptionIds.length > 0) {
      console.log(`[DailyPN] Removing ${invalidSubscriptionIds.length} invalid subscriptions`);
      await supabase.from('push_subscriptions').delete().in('id', invalidSubscriptionIds);
    }
    
    console.log(`[DailyPN] Complete: Sent ${totalSent}, Skipped ${totalSkipped}`);
    console.log('[DailyPN] By type:', notificationsSentByType);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: totalSent,
        skipped: totalSkipped,
        byType: notificationsSentByType,
        usersProcessed: userIds.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[DailyPN] Error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
