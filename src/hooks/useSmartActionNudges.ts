import { useEffect, useCallback } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { logLocalNotificationEvent } from '@/lib/localNotificationLogger';
import { getLocalDateStr } from '@/lib/localDate';

/**
 * Daily Pulse - Local Notification Scheduler
 *
 * Schedules up to 2 gentle daily nudges, content decided at schedule time
 * based on the user's current state. Never references specific tasks.
 *
 * Priorities:
 *   1. Mood Check-in   — fires midday if no mood logged today  → /app/mood
 *   2. Streak at Risk  — fires evening if user has active streak → /app/home
 *
 * Other tools (water, period, fasting) have their own dedicated schedulers.
 */

const PULSE_IDS = {
  MOOD: 200001,
  STREAK: 200002,
};

const ALL_IDS = Object.values(PULSE_IDS).map((id) => ({ id }));

function todayAt(hour: number, minute: number): Date | null {
  const now = new Date();
  const at = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
  if (at.getTime() <= now.getTime() + 60_000) return null; // skip if already past
  return at;
}

export function useSmartActionNudges(userId: string | undefined) {
  const scheduleNudges = useCallback(async () => {
    if (!Capacitor.isNativePlatform() || !userId) return;

    try {
      // Cancel any existing pulse notifications
      await LocalNotifications.cancel({ notifications: ALL_IDS });

      const todayStr = getLocalDateStr();
      const startOfDayIso = new Date(`${todayStr}T00:00:00`).toISOString();

      // Fetch state in parallel: today's mood log + current streak
      const [moodRes, streakRes] = await Promise.all([
        supabase
          .from('mood_logs')
          .select('id')
          .eq('user_id', userId)
          .gte('created_at', startOfDayIso)
          .limit(1),
        supabase
          .from('user_streaks')
          .select('current_streak')
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

      const moodLoggedToday = (moodRes.data?.length ?? 0) > 0;
      const currentStreak = streakRes.data?.current_streak ?? 0;

      const notifications: any[] = [];

      // Priority 1: Mood check-in (midday, ~14:00)
      if (!moodLoggedToday) {
        const at = todayAt(14, 5 + Math.floor(Math.random() * 50));
        if (at) {
          notifications.push({
            id: PULSE_IDS.MOOD,
            title: '💛 How are you feeling?',
            body: 'Take a moment to check in with yourself.',
            schedule: { at },
            sound: 'default',
            extra: { type: 'daily_pulse_mood', url: '/app/mood' },
          });
        }
      }

      // Priority 2: Streak at risk (evening, ~19:30)
      if (currentStreak >= 1) {
        const at = todayAt(19, 15 + Math.floor(Math.random() * 30));
        if (at) {
          notifications.push({
            id: PULSE_IDS.STREAK,
            title: `🔥 Your ${currentStreak}-day streak is waiting`,
            body: "Don't let it slip — open the app to keep it alive.",
            schedule: { at },
            sound: 'default',
            extra: { type: 'daily_pulse_streak', url: '/app/home' },
          });
        }
      }

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
        console.log(`[DailyPulse] ✅ Scheduled ${notifications.length} pulse(s)`);
        for (const n of notifications) {
          logLocalNotificationEvent({
            notificationType: n.extra.type,
            event: 'scheduled',
            notificationId: n.id,
          });
        }
      } else {
        console.log('[DailyPulse] Nothing to schedule today');
      }
    } catch (err) {
      console.error('[DailyPulse] Error scheduling:', err);
    }
  }, [userId]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !userId) return;
    const timer = setTimeout(scheduleNudges, 5000);
    return () => clearTimeout(timer);
  }, [userId, scheduleNudges]);

  return { scheduleNudges };
}
