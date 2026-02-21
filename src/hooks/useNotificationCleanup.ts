import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { cleanupStaleNotifications } from '@/lib/notificationCleanup';

/**
 * Runs comprehensive notification cleanup once on app launch.
 * Must run BEFORE individual schedulers to clear stale repeating notifications.
 */
export function useNotificationCleanup() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    // Run early, before other schedulers (which have 5-7s delays)
    cleanupStaleNotifications().catch(() => {});
  }, []);
}
