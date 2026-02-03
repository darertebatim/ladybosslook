import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

/**
 * Task Summary Push Notifications
 * 
 * Sends timezone-aware summary PNs:
 * - Morning Kickoff (7 AM local time): "You have X tasks today"
 * - Evening Check-in (6 PM local time): "X tasks left - you've got this!"
 * 
 * Runs hourly via cron to catch users in all timezones.
 * Rate limited to 1 morning + 1 evening PN per user per day.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MORNING_HOUR = 7;  // 7 AM local time
const EVENING_HOUR = 18; // 6 PM local time

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
    console.error(`[Task Summary] APNs error for ${deviceToken.substring(0, 20)}...:`, response.status, errorBody);
    
    const shouldRemove = response.status === 410 || response.status === 400;
    return { success: false, error: `APNs ${response.status}: ${errorBody}`, shouldRemove };
  } catch (error) {
    console.error(`[Task Summary] Failed to send to ${deviceToken.substring(0, 20)}...:`, error);
    return { success: false, error: String(error) };
  }
}

// Check if task should run on given date based on repeat pattern
function taskShouldRunOnDate(task: any, date: Date): boolean {
  const taskScheduledDate = new Date(task.scheduled_date);
  const dayOfWeek = date.getDay();
  
  // If date is before task scheduled date, skip
  if (date < new Date(taskScheduledDate.toDateString())) {
    return false;
  }
  
  switch (task.repeat_pattern) {
    case 'none':
      return date.toDateString() === taskScheduledDate.toDateString();
    case 'daily':
      return true;
    case 'weekly':
      // Check repeat_days array if available
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

// Get user's local hour from their timezone
function getUserLocalHour(timezone: string): number {
  try {
    const now = new Date();
    const userTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    return userTime.getHours();
  } catch {
    // Fallback to LA timezone if invalid
    const now = new Date();
    const userTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    return userTime.getHours();
  }
}

// Get user's local date in YYYY-MM-DD format
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
      console.error('[Task Summary] Missing APNs credentials');
      return new Response(
        JSON.stringify({ error: 'APNs not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const now = new Date();
    console.log(`[Task Summary] Running at ${now.toISOString()}`);
    
    // Get all users with push subscriptions and their timezone from profiles
    const { data: usersWithSubs, error: usersError } = await supabase
      .from('push_subscriptions')
      .select(`
        user_id,
        endpoint,
        id
      `)
      .like('endpoint', 'native:%');
    
    if (usersError || !usersWithSubs || usersWithSubs.length === 0) {
      console.log('[Task Summary] No users with push subscriptions');
      return new Response(
        JSON.stringify({ success: true, message: 'No users to notify', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get unique user IDs
    const userIds = [...new Set(usersWithSubs.map(u => u.user_id))];
    
    // Fetch profiles for timezone and name
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, timezone, full_name')
      .in('id', userIds);
    
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    
    // Build user -> subscriptions map
    const userSubscriptions = new Map<string, typeof usersWithSubs>();
    for (const sub of usersWithSubs) {
      const existing = userSubscriptions.get(sub.user_id) || [];
      existing.push(sub);
      userSubscriptions.set(sub.user_id, existing);
    }
    
    // Filter users by local hour (7 AM for morning, 6 PM for evening)
    const morningUsers: string[] = [];
    const eveningUsers: string[] = [];
    
    for (const userId of userIds) {
      const profile = profileMap.get(userId);
      const timezone = profile?.timezone || 'America/Los_Angeles';
      const localHour = getUserLocalHour(timezone);
      
      if (localHour === MORNING_HOUR) {
        morningUsers.push(userId);
      } else if (localHour === EVENING_HOUR) {
        eveningUsers.push(userId);
      }
    }
    
    console.log(`[Task Summary] Morning users (${MORNING_HOUR}h): ${morningUsers.length}, Evening users (${EVENING_HOUR}h): ${eveningUsers.length}`);
    
    if (morningUsers.length === 0 && eveningUsers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No users at target hours', morning: 0, evening: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const allTargetUsers = [...morningUsers, ...eveningUsers];
    
    // Check pn_schedule_logs to avoid duplicates
    const { data: existingLogs } = await supabase
      .from('pn_schedule_logs')
      .select('user_id, notification_type, scheduled_for')
      .in('user_id', allTargetUsers)
      .in('notification_type', ['morning_summary', 'evening_summary'])
      .gte('scheduled_for', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());
    
    const sentToday = new Set(existingLogs?.map(l => `${l.user_id}:${l.notification_type}`) || []);
    
    // Filter out already-notified users
    const filteredMorningUsers = morningUsers.filter(u => !sentToday.has(`${u}:morning_summary`));
    const filteredEveningUsers = eveningUsers.filter(u => !sentToday.has(`${u}:evening_summary`));
    
    console.log(`[Task Summary] After dedup - Morning: ${filteredMorningUsers.length}, Evening: ${filteredEveningUsers.length}`);
    
    // Fetch tasks for target users
    const targetUserIds = [...new Set([...filteredMorningUsers, ...filteredEveningUsers])];
    
    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'All users already notified today', morning: 0, evening: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { data: tasks } = await supabase
      .from('user_tasks')
      .select('id, user_id, title, emoji, scheduled_date, repeat_pattern, repeat_days, time_period')
      .in('user_id', targetUserIds)
      .eq('is_active', true);
    
    // Get today's completions for each user (need to check by their local date)
    const userLocalDates = new Map<string, string>();
    for (const userId of targetUserIds) {
      const profile = profileMap.get(userId);
      const timezone = profile?.timezone || 'America/Los_Angeles';
      userLocalDates.set(userId, getUserLocalDate(timezone));
    }
    
    // Fetch completions for all possible dates
    const allDates = [...new Set(userLocalDates.values())];
    const { data: completions } = await supabase
      .from('task_completions')
      .select('task_id, user_id, completed_date')
      .in('user_id', targetUserIds)
      .in('completed_date', allDates);
    
    // Build user -> completed task IDs map (for their local date)
    const userCompletedTasks = new Map<string, Set<string>>();
    for (const comp of completions || []) {
      const userDate = userLocalDates.get(comp.user_id);
      if (comp.completed_date === userDate) {
        if (!userCompletedTasks.has(comp.user_id)) {
          userCompletedTasks.set(comp.user_id, new Set());
        }
        userCompletedTasks.get(comp.user_id)!.add(comp.task_id);
      }
    }
    
    // Generate JWT for APNs
    const jwt = await generateAPNsJWT(apnsKeyId, apnsTeamId, apnsPrivateKey);
    
    let morningSent = 0;
    let eveningSent = 0;
    const invalidSubscriptionIds: string[] = [];
    const logsToInsert: any[] = [];
    
    // Process morning users
    for (const userId of filteredMorningUsers) {
      const profile = profileMap.get(userId);
      const timezone = profile?.timezone || 'America/Los_Angeles';
      const localDate = userLocalDates.get(userId)!;
      const completedIds = userCompletedTasks.get(userId) || new Set();
      
      // Filter tasks for today
      const userTasks = (tasks || []).filter(t => {
        if (t.user_id !== userId) return false;
        const dateForCheck = new Date(localDate);
        return taskShouldRunOnDate(t, dateForCheck);
      });
      
      // Get incomplete tasks
      const incompleteTasks = userTasks.filter(t => !completedIds.has(t.id));
      
      if (incompleteTasks.length === 0) {
        console.log(`[Task Summary] Skipping morning for ${userId} - no tasks`);
        continue;
      }
      
      // Build notification
      const firstName = profile?.full_name?.split(' ')[0] || '';
      const title = firstName ? `☀️ Good morning, ${firstName}!` : '☀️ Good morning!';
      const firstTask = incompleteTasks[0];
      const firstTaskName = `${firstTask.emoji || '📝'} ${firstTask.title}`;
      const body = incompleteTasks.length === 1 
        ? `1 task today: ${firstTaskName} ✨`
        : `${incompleteTasks.length} tasks today. Start with "${firstTask.title}" ✨`;
      
      const data = { type: 'task_summary', url: '/app/home' };
      
      // Send to all user devices
      const userSubs = userSubscriptions.get(userId) || [];
      for (const sub of userSubs) {
        const deviceToken = sub.endpoint.replace('native:', '');
        const result = await sendToApns(deviceToken, title, body, data, jwt, bundleId, apnsEnvironment);
        
        if (result.success) {
          morningSent++;
          console.log(`[Task Summary] ✅ Morning sent to ${userId}`);
        } else if (result.shouldRemove) {
          invalidSubscriptionIds.push(sub.id);
        }
      }
      
      // Log to prevent duplicates
      logsToInsert.push({
        user_id: userId,
        notification_type: 'morning_summary',
        scheduled_for: now.toISOString(),
        sent_at: now.toISOString(),
        status: 'sent',
      });
    }
    
    // Process evening users
    for (const userId of filteredEveningUsers) {
      const profile = profileMap.get(userId);
      const timezone = profile?.timezone || 'America/Los_Angeles';
      const localDate = userLocalDates.get(userId)!;
      const completedIds = userCompletedTasks.get(userId) || new Set();
      
      // Filter tasks for today
      const userTasks = (tasks || []).filter(t => {
        if (t.user_id !== userId) return false;
        const dateForCheck = new Date(localDate);
        return taskShouldRunOnDate(t, dateForCheck);
      });
      
      // Get incomplete tasks
      const incompleteTasks = userTasks.filter(t => !completedIds.has(t.id));
      
      if (incompleteTasks.length === 0) {
        console.log(`[Task Summary] Skipping evening for ${userId} - all complete or no tasks`);
        continue;
      }
      
      // Build notification
      const title = '🌅 Almost done!';
      const body = incompleteTasks.length === 1
        ? `1 task left today. You've got this! 💪`
        : `${incompleteTasks.length} tasks left today. You've got this! 💪`;
      
      const data = { type: 'task_summary', url: '/app/home' };
      
      // Send to all user devices
      const userSubs = userSubscriptions.get(userId) || [];
      for (const sub of userSubs) {
        const deviceToken = sub.endpoint.replace('native:', '');
        const result = await sendToApns(deviceToken, title, body, data, jwt, bundleId, apnsEnvironment);
        
        if (result.success) {
          eveningSent++;
          console.log(`[Task Summary] ✅ Evening sent to ${userId}`);
        } else if (result.shouldRemove) {
          invalidSubscriptionIds.push(sub.id);
        }
      }
      
      // Log to prevent duplicates
      logsToInsert.push({
        user_id: userId,
        notification_type: 'evening_summary',
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
      console.log(`[Task Summary] Removing ${invalidSubscriptionIds.length} invalid subscriptions`);
      await supabase.from('push_subscriptions').delete().in('id', invalidSubscriptionIds);
    }
    
    console.log(`[Task Summary] Complete: Morning ${morningSent}, Evening ${eveningSent}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        morning: morningSent, 
        evening: eveningSent,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[Task Summary] Error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
