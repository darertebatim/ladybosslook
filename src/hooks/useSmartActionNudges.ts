import { useEffect, useCallback } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { logLocalNotificationEvent } from '@/lib/localNotificationLogger';

/**
 * Smart Action Nudges - Local Notification Scheduler
 * 
 * Schedules random notifications from user's actual planner data:
 * - Action Reminders: 1-3 random incomplete tasks (IDs: 200001-200010)
 * - ProAction Nudges: 1 random proaction (IDs: 200011-200020)
 * - Water Reminders: 3-4 random times (IDs: 200021-200030)
 * 
 * All scheduled between 8 AM and 8 PM local time.
 * Reschedules daily on app open.
 */

const ID_RANGES = {
  ACTION: { start: 200001, end: 200010 },
  PROACTION: { start: 200011, end: 200020 },
  WATER: { start: 200021, end: 200030 },
};

const PROACTION_MESSAGES: Record<string, { emoji: string; title: string; body: string }> = {
  emotion: { emoji: '🎭', title: 'Check in with yourself', body: 'How are you feeling right now? Tap to log your emotion.' },
  journal: { emoji: '📝', title: 'Your journal is waiting', body: 'Take a moment to write. Even a few words matter.' },
  breathe: { emoji: '🫁', title: 'Time for breathing', body: 'A few deep breaths can change your whole day.' },
  playlist: { emoji: '🎧', title: 'Your audio is ready', body: "There's a lesson waiting for you. Tap to listen." },
  water: { emoji: '💧', title: 'Stay hydrated', body: 'Have you had water recently? Your body will thank you.' },
};

const WATER_MESSAGES = [
  'Have you had water recently? 💧',
  'Stay hydrated — your body will thank you 💧',
  'Time for a glass of water 💧',
  'Hydration check! Keep going 💧',
];

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

function randomTimeBetween(startHour: number, endHour: number): { hour: number; minute: number } {
  // Schedule between 8:03 and 19:47 to avoid exact boundary times
  const effectiveStart = startHour === 8 ? 8 : startHour;
  const effectiveEnd = endHour === 20 ? 20 : endHour;
  const hour = effectiveStart + Math.floor(Math.random() * (effectiveEnd - effectiveStart));
  let minute = Math.floor(Math.random() * 60);
  minute = avoidRoundedMinute(minute);
  // Clamp to 8:03 - 19:47 range
  if (hour === 8 && minute < 3) minute = 3 + Math.floor(Math.random() * 10);
  if (hour === 19 && minute > 47) minute = 40 + Math.floor(Math.random() * 8);
  return { hour, minute };
}

function getScheduleDate(hour: number, minute: number): Date {
  const now = new Date();
  const scheduled = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
  // If time already passed today, schedule for tomorrow
  if (scheduled <= now) {
    scheduled.setDate(scheduled.getDate() + 1);
  }
  return scheduled;
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

      // Fetch user's active tasks AND today's completions in parallel
      const todayStr = new Date().toISOString().split('T')[0];
      const [{ data: tasks }, { data: completions }] = await Promise.all([
        supabase
          .from('user_tasks')
          .select('id, title, emoji, pro_link_type, goal_type, is_active')
          .eq('user_id', userId)
          .eq('is_active', true),
        supabase
          .from('task_completions')
          .select('task_id')
          .eq('user_id', userId)
          .eq('completed_date', todayStr),
      ]);

      if (!tasks || tasks.length === 0) {
        console.log('[SmartNudges] No active tasks, skipping');
        return;
      }

      // Filter out tasks already completed today
      const completedTaskIds = new Set((completions || []).map(c => c.task_id));
      const incompleteTasks = tasks.filter(t => !completedTaskIds.has(t.id));

      if (incompleteTasks.length === 0) {
        console.log('[SmartNudges] All tasks completed today, skipping');
        return;
      }

      const notifications: any[] = [];

      // 2a. Random Action Reminders (non-proaction, incomplete tasks)
      const regularTasks = incompleteTasks.filter(t => !t.pro_link_type);
      const selectedTasks = pickRandom(regularTasks, 3);
      
      selectedTasks.forEach((task, idx) => {
        const time = randomTimeBetween(8, 20);
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
      const proTasks = incompleteTasks.filter(t => t.pro_link_type && t.pro_link_type !== 'water');
      if (proTasks.length > 0) {
        const selected = pickRandom(proTasks, 1)[0];
        const msgConfig = PROACTION_MESSAGES[selected.pro_link_type!] || PROACTION_MESSAGES.playlist;
        const time = randomTimeBetween(8, 20);
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

      // 2c. Water Reminders (always show if water task exists, even if completed — hydration is recurring)
      const hasWater = incompleteTasks.some(t => t.pro_link_type === 'water' || t.goal_type === 'water')
        || tasks.some(t => t.pro_link_type === 'water' || t.goal_type === 'water');
      if (hasWater) {
        const waterCount = 3 + Math.floor(Math.random() * 2); // 3-4
        for (let i = 0; i < waterCount; i++) {
          const time = randomTimeBetween(8, 20);
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
