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
    console.error(`[Task Reminder] APNs error for ${deviceToken.substring(0, 20)}...:`, response.status, errorBody);
    
    // Mark for removal if token is invalid
    const shouldRemove = response.status === 410 || response.status === 400;
    return { success: false, error: `APNs ${response.status}: ${errorBody}`, shouldRemove };
  } catch (error) {
    console.error(`[Task Reminder] Failed to send to ${deviceToken.substring(0, 20)}...:`, error);
    return { success: false, error: String(error) };
  }
}

// Calculate reminder time based on task scheduled_time and offset
function calculateReminderTime(scheduledTime: string, offsetMinutes: number): { hour: number; minute: number } {
  const [hours, minutes] = scheduledTime.split(':').map(Number);
  
  // Subtract offset from scheduled time
  let reminderMinutes = hours * 60 + minutes - offsetMinutes;
  
  // Handle negative values (wrap to previous day - but we ignore those for simplicity)
  if (reminderMinutes < 0) {
    reminderMinutes = 0;
  }
  
  return {
    hour: Math.floor(reminderMinutes / 60),
    minute: reminderMinutes % 60,
  };
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
      // One-time task - only on scheduled date
      return date.toDateString() === taskScheduledDate.toDateString();
      
    case 'daily':
      // Every day from scheduled date
      return true;
      
    case 'weekly':
      // Same day of week as scheduled date
      return dayOfWeek === taskScheduledDate.getDay();
      
    case 'weekend':
      // Saturday (6) or Sunday (0)
      return dayOfWeek === 0 || dayOfWeek === 6;
      
    case 'monthly':
      // Same day of month as scheduled date
      return date.getDate() === taskScheduledDate.getDate();
      
    default:
      return false;
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
    const apnsPrivateKey = Deno.env.get('APNS_AUTH_KEY'); // Use APNS_AUTH_KEY like other functions
    const apnsEnvironment = Deno.env.get('APNS_ENVIRONMENT') || 'production';
    const bundleId = Deno.env.get('APNS_TOPIC') || 'app.lovable.9d54663c1af540669ceb1723206ae5f8';
    
    if (!apnsKeyId || !apnsTeamId || !apnsPrivateKey) {
      console.error('[Task Reminder] Missing APNs credentials');
      return new Response(
        JSON.stringify({ error: 'APNs not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    console.log(`[Task Reminder] Running at ${now.toISOString()}`);
    
    // Fetch all tasks with reminders enabled and a scheduled time
    const { data: tasks, error: tasksError } = await supabase
      .from('user_tasks')
      .select('id, user_id, title, scheduled_time, reminder_enabled, reminder_offset, repeat_pattern, scheduled_date, emoji')
      .eq('reminder_enabled', true)
      .not('scheduled_time', 'is', null);
    
    if (tasksError) {
      console.error('[Task Reminder] Error fetching tasks:', tasksError);
      throw tasksError;
    }
    
    if (!tasks || tasks.length === 0) {
      console.log('[Task Reminder] No tasks with reminders enabled');
      return new Response(
        JSON.stringify({ success: true, message: 'No reminder tasks found', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[Task Reminder] Found ${tasks.length} tasks with reminders enabled`);
    
    // Get already sent reminders for today
    const { data: sentReminders, error: sentError } = await supabase
      .from('task_reminder_logs')
      .select('task_id')
      .eq('reminder_date', today);
    
    if (sentError) {
      console.error('[Task Reminder] Error fetching sent reminders:', sentError);
    }
    
    const sentTaskIds = new Set(sentReminders?.map(r => r.task_id) || []);
    
    // Get user profiles for timezone info
    const userIds = [...new Set(tasks.map(t => t.user_id))];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);
    
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    
    // Find tasks that need reminders now
    const tasksToNotify: Array<{ task: any; userId: string }> = [];
    
    for (const task of tasks) {
      // Skip if already sent today
      if (sentTaskIds.has(task.id)) {
        continue;
      }
      
      // Check if task should run today based on repeat pattern
      if (!taskShouldRunOnDate(task, now)) {
        continue;
      }
      
      // Calculate when the reminder should fire
      const { hour: reminderHour, minute: reminderMinute } = calculateReminderTime(
        task.scheduled_time,
        task.reminder_offset || 0
      );
      
      // We need the user's timezone to check if it's reminder time
      // For now, use a simple approach: check if current UTC time falls within 
      // a reasonable window (we run every 5 minutes, so check ±3 minute window)
      // In production, you'd want to store user timezone and calculate properly
      
      // Simple approach: Check multiple common timezones
      const timezonesToCheck = [
        'America/Los_Angeles', // PST/PDT
        'America/New_York',    // EST/EDT
        'America/Chicago',     // CST/CDT
        'Asia/Tokyo',          // JST
        'Europe/London',       // GMT/BST
      ];
      
      let shouldNotify = false;
      
      for (const tz of timezonesToCheck) {
        try {
          const userTime = new Date(now.toLocaleString('en-US', { timeZone: tz }));
          const userHour = userTime.getHours();
          const userMinutes = userTime.getMinutes();
          
          // Check if within 5-minute window
          const reminderTotalMinutes = reminderHour * 60 + reminderMinute;
          const currentTotalMinutes = userHour * 60 + userMinutes;
          
          if (Math.abs(reminderTotalMinutes - currentTotalMinutes) <= 5) {
            shouldNotify = true;
            console.log(`[Task Reminder] Task "${task.title}" due for user ${task.user_id} in ${tz}`);
            break;
          }
        } catch (e) {
          // Invalid timezone, skip
        }
      }
      
      if (shouldNotify) {
        tasksToNotify.push({ task, userId: task.user_id });
      }
    }
    
    if (tasksToNotify.length === 0) {
      console.log('[Task Reminder] No tasks need reminders at this time');
      return new Response(
        JSON.stringify({ success: true, message: 'No reminders due now', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[Task Reminder] ${tasksToNotify.length} tasks need reminders`);
    
    // Get push subscriptions for users
    const notifyUserIds = [...new Set(tasksToNotify.map(t => t.userId))];
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('user_id, endpoint, id')
      .in('user_id', notifyUserIds)
      .like('endpoint', 'native:%');
    
    if (subsError) {
      console.error('[Task Reminder] Error fetching subscriptions:', subsError);
      throw subsError;
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      console.log('[Task Reminder] No push subscriptions found for users');
      return new Response(
        JSON.stringify({ success: true, message: 'No devices to notify', count: 0 }),
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
    
    // Generate JWT once for all notifications
    const jwt = await generateAPNsJWT(apnsKeyId, apnsTeamId, apnsPrivateKey);
    
    // Send notifications
    let sentCount = 0;
    let failedCount = 0;
    const invalidSubscriptionIds: string[] = [];
    
    for (const { task, userId } of tasksToNotify) {
      const userSubs = userSubscriptions.get(userId);
      if (!userSubs || userSubs.length === 0) {
        console.log(`[Task Reminder] No subscriptions for user ${userId}`);
        continue;
      }
      
      // Build notification content
      const emoji = task.emoji || '⏰';
      const title = `${emoji} ${task.title}`;
      const offsetText = task.reminder_offset === 0 
        ? "It's time!" 
        : task.reminder_offset === 10 
          ? 'Starting in 10 minutes'
          : task.reminder_offset === 30
            ? 'Starting in 30 minutes'
            : task.reminder_offset === 60
              ? 'Starting in 1 hour'
              : `Starting in ${task.reminder_offset} minutes`;
      
      const body = offsetText;
      const data = {
        type: 'task_reminder',
        url: '/app/home',
        taskId: task.id,
      };
      
      // Send to all user devices
      for (const sub of userSubs) {
        const deviceToken = sub.endpoint.replace('native:', '');
        const result = await sendToApns(deviceToken, title, body, data, jwt, bundleId, apnsEnvironment);
        
        if (result.success) {
          sentCount++;
          console.log(`[Task Reminder] ✅ Sent "${task.title}" to user ${userId}`);
        } else {
          failedCount++;
          console.error(`[Task Reminder] ❌ Failed for user ${userId}:`, result.error);
          
          if (result.shouldRemove) {
            invalidSubscriptionIds.push(sub.id);
          }
        }
      }
      
      // Log that we sent this reminder (to prevent duplicates)
      const { error: logError } = await supabase
        .from('task_reminder_logs')
        .insert({
          task_id: task.id,
          user_id: userId,
          reminder_date: today,
        })
        .onConflict('task_id,reminder_date')
        .ignore();
      
      if (logError) {
        console.error(`[Task Reminder] Failed to log reminder for task ${task.id}:`, logError);
      }
    }
    
    // Remove invalid subscriptions
    if (invalidSubscriptionIds.length > 0) {
      console.log(`[Task Reminder] Removing ${invalidSubscriptionIds.length} invalid subscriptions`);
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', invalidSubscriptionIds);
    }
    
    console.log(`[Task Reminder] Complete: Sent ${sentCount}, Failed ${failedCount}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount, 
        failed: failedCount,
        tasksProcessed: tasksToNotify.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[Task Reminder] Error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
