import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { clearLegacyDailyLocalNotificationsOnce } from '@/lib/dailyLocalNotificationCleanup';

/**
 * Legacy Local Notification Scheduler
 * 
 * This hook now only handles cleanup of old daily local notifications.
 * Smart Action Nudges are handled by useSmartActionNudges.
 * Period reminders are handled by usePeriodNotifications.
 * 
 * Kept for backward compatibility with NotificationPreferencesCard import.
 */
export function useLocalNotificationScheduler(userId: string | undefined) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Clear legacy daily local notifications from old builds
    clearLegacyDailyLocalNotificationsOnce().catch(() => {});
  }, [userId]);

  return { scheduleNotifications: async () => {} };
}
