import { useEffect, useCallback } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { logLocalNotificationEvent } from '@/lib/localNotificationLogger';

/**
 * Fasting Tool Local Notifications
 *
 * Schedules notifications anchored to the user's active fasting session:
 * - When the fasting target window completes (started_at + fasting_hours)
 * - When the eating window ends (started_at + 24h) so they know to start the
 *   next fast.
 *
 * ID range: 200041-200050
 * Reschedules on app launch and whenever the active session changes.
 */

const ID_RANGE = { start: 200041, end: 200050 };

export function useFastingNotifications(userId: string | undefined) {
  const scheduleFastingReminders = useCallback(async () => {
    if (!Capacitor.isNativePlatform() || !userId) return;

    try {
      const cancelIds = [];
      for (let i = ID_RANGE.start; i <= ID_RANGE.end; i++) cancelIds.push({ id: i });
      await LocalNotifications.cancel({ notifications: cancelIds });

      // Active fasting session
      const { data: activeRows } = await supabase
        .from('fasting_sessions' as any)
        .select('*')
        .eq('user_id', userId)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1);

      const active = (activeRows as any)?.[0];
      const notifications: any[] = [];
      const now = Date.now();

      if (active) {
        const startedAt = new Date(active.started_at).getTime();
        const targetMs = startedAt + active.fasting_hours * 3600 * 1000;
        if (targetMs > now + 60_000) {
          notifications.push({
            id: ID_RANGE.start,
            title: '⏱️ Fasting Window Complete',
            body: `You've reached your ${active.fasting_hours}h fast. You can break it whenever you're ready.`,
            schedule: { at: new Date(targetMs) },
            sound: 'default',
            extra: { type: 'fasting_complete', url: '/app/fasting' },
          });
        }
      } else {
        // Most recent ended session — eating window may still be active
        const { data: recent } = await supabase
          .from('fasting_sessions' as any)
          .select('*')
          .eq('user_id', userId)
          .not('ended_at', 'is', null)
          .order('ended_at', { ascending: false })
          .limit(1);
        const last = (recent as any)?.[0];
        if (last?.ended_at) {
          const endedAt = new Date(last.ended_at).getTime();
          const eatingHours = 24 - last.fasting_hours;
          const eatingEndMs = endedAt + eatingHours * 3600 * 1000;
          if (eatingEndMs > now + 60_000) {
            notifications.push({
              id: ID_RANGE.start + 1,
              title: '🍽️ Eating Window Closing',
              body: 'Your eating window is ending. Ready to start the next fast?',
              schedule: { at: new Date(eatingEndMs) },
              sound: 'default',
              extra: { type: 'fasting_eating_end', url: '/app/fasting' },
            });
          }
        }
      }

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
        console.log(`[FastingNotif] ✅ Scheduled ${notifications.length} fasting reminders`);
        for (const n of notifications) {
          logLocalNotificationEvent({
            notificationType: 'fasting_reminder',
            event: 'scheduled',
            notificationId: n.id,
          });
        }
      }
    } catch (err) {
      console.error('[FastingNotif] Error:', err);
    }
  }, [userId]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !userId) return;
    const t = setTimeout(scheduleFastingReminders, 8000);
    return () => clearTimeout(t);
  }, [userId, scheduleFastingReminders]);

  return { scheduleFastingReminders };
}
