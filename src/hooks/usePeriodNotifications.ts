import { useEffect, useCallback } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { logLocalNotificationEvent } from '@/lib/localNotificationLogger';

/**
 * Period Tracker Local Notifications
 * 
 * Schedules notifications based on period_settings:
 * - Before period start (reminder_days before)
 * - On predicted start day
 * - Daily during predicted period (for logging)
 * 
 * ID range: 200031-200040
 * All scheduled between 8 AM and 8 PM.
 */

const ID_RANGE = { start: 200031, end: 200040 };

function getScheduleDate(daysFromNow: number, hour: number = 9, minute: number = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function usePeriodNotifications(userId: string | undefined) {
  const schedulePeriodReminders = useCallback(async () => {
    if (!Capacitor.isNativePlatform() || !userId) return;

    try {
      // Cancel existing period notifications
      const cancelIds = [];
      for (let i = ID_RANGE.start; i <= ID_RANGE.end; i++) cancelIds.push({ id: i });
      await LocalNotifications.cancel({ notifications: cancelIds });

      // Fetch period settings
      const { data: settings } = await supabase
        .from('period_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!settings || !settings.reminder_enabled || !settings.last_period_start) {
        console.log('[PeriodNotif] No period settings or reminders disabled');
        return;
      }

      const lastStart = new Date(settings.last_period_start);
      const cycleLength = settings.average_cycle || 28;
      const periodLength = settings.average_period || 5;
      const reminderDays = settings.reminder_days || 2;

      // Calculate next predicted period start
      const now = new Date();
      let nextStart = new Date(lastStart);
      while (nextStart <= now) {
        nextStart.setDate(nextStart.getDate() + cycleLength);
      }

      const daysUntilStart = Math.floor((nextStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const notifications: any[] = [];
      let idCounter = ID_RANGE.start;

      // Pre-period reminder
      const reminderDaysOut = daysUntilStart - reminderDays;
      if (reminderDaysOut >= 0 && reminderDaysOut <= 30 && idCounter <= ID_RANGE.end) {
        notifications.push({
          id: idCounter++,
          title: '🌸 Period Reminder',
          body: `Your period may start in ${reminderDays} day${reminderDays > 1 ? 's' : ''}. Prepare yourself.`,
          schedule: { at: getScheduleDate(reminderDaysOut, 9, 0) },
          sound: 'default',
          extra: { type: 'period_reminder', url: '/app/period' },
        });
      }

      // Start day notification
      if (daysUntilStart >= 0 && daysUntilStart <= 30 && idCounter <= ID_RANGE.end) {
        notifications.push({
          id: idCounter++,
          title: '🌸 Period May Have Started',
          body: 'Your period may have started today. Tap to log.',
          schedule: { at: getScheduleDate(daysUntilStart, 10, 0) },
          sound: 'default',
          extra: { type: 'period_reminder', url: '/app/period' },
        });
      }

      // Daily logging reminders during predicted period
      for (let d = 1; d < periodLength && idCounter <= ID_RANGE.end; d++) {
        const dayOffset = daysUntilStart + d;
        if (dayOffset >= 0 && dayOffset <= 30) {
          notifications.push({
            id: idCounter++,
            title: '🌸 Log Your Day',
            body: "Don't forget to log today.",
            schedule: { at: getScheduleDate(dayOffset, 10, 0) },
            sound: 'default',
            extra: { type: 'period_reminder', url: '/app/period' },
          });
        }
      }

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
        console.log(`[PeriodNotif] ✅ Scheduled ${notifications.length} period reminders`);
        
        for (const n of notifications) {
          logLocalNotificationEvent({
            notificationType: 'period_reminder',
            event: 'scheduled',
            notificationId: n.id,
          });
        }
      }
    } catch (err) {
      console.error('[PeriodNotif] Error:', err);
    }
  }, [userId]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !userId) return;
    const timer = setTimeout(schedulePeriodReminders, 7000);
    return () => clearTimeout(timer);
  }, [userId, schedulePeriodReminders]);

  return { schedulePeriodReminders };
}
