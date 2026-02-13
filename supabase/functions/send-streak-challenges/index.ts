import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

/**
 * Streak Challenge Push Notifications
 * 
 * Smart, scenario-based notifications for users with active streaks or goals.
 * 
 * Scenarios (priority order):
 * C. First Week Critical Path (account < 7 days old)
 * A. Streak Continuation (came yesterday, has active streak)
 *    - Approaching/reached streak goal
 *    - General streak milestones
 * B. Gold Badge Encouragement (partial completions today, or gold streak)
 * 
 * Each user gets MAX 1 notification per day from this function.
 * Respects momentum_celebration preference toggle.
 * Respects 8 AM - 8 PM in user's local timezone.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function isWithinActiveWindow(userTimezone: string | null): boolean {
  try {
    const tz = userTimezone || 'America/Los_Angeles';
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false });
    const hour = parseInt(formatter.format(now), 10);
    return hour >= 8 && hour < 20;
  } catch {
    return true;
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
): Promise<{ success: boolean; shouldRemove?: boolean }> {
  const host = environment === 'production' ? 'api.push.apple.com' : 'api.sandbox.push.apple.com';
  try {
    const response = await fetch(`https://${host}/3/device/${deviceToken}`, {
      method: 'POST',
      headers: {
        'authorization': `bearer ${jwt}`,
        'apns-topic': topic,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ aps: { alert: { title, body }, sound: 'default', badge: 1, 'mutable-content': 1 }, ...data }),
    });
    if (response.ok) return { success: true };
    const err = await response.text();
    console.error(`[StreakChallenge] APNs error:`, response.status, err);
    return { success: false, shouldRemove: response.status === 410 || response.status === 400 };
  } catch (e) {
    console.error('[StreakChallenge] Send failed:', e);
    return { success: false };
  }
}

interface StreakNotification {
  scenario: string;
  priority: number; // lower = higher priority
  title: string;
  body: string;
}

function getFirstWeekNotification(
  daysSinceSignup: number,
  cameYesterday: boolean,
  hasAnyCompletion: boolean,
): StreakNotification | null {
  if (daysSinceSignup > 7) return null;

  if (daysSinceSignup <= 1 && !hasAnyCompletion) {
    return { scenario: 'first_week_day1', priority: 1, title: '🌱 Your First Step', body: 'Your first action is waiting. Just one tap to start.' };
  }
  if (daysSinceSignup === 2 && cameYesterday) {
    return { scenario: 'first_week_day2', priority: 1, title: '🌱 Day 2!', body: "Day 2! You came back. That's already more than most." };
  }
  if (daysSinceSignup >= 2 && !cameYesterday) {
    return { scenario: 'first_week_return', priority: 1, title: '🌱 Come Back', body: 'You started something. Come back and keep it going.' };
  }
  if (daysSinceSignup >= 3) {
    return { scenario: `first_week_day${daysSinceSignup}`, priority: 1, title: `🌱 Day ${daysSinceSignup}`, body: `Day ${daysSinceSignup} of your first week. You're building a habit.` };
  }
  return null;
}

function getStreakNotification(
  currentStreak: number,
  streakGoal: number | null,
): StreakNotification | null {
  if (currentStreak < 2) return null;

  // Goal proximity / reached
  if (streakGoal && streakGoal > 0) {
    const remaining = streakGoal - currentStreak;
    if (remaining === 0) {
      return { scenario: 'streak_goal_reached', priority: 2, title: '🏆 Goal Reached!', body: `You did it. ${streakGoal} days. That's not luck, that's you.` };
    }
    if (remaining > 0 && remaining <= 3) {
      return { scenario: 'streak_goal_close', priority: 2, title: '🔥 Almost There', body: `${currentStreak} of ${streakGoal} days done. Just ${remaining} more to hit your target.` };
    }
  }

  // General streak milestones
  if (currentStreak === 2) {
    return { scenario: 'streak_2', priority: 4, title: '🔥 2 Days!', body: '2 days in a row! Come back for day 3 and make it a real streak.' };
  }
  if (currentStreak === 3) {
    return { scenario: 'streak_3', priority: 4, title: "🔥 3 Days Strong", body: "3 days strong. You're building something real." };
  }
  if (currentStreak >= 5) {
    return { scenario: `streak_${currentStreak}`, priority: 4, title: `🔥 Day ${currentStreak}`, body: `Day ${currentStreak}. You're proving it to yourself.` };
  }
  return null;
}

function getGoldNotification(
  currentGoldStreak: number | null,
  hadGoldYesterday: boolean,
  todayCompleted: number,
  todayTotal: number,
): StreakNotification | null {
  // Gold streak continuation
  if (currentGoldStreak && currentGoldStreak >= 2) {
    return { scenario: 'gold_streak', priority: 3, title: '🥇 Gold Streak', body: `Gold streak: ${currentGoldStreak} days. Don't break the chain.` };
  }
  // Had gold yesterday, encourage again
  if (hadGoldYesterday) {
    return { scenario: 'gold_yesterday', priority: 3, title: '🥇 Gold Again?', body: 'Yesterday was Gold. Can you do it again today?' };
  }
  // Partial completions today
  if (todayCompleted > 0 && todayTotal > 0 && todayCompleted < todayTotal) {
    return { scenario: 'gold_partial', priority: 5, title: '🥇 Finish for Gold', body: `You've done ${todayCompleted}/${todayTotal} actions today. Finish all to earn your Gold badge.` };
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

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
    const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];

    console.log(`[StreakChallenge] Running at ${now.toISOString()}`);

    // Get all users with streaks
    const { data: streaks, error: streakErr } = await supabase
      .from('user_streaks')
      .select('user_id, current_streak, streak_goal, last_completion_date, current_gold_streak, last_gold_date');
    
    if (streakErr) throw streakErr;
    if (!streaks || streaks.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No streaks', count: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userIds = streaks.map(s => s.user_id);

    // Get profiles for timezone + created_at
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, timezone, created_at')
      .in('id', userIds);
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Check preferences
    const { data: prefs } = await supabase
      .from('user_notification_preferences')
      .select('user_id, momentum_celebration')
      .in('user_id', userIds);
    const prefsMap = new Map(prefs?.map(p => [p.user_id, p.momentum_celebration]) || []);

    // Cross-function daily cooldown: check if user already got ANY server-side PN today
    const { data: anyPnToday } = await supabase
      .from('pn_schedule_logs')
      .select('user_id')
      .in('function_name', ['send-momentum-celebration', 'send-streak-challenges', 'send-drip-followup'])
      .in('user_id', userIds)
      .gte('sent_at', `${today}T00:00:00Z`);
    const alreadySentSet = new Set(anyPnToday?.map(s => s.user_id) || []);

    // Get today's task completions for gold badge logic
    const { data: todayCompletions } = await supabase
      .from('planner_program_completions')
      .select('user_id')
      .eq('completed_date', today)
      .in('user_id', userIds);
    
    // Count completions per user today
    const completionCounts = new Map<string, number>();
    for (const c of (todayCompletions || [])) {
      completionCounts.set(c.user_id, (completionCounts.get(c.user_id) || 0) + 1);
    }

    // Get total active tasks per user for gold calculation
    const { data: activeTasks } = await supabase
      .from('user_tasks')
      .select('user_id')
      .eq('is_active', true)
      .in('user_id', userIds);
    
    const taskCounts = new Map<string, number>();
    for (const t of (activeTasks || [])) {
      taskCounts.set(t.user_id, (taskCounts.get(t.user_id) || 0) + 1);
    }

    // Get push subscriptions
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('user_id, endpoint, id')
      .in('user_id', userIds)
      .like('endpoint', 'native:%');

    const userSubs = new Map<string, typeof subs>();
    for (const sub of (subs || [])) {
      const existing = userSubs.get(sub.user_id) || [];
      existing.push(sub);
      userSubs.set(sub.user_id, existing);
    }

    const jwt = await signJWT({ alg: 'ES256', kid: apnsKeyId }, { iss: apnsTeamId, iat: Math.floor(Date.now() / 1000) }, apnsPrivateKey);

    let sentCount = 0;
    let skipCount = 0;
    const invalidIds: string[] = [];
    const logsToInsert: any[] = [];

    for (const streak of streaks) {
      const userId = streak.user_id;
      
      // Skip if already sent, preference off, no device, or outside window
      if (alreadySentSet.has(userId)) { skipCount++; continue; }
      const pref = prefsMap.get(userId);
      if (pref === false) continue;
      
      const profile = profileMap.get(userId);
      if (!profile) continue;
      if (!isWithinActiveWindow(profile.timezone)) continue;

      const devices = userSubs.get(userId);
      if (!devices || devices.length === 0) continue;

      const cameYesterday = streak.last_completion_date === yesterday || streak.last_completion_date === today;
      const hasAnyCompletion = !!streak.last_completion_date;
      const daysSinceSignup = Math.floor((now.getTime() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24));
      const hadGoldYesterday = streak.last_gold_date === yesterday;
      const todayCompleted = completionCounts.get(userId) || 0;
      const todayTotal = taskCounts.get(userId) || 0;

      // Collect all possible notifications, pick highest priority
      const candidates: StreakNotification[] = [];

      const firstWeek = getFirstWeekNotification(daysSinceSignup, cameYesterday, hasAnyCompletion);
      if (firstWeek) candidates.push(firstWeek);

      if (cameYesterday) {
        const streakNotif = getStreakNotification(streak.current_streak, streak.streak_goal);
        if (streakNotif) candidates.push(streakNotif);
      }

      const goldNotif = getGoldNotification(streak.current_gold_streak, hadGoldYesterday, todayCompleted, todayTotal);
      if (goldNotif) candidates.push(goldNotif);

      if (candidates.length === 0) continue;

      // Pick highest priority (lowest number)
      candidates.sort((a, b) => a.priority - b.priority);
      const chosen = candidates[0];

      // Personalize title with first name
      const firstName = profile.full_name?.split(' ')[0];
      const title = firstName ? `${chosen.title}, ${firstName}` : chosen.title;

      for (const device of devices) {
        const token = device.endpoint.replace('native:', '');
        const result = await sendToApns(token, title, chosen.body, { type: 'streak_challenge', url: '/app/home', scenario: chosen.scenario }, jwt, bundleId, apnsEnvironment);
        if (result.success) sentCount++;
        else if (result.shouldRemove) invalidIds.push(device.id);
      }

      logsToInsert.push({
        user_id: userId,
        function_name: 'send-streak-challenges',
        notification_type: `streak_challenge_${chosen.scenario}`,
        scheduled_for: now.toISOString(),
        sent_at: now.toISOString(),
        status: 'sent',
      });
    }

    if (logsToInsert.length > 0) await supabase.from('pn_schedule_logs').insert(logsToInsert);
    if (invalidIds.length > 0) await supabase.from('push_subscriptions').delete().in('id', invalidIds);

    console.log(`[StreakChallenge] Complete: Sent ${sentCount}, Skipped ${skipCount}`);
    return new Response(JSON.stringify({ success: true, sent: sentCount, skipped: skipCount, total: streaks.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[StreakChallenge] Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
