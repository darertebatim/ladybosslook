import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

/**
 * Time Period Reminders for Actions
 * 
 * Sends reminders at the START of each time period:
 * - Start the day (6 AM): Morning actions
 * - Afternoon (12 PM): Afternoon actions
 * - Evening (5 PM): Evening actions
 * - Bedtime (9 PM): Bedtime actions
 * 
 * Runs hourly via cron to catch users in all timezones.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Time period configurations
const TIME_PERIODS: Record<string, { hour: number; emoji: string; label: string; message: string }> = {
  'Start the day': { hour: 6, emoji: '☀️', label: 'morning', message: 'Your morning actions are ready' },
  'Afternoon': { hour: 12, emoji: '🌤️', label: 'afternoon', message: 'Afternoon actions await you' },
  'Evening': { hour: 17, emoji: '🌅', label: 'evening', message: 'Your evening ritual is ready' },
  'Bedtime': { hour: 21, emoji: '🌙', label: 'bedtime', message: 'Time to wind down' },
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
    console.error(`[TimePeriod] APNs error:`, response.status, errorBody);
    
    const shouldRemove = response.status === 410 || response.status === 400;
    return { success: false, error: `APNs ${response.status}: ${errorBody}`, shouldRemove };
  } catch (error) {
    console.error(`[TimePeriod] Failed to send:`, error);
    return { success: false, error: String(error) };
  }
}

// Check if task should run on given date based on repeat pattern
function taskShouldRunOnDate(task: any, date: Date): boolean {
  const taskScheduledDate = new Date(task.scheduled_date);
  const dayOfWeek = date.getDay();
  
  if (date < new Date(taskScheduledDate.toDateString())) {
    return false;
  }
  
  switch (task.repeat_pattern) {
    case 'none':
      return date.toDateString() === taskScheduledDate.toDateString();
    case 'daily':
      return true;
    case 'weekly':
      if (task.repeat_days && Array.isArray(task.repeat_days) && task.repeat_days.length > 0) {
        return task.repeat_days.includes(dayOfWeek);
      }
      return dayOfWeek === taskScheduledDate.getDay();
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekend':
      return dayOfWeek === 0 || dayOfWeek === 6;
    case 'monthly':
      return date.getDate() === taskScheduledDate.getDate();
    default:
      return false;
  }
}

function getUserLocalHour(timezone: string): number {
  try {
    const now = new Date();
    const userTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    return userTime.getHours();
  } catch {
    const now = new Date();
    const userTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    return userTime.getHours();
  }
}

function getUserLocalDate(timezone: string): string {
  try {
    const now = new Date();
    const userTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    return userTime.toISOString().split('T')[0];
  } catch {
    const now = new Date();
    const userTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    return userTime.toISOString().split('T')[0];
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
      console.error('[TimePeriod] Missing APNs credentials');
      return new Response(
        JSON.stringify({ error: 'APNs not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const now = new Date();
    console.log(`[TimePeriod] Running at ${now.toISOString()}`);
    
    // Get all users with push subscriptions
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('user_id, endpoint, id')
      .like('endpoint', 'native:%');
    
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No devices', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const userIds = [...new Set(subscriptions.map(s => s.user_id))];
    
    // Get user timezones and preferences
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, timezone, full_name')
      .in('id', userIds);
    
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    
    // Get notification preferences
    const { data: preferences } = await supabase
      .from('user_notification_preferences')
      .select('user_id, time_period_reminders')
      .in('user_id', userIds);
    
    const prefsMap = new Map(preferences?.map(p => [p.user_id, p.time_period_reminders]) || []);
    
    // Filter users by local hour matching a time period start
    const usersByPeriod = new Map<string, string[]>(); // periodName -> userIds
    
    for (const userId of userIds) {
      // Check if user wants time period reminders (default true)
      const wantReminders = prefsMap.get(userId) !== false;
      if (!wantReminders) continue;
      
      const profile = profileMap.get(userId);
      const timezone = profile?.timezone || 'America/Los_Angeles';
      const localHour = getUserLocalHour(timezone);
      
      // Check which period starts at this hour
      for (const [periodName, config] of Object.entries(TIME_PERIODS)) {
        if (localHour === config.hour) {
          const existing = usersByPeriod.get(periodName) || [];
          existing.push(userId);
          usersByPeriod.set(periodName, existing);
        }
      }
    }
    
    // Calculate total users to notify
    let totalUsersToNotify = 0;
    for (const users of usersByPeriod.values()) {
      totalUsersToNotify += users.length;
    }
    
    if (totalUsersToNotify === 0) {
      console.log('[TimePeriod] No users at time period boundaries');
      return new Response(
        JSON.stringify({ success: true, message: 'No users at period starts', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[TimePeriod] Users at period starts: ${totalUsersToNotify}`);
    
    // Get all users' tasks for time periods
    const allTargetUserIds = [...new Set([...usersByPeriod.values()].flat())];
    
    const { data: tasks } = await supabase
      .from('user_tasks')
      .select('id, user_id, title, emoji, scheduled_date, repeat_pattern, repeat_days, time_period')
      .in('user_id', allTargetUserIds)
      .eq('is_active', true)
      .not('time_period', 'is', null);
    
    // Get today's completions
    const localDates = new Map<string, string>();
    for (const userId of allTargetUserIds) {
      const profile = profileMap.get(userId);
      const timezone = profile?.timezone || 'America/Los_Angeles';
      localDates.set(userId, getUserLocalDate(timezone));
    }
    
    const allDates = [...new Set(localDates.values())];
    const { data: completions } = await supabase
      .from('task_completions')
      .select('task_id, user_id, completed_date')
      .in('user_id', allTargetUserIds)
      .in('completed_date', allDates);
    
    const completedMap = new Map<string, Set<string>>();
    for (const comp of completions || []) {
      const userDate = localDates.get(comp.user_id);
      if (comp.completed_date === userDate) {
        if (!completedMap.has(comp.user_id)) {
          completedMap.set(comp.user_id, new Set());
        }
        completedMap.get(comp.user_id)!.add(comp.task_id);
      }
    }
    
    // Check sent notifications today
    const { data: sentToday } = await supabase
      .from('pn_schedule_logs')
      .select('user_id, notification_type')
      .in('user_id', allTargetUserIds)
      .like('notification_type', 'time_period_%')
      .gte('sent_at', `${now.toISOString().split('T')[0]}T00:00:00Z`);
    
    const alreadySent = new Set(sentToday?.map(s => `${s.user_id}:${s.notification_type}`) || []);
    
    // Build user -> subscriptions map
    const userSubs = new Map<string, typeof subscriptions>();
    for (const sub of subscriptions) {
      const existing = userSubs.get(sub.user_id) || [];
      existing.push(sub);
      userSubs.set(sub.user_id, existing);
    }
    
    // Generate JWT
    const jwt = await generateAPNsJWT(apnsKeyId, apnsTeamId, apnsPrivateKey);
    
    let sentCount = 0;
    let skipCount = 0;
    const invalidSubscriptionIds: string[] = [];
    const logsToInsert: any[] = [];
    
    // Process each time period
    for (const [periodName, userIdsForPeriod] of usersByPeriod) {
      const config = TIME_PERIODS[periodName];
      
      for (const userId of userIdsForPeriod) {
        const notificationType = `time_period_${config.label}`;
        
        // Skip if already sent today
        if (alreadySent.has(`${userId}:${notificationType}`)) {
          skipCount++;
          continue;
        }
        
        const profile = profileMap.get(userId);
        const timezone = profile?.timezone || 'America/Los_Angeles';
        const localDate = localDates.get(userId)!;
        const completedIds = completedMap.get(userId) || new Set();
        
        // Get incomplete tasks for this time period
        const userTasks = (tasks || []).filter(t => {
          if (t.user_id !== userId) return false;
          if (t.time_period !== periodName) return false;
          if (completedIds.has(t.id)) return false;
          
          const dateForCheck = new Date(localDate);
          return taskShouldRunOnDate(t, dateForCheck);
        });
        
        if (userTasks.length === 0) {
          // No tasks for this period
          continue;
        }
        
        const subs = userSubs.get(userId);
        if (!subs || subs.length === 0) continue;
        
        // Build notification
        const title = `${config.emoji} ${config.message}`;
        const body = userTasks.length === 1
          ? `${userTasks[0].emoji || '📝'} ${userTasks[0].title}`
          : `${userTasks.length} actions ready for your ${config.label}`;
        
        const data = {
          type: 'time_period_reminder',
          url: '/app/home',
          period: periodName,
        };
        
        // Send to all devices
        for (const sub of subs) {
          const deviceToken = sub.endpoint.replace('native:', '');
          const result = await sendToApns(deviceToken, title, body, data, jwt, bundleId, apnsEnvironment);
          
          if (result.success) {
            sentCount++;
            console.log(`[TimePeriod] ✅ Sent ${config.label} reminder to ${userId}`);
          } else if (result.shouldRemove) {
            invalidSubscriptionIds.push(sub.id);
          }
        }
        
        logsToInsert.push({
          user_id: userId,
          notification_type: notificationType,
          scheduled_for: now.toISOString(),
          sent_at: now.toISOString(),
          status: 'sent',
        });
      }
    }
    
    // Insert logs
    if (logsToInsert.length > 0) {
      await supabase.from('pn_schedule_logs').insert(logsToInsert);
    }
    
    // Remove invalid subscriptions
    if (invalidSubscriptionIds.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', invalidSubscriptionIds);
    }
    
    console.log(`[TimePeriod] Complete: Sent ${sentCount}, Skipped ${skipCount}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount,
        skipped: skipCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[TimePeriod] Error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
