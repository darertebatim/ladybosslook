import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

/**
 * Goal Progress Nudges
 * 
 * Time-spaced reminders for count/timer goals (like water intake):
 * - 9 AM, 12 PM, 3 PM, 6 PM local time
 * 
 * Only sends if user has incomplete goals for that day.
 * Skips if goal is already met.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Nudge hours (local time)
const NUDGE_HOURS = [9, 12, 15, 18]; // 9 AM, 12 PM, 3 PM, 6 PM

// Nudge messages based on time of day
const NUDGE_MESSAGES: Record<number, { emoji: string; prefix: string }> = {
  9: { emoji: '💧', prefix: 'Morning check-in' },
  12: { emoji: '💧', prefix: 'Midday reminder' },
  15: { emoji: '💧', prefix: 'Afternoon nudge' },
  18: { emoji: '💧', prefix: 'Evening check' },
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
    console.error(`[GoalNudge] APNs error:`, response.status, errorBody);
    
    const shouldRemove = response.status === 410 || response.status === 400;
    return { success: false, error: `APNs ${response.status}: ${errorBody}`, shouldRemove };
  } catch (error) {
    console.error(`[GoalNudge] Failed to send:`, error);
    return { success: false, error: String(error) };
  }
}

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
      console.error('[GoalNudge] Missing APNs credentials');
      return new Response(
        JSON.stringify({ error: 'APNs not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const now = new Date();
    console.log(`[GoalNudge] Running at ${now.toISOString()}`);
    
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
    
    // Get profiles and preferences
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, timezone')
      .in('id', userIds);
    
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    
    const { data: preferences } = await supabase
      .from('user_notification_preferences')
      .select('user_id, goal_nudges')
      .in('user_id', userIds);
    
    const prefsMap = new Map(preferences?.map(p => [p.user_id, p.goal_nudges]) || []);
    
    // Find users at nudge hours
    const usersAtNudgeHour: { userId: string; hour: number; localDate: string }[] = [];
    
    for (const userId of userIds) {
      // Check preference (default true)
      if (prefsMap.get(userId) === false) continue;
      
      const profile = profileMap.get(userId);
      const timezone = profile?.timezone || 'America/Los_Angeles';
      const localHour = getUserLocalHour(timezone);
      
      if (NUDGE_HOURS.includes(localHour)) {
        usersAtNudgeHour.push({
          userId,
          hour: localHour,
          localDate: getUserLocalDate(timezone),
        });
      }
    }
    
    if (usersAtNudgeHour.length === 0) {
      console.log('[GoalNudge] No users at nudge hours');
      return new Response(
        JSON.stringify({ success: true, message: 'No users at nudge hours', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[GoalNudge] ${usersAtNudgeHour.length} users at nudge hours`);
    
    // Get goal-based tasks for these users
    const targetUserIds = usersAtNudgeHour.map(u => u.userId);
    
    const { data: tasks } = await supabase
      .from('user_tasks')
      .select('id, user_id, title, emoji, scheduled_date, repeat_pattern, repeat_days, goal_enabled, goal_type, goal_target, goal_unit')
      .in('user_id', targetUserIds)
      .eq('is_active', true)
      .eq('goal_enabled', true)
      .in('goal_type', ['count', 'timer']);
    
    if (!tasks || tasks.length === 0) {
      console.log('[GoalNudge] No goal tasks found');
      return new Response(
        JSON.stringify({ success: true, message: 'No goal tasks', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get completions with progress
    const allDates = [...new Set(usersAtNudgeHour.map(u => u.localDate))];
    
    const { data: completions } = await supabase
      .from('task_completions')
      .select('task_id, user_id, completed_date, goal_progress')
      .in('user_id', targetUserIds)
      .in('completed_date', allDates);
    
    // Build progress map: taskId -> progress
    const progressMap = new Map<string, number>();
    for (const comp of completions || []) {
      progressMap.set(`${comp.user_id}:${comp.task_id}:${comp.completed_date}`, comp.goal_progress || 0);
    }
    
    // Check sent notifications today
    const { data: sentToday } = await supabase
      .from('pn_schedule_logs')
      .select('user_id, notification_type')
      .in('user_id', targetUserIds)
      .like('notification_type', 'goal_nudge_%')
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
    
    for (const { userId, hour, localDate } of usersAtNudgeHour) {
      const notificationType = `goal_nudge_${hour}`;
      
      // Skip if already sent at this hour today
      if (alreadySent.has(`${userId}:${notificationType}`)) {
        skipCount++;
        continue;
      }
      
      // Get user's goal tasks for today that are not complete
      const userGoalTasks = (tasks || []).filter(t => {
        if (t.user_id !== userId) return false;
        
        const dateForCheck = new Date(localDate);
        if (!taskShouldRunOnDate(t, dateForCheck)) return false;
        
        // Check if goal is already met
        const progress = progressMap.get(`${userId}:${t.id}:${localDate}`) || 0;
        const target = t.goal_target || 1;
        
        return progress < target; // Only include incomplete goals
      });
      
      if (userGoalTasks.length === 0) {
        // No incomplete goals
        continue;
      }
      
      const subs = userSubs.get(userId);
      if (!subs || subs.length === 0) continue;
      
      // Pick the most important goal task (first one)
      const primaryTask = userGoalTasks[0];
      const progress = progressMap.get(`${userId}:${primaryTask.id}:${localDate}`) || 0;
      const target = primaryTask.goal_target || 1;
      const unit = primaryTask.goal_unit || '';
      
      const nudgeConfig = NUDGE_MESSAGES[hour] || NUDGE_MESSAGES[12];
      
      // Build personalized message
      const title = `${nudgeConfig.emoji} ${nudgeConfig.prefix}`;
      const body = `${primaryTask.emoji || '📝'} ${primaryTask.title}: ${progress}/${target} ${unit}`;
      
      const data = {
        type: 'goal_nudge',
        url: '/app/home',
        taskId: primaryTask.id,
      };
      
      // Send to all devices
      for (const sub of subs) {
        const deviceToken = sub.endpoint.replace('native:', '');
        const result = await sendToApns(deviceToken, title, body, data, jwt, bundleId, apnsEnvironment);
        
        if (result.success) {
          sentCount++;
          console.log(`[GoalNudge] ✅ Sent ${hour}h nudge to ${userId}`);
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
    
    // Insert logs
    if (logsToInsert.length > 0) {
      await supabase.from('pn_schedule_logs').insert(logsToInsert);
    }
    
    // Remove invalid subscriptions
    if (invalidSubscriptionIds.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', invalidSubscriptionIds);
    }
    
    console.log(`[GoalNudge] Complete: Sent ${sentCount}, Skipped ${skipCount}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount,
        skipped: skipCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[GoalNudge] Error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
