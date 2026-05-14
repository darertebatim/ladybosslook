import { useEffect, useCallback } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { logLocalNotificationEvent } from '@/lib/localNotificationLogger';
import { getLocalDateStr, taskAppliesToDate } from '@/lib/localDate';

/**
 * Smart Task Nudges - Local Notification Scheduler
 *
 * Schedules random notifications from user's actual planner data:
 * - Task Reminders: 1-3 random incomplete tasks (IDs: 200001-200010)
 * - ProTask Nudges: 1 random proaction (IDs: 200011-200020)
 *
 * Water reminders moved to useWaterNotifications.ts (separate tool).
 * Fasting reminders moved to useFastingNotifications.ts.
 * Period reminders live in usePeriodNotifications.ts.
 *
 * All scheduled between 8 AM and 8 PM local time.
 * Reschedules daily on app open.
 */

const ID_RANGES = {
  ACTION: { start: 200001, end: 200010 },
  PROACTION: { start: 200011, end: 200020 },
};

const PROACTION_MESSAGES: Record<string, { emoji: string; title: string; body: string }> = {
  emotion: { emoji: '🎭', title: 'Check in with yourself', body: 'How are you feeling right now? Tap to log your emotion.' },
  journal: { emoji: '📝', title: 'Your journal is waiting', body: 'Take a moment to write. Even a few words matter.' },
  breathe: { emoji: '🫁', title: 'Time for breathing', body: 'A few deep breaths can change your whole day.' },
  playlist: { emoji: '🎧', title: 'Your audio is ready', body: "There's a lesson waiting for you. Tap to listen." },
  water: { emoji: '💧', title: 'Stay hydrated', body: 'Have you had water recently? Your body will thank you.' },
};

const ACTION_BODIES = [
  'Time to do this! Your strength grows with each action.',
  "You've got this. One action at a time.",
  'Your future self will thank you. Start now.',
  "Small steps, big change. Let's go.",
];

function avoidRoundedMinute(minute: number): number {
  const rounded = [0, 15, 30, 45];
  if (rounded.includes(minute)) {
    return minute + (Math.random() > 0.5 ? Math.floor(Math.random() * 7) + 1 : -(Math.floor(Math.random() * 7) + 1) + 60) % 60;
  }
  return minute;
}

function randomTimeBetween(startHour: number, endHour: number): { hour: number; minute: number } | null {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Effective range: 8:03 - 19:47
  const effectiveStart = Math.max(startHour, currentHour);
  const effectiveEnd = endHour === 20 ? 20 : endHour;

  // If we're past the end window, no time slot available today
  if (effectiveStart >= effectiveEnd) return null;

  const hour = effectiveStart + Math.floor(Math.random() * (effectiveEnd - effectiveStart));
  let minute = Math.floor(Math.random() * 60);
  minute = avoidRoundedMinute(minute);

  // Clamp to safe boundaries
  if (hour === 8 && minute < 3) minute = 3 + Math.floor(Math.random() * 10);
  if (hour === 19 && minute > 47) minute = 40 + Math.floor(Math.random() * 8);

  // If this exact hour is the current hour, ensure minute is in the future
  if (hour === currentHour && minute <= currentMinute) {
    minute = currentMinute + 2 + Math.floor(Math.random() * 10);
    if (minute >= 60) return null; // No room left in this hour
  }

  return { hour, minute };
}

function getScheduleDate(hour: number, minute: number): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

