import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { clearLegacyDailyLocalNotificationsOnce } from '@/lib/dailyLocalNotificationCleanup';
import { refreshAllTaskReminders } from '@/lib/localNotifications';

/**
 * Local Notification Scheduler
 *
 * - Clears legacy daily local notifications from old builds
 * - Refreshes all task reminders on mount + on app resume so:
 *     • monthly/weekend/custom recurring patterns keep their occurrence horizon full
 *     • reminders survive any cleanup or device reschedule
 *
 * Smart Action Nudges → useSmartActionNudges
 * Period reminders → usePeriodNotifications
 */
export function useLocalNotificationScheduler(userId: string | undefined) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    clearLegacyDailyLocalNotificationsOnce().catch(() => {});

    // Refresh on mount
    refreshAllTaskReminders(userId).catch(() => {});

    // Refresh on app resume so reminders re-hydrate after long backgrounding
    let removeListener: (() => void) | undefined;
    CapApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) refreshAllTaskReminders(userId).catch(() => {});
    }).then((handle) => {
      removeListener = () => handle.remove();
    }).catch(() => {});

    return () => { removeListener?.(); };
  }, [userId]);

  return { scheduleNotifications: async () => {} };
}
