import { useEffect, useCallback } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { logLocalNotificationEvent } from '@/lib/localNotificationLogger';
import { getLocalDateStr, taskAppliesToDate } from '@/lib/localDate';

/**
 * Protein Reminders — separate from Smart Task Nudges so the Protein tool can
 * own its own notification stream (and we can later add user-facing toggles).
 *
 * ID range: 200021-200030
 * 1-2 random reminders/day between 8 AM - 8 PM, only if user has an incomplete
 * protein task today.
 */

const ID_RANGE = { start: 200031, end: 200040 };

const PROTEIN_MESSAGES = [
  'Have you had protein recently? 🍗',
  'Keep your protein up — your muscles will thank you 🍗',
  'Time for a protein-rich snack 🍗',
  'Protein check! Keep going 🍗',
];

function avoidRoundedMinute(minute: number): number {
  const rounded = [0, 15, 30, 45];
  if (rounded.includes(minute)) {
    return (minute + Math.floor(Math.random() * 7) + 1) % 60;
  }
  return minute;
}

function randomTimeBetween(startHour: number, endHour: number) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const effectiveStart = Math.max(startHour, currentHour);
  if (effectiveStart >= endHour) return null;
  const hour = effectiveStart + Math.floor(Math.random() * (endHour - effectiveStart));
  let minute = avoidRoundedMinute(Math.floor(Math.random() * 60));
  if (hour === currentHour && minute <= currentMinute) {
    minute = currentMinute + 2 + Math.floor(Math.random() * 10);
    if (minute >= 60) return null;
  }
  return { hour, minute };
}

function getScheduleDate(hour: number, minute: number) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
}

export function useProteinNotifications(userId: string | undefined) {
  const scheduleProteinReminders = useCallback(async () => {
    if (!Capacitor.isNativePlatform() || !userId) return;

    try {
      const cancelIds = [];
      for (let i = ID_RANGE.start; i <= ID_RANGE.end; i++) cancelIds.push({ id: i });
      await LocalNotifications.cancel({ notifications: cancelIds });

      const todayStr = getLocalDateStr();

      const [{ data: tasks }, { data: completions }] = await Promise.all([
        supabase
          .from('user_tasks')
          .select('id, title, pro_link_type, goal_type, goal_target, goal_unit, is_active, repeat_pattern, repeat_days, scheduled_date, created_at, repeat_end_date')
          .eq('user_id', userId)
          .eq('is_active', true),
        supabase
          .from('task_completions')
          .select('task_id, goal_progress')
          .eq('user_id', userId)
          .eq('completed_date', todayStr),
      ]);

      if (!tasks?.length) return;

      const applicable = tasks.filter((t) => {
        if (t.repeat_pattern === 'none') return t.scheduled_date === todayStr;
        return taskAppliesToDate(t, todayStr);
      });

      const proteinTasks = applicable.filter(
        (t) => t.pro_link_type === 'protein'
      );
      if (!proteinTasks.length) {
        console.log('[ProteinNotif] No protein tasks today');
        return;
      }

      const completionByTask = new Map(
        (completions || []).map((c) => [c.task_id, c.goal_progress ?? 0])
      );
      const incomplete = proteinTasks.filter((t) => {
        const progress = completionByTask.get(t.id) ?? 0;
        const target = (t as any).goal_target ?? 0;
        if (target > 0) return progress < target;
        return !completionByTask.has(t.id);
      });

      if (!incomplete.length) {
        console.log('[ProteinNotif] 🍗 Protein complete for today');
        return;
      }

      const count = 1 + Math.floor(Math.random() * 2); // 1-2
      const notifications: any[] = [];
      for (let i = 0; i < count; i++) {
        const time = randomTimeBetween(8, 20);
        if (!time) continue;
        notifications.push({
          id: ID_RANGE.start + i,
          title: '🍗 Protein Reminder',
          body: PROTEIN_MESSAGES[i % PROTEIN_MESSAGES.length],
          schedule: { at: getScheduleDate(time.hour, time.minute) },
          sound: 'default',
          extra: { type: 'protein_nudge', url: '/app/protein' },
        });
      }

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
        console.log(`[ProteinNotif] ✅ Scheduled ${notifications.length} protein reminders`);
        for (const n of notifications) {
          logLocalNotificationEvent({
            notificationType: 'protein_reminder',
            event: 'scheduled',
            notificationId: n.id,
          });
        }
      }
    } catch (err) {
      console.error('[ProteinNotif] Error:', err);
    }
  }, [userId]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !userId) return;
    const t = setTimeout(scheduleProteinReminders, 6000);
    return () => clearTimeout(t);
  }, [userId, scheduleProteinReminders]);

  return { scheduleProteinReminders };
}