export function useSmartActionNudges(userId: string | undefined) {
  const scheduleNudges = useCallback(async () => {
    if (!Capacitor.isNativePlatform() || !userId) return;

    try {
      // Cancel all existing smart nudge notifications
      const allIds = [];
      for (let i = ID_RANGES.ACTION.start; i <= ID_RANGES.ACTION.end; i++) allIds.push({ id: i });
      for (let i = ID_RANGES.PROACTION.start; i <= ID_RANGES.PROACTION.end; i++) allIds.push({ id: i });
      for (let i = ID_RANGES.WATER.start; i <= ID_RANGES.WATER.end; i++) allIds.push({ id: i });

      await LocalNotifications.cancel({ notifications: allIds });

      const todayStr = getLocalDateStr();

      // Fetch all active tasks + today's completions
      const [{ data: tasks }, { data: completions }] = await Promise.all([
        supabase
          .from('user_tasks')
          .select('id, title, emoji, pro_link_type, goal_type, goal_target, is_active, repeat_pattern, repeat_days, scheduled_date, created_at, repeat_end_date')
          .eq('user_id', userId)
          .eq('is_active', true),
        supabase
          .from('task_completions')
          .select('task_id, goal_progress')
          .eq('user_id', userId)
          .eq('completed_date', todayStr),
      ]);

      if (!tasks || tasks.length === 0) {
        console.log('[SmartNudges] No active tasks, skipping');
        return;
      }

      // For one-time tasks, track if they were ever completed (so completed one-time tasks never re-nudge)
      const oneTimeTaskIds = tasks
        .filter((t) => t.repeat_pattern === 'none')
        .map((t) => t.id);

      let oneTimeCompletedSet = new Set<string>();
      if (oneTimeTaskIds.length > 0) {
        const { data: oneTimeCompletions } = await supabase
          .from('task_completions')
          .select('task_id')
          .eq('user_id', userId)
          .in('task_id', oneTimeTaskIds);

        oneTimeCompletedSet = new Set((oneTimeCompletions || []).map((c) => c.task_id));
      }

      // Mirror Home behavior: include tasks that apply today + carry-forward uncompleted one-time tasks
      const applicableTasks = tasks.filter((task) => {
        if (task.repeat_pattern === 'none') {
          if (!task.scheduled_date) return false;
          if (task.scheduled_date === todayStr) return true;
          return task.scheduled_date < todayStr && !oneTimeCompletedSet.has(task.id);
        }

        return taskAppliesToDate(task, todayStr);
      });

      if (applicableTasks.length === 0) {
        console.log('[SmartNudges] No applicable tasks for today, skipping');
        return;
      }

      // Filter out tasks already completed today
      const completedTaskIds = new Set((completions || []).map((c) => c.task_id));
      const incompleteTasks = applicableTasks.filter((t) => !completedTaskIds.has(t.id));

      if (incompleteTasks.length === 0) {
        console.log('[SmartNudges] All applicable tasks completed today, skipping');
        return;
      }

      const notifications: any[] = [];

      // 2a. Random Action Reminders (non-proaction, incomplete tasks)
      const regularTasks = incompleteTasks.filter((t) => !t.pro_link_type);
      const selectedTasks = pickRandom(regularTasks, 3);

      selectedTasks.forEach((task, idx) => {
        const time = randomTimeBetween(8, 20);
        if (!time) return; // No available time slot today
        const scheduleAt = getScheduleDate(time.hour, time.minute);

        notifications.push({
          id: ID_RANGES.ACTION.start + idx,
          title: `${task.emoji} ${task.title}`,
          body: ACTION_BODIES[Math.floor(Math.random() * ACTION_BODIES.length)],
          schedule: { at: scheduleAt },
          sound: 'default',
          extra: { type: 'action_nudge', url: '/app/home', taskId: task.id },
        });
      });

      // 2b. ProAction Nudges (incomplete only)
      const proTasks = incompleteTasks.filter((t) => t.pro_link_type && t.pro_link_type !== 'water');
      if (proTasks.length > 0) {
        const selected = pickRandom(proTasks, 1)[0];
        const msgConfig = PROACTION_MESSAGES[selected.pro_link_type!] || PROACTION_MESSAGES.playlist;
        const time = randomTimeBetween(8, 20);
        if (time) {
          const scheduleAt = getScheduleDate(time.hour, time.minute);

          notifications.push({
            id: ID_RANGES.PROACTION.start,
            title: `${msgConfig.emoji} ${msgConfig.title}`,
            body: msgConfig.body,
            schedule: { at: scheduleAt },
            sound: 'default',
            extra: { type: 'proaction_nudge', url: '/app/home', taskId: selected.id },
          });
        }
      }

      // 2c. Water Reminders — respect today's progress, cap aggressively
      const waterTasks = applicableTasks.filter(
        (t) => t.pro_link_type === 'water' || t.goal_type === 'water'
      );
      const completionByTask = new Map(
        (completions || []).map((c) => [c.task_id, c.goal_progress ?? 0])
      );
      // A water task is "done" if no goal_target OR progress >= target OR marked complete
      const incompleteWaterTasks = waterTasks.filter((t) => {
        const progress = completionByTask.get(t.id) ?? 0;
        const target = (t as any).goal_target ?? 0;
        if (target > 0) return progress < target;
        // No target set — treat as done if any completion exists today
        return !completionByTask.has(t.id);
      });
      if (incompleteWaterTasks.length > 0) {
        // Cap at 2 reminders/day (was 3-4 — caused spam)
        const waterCount = 1 + Math.floor(Math.random() * 2); // 1-2
        for (let i = 0; i < waterCount; i++) {
          const time = randomTimeBetween(8, 20);
          if (!time) continue; // No available time slot
          const scheduleAt = getScheduleDate(time.hour, time.minute);

          notifications.push({
            id: ID_RANGES.WATER.start + i,
            title: '💧 Water Reminder',
            body: WATER_MESSAGES[i % WATER_MESSAGES.length],
            schedule: { at: scheduleAt },
            sound: 'default',
            extra: { type: 'water_nudge', url: '/app/home' },
          });
        }
      } else {
        console.log('[SmartNudges] 💧 Water complete or removed — no reminders today');
      }

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
        console.log(`[SmartNudges] ✅ Scheduled ${notifications.length} nudges`);

        // Log scheduled events
        for (const n of notifications) {
          logLocalNotificationEvent({
            notificationType: n.extra.type === 'water_nudge' ? 'water_reminder' : 'action_nudge',
            event: 'scheduled',
            notificationId: n.id,
            taskId: n.extra.taskId,
          });
        }
      }
    } catch (err) {
      console.error('[SmartNudges] Error scheduling:', err);
    }
  }, [userId]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !userId) return;

    // Schedule on app launch with a small delay
    const timer = setTimeout(scheduleNudges, 5000);
    return () => clearTimeout(timer);
  }, [userId, scheduleNudges]);

  return { scheduleNudges };
}
