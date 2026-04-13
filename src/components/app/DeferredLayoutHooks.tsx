import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAppInstallTracking } from '@/hooks/useAppInstallTracking';
import { useAppsFlyerTracking } from '@/hooks/useAppsFlyerTracking';
import { useLocalNotificationScheduler } from '@/hooks/useLocalNotificationScheduler';
import { useHybridNotificationScheduler } from '@/hooks/useHybridNotificationScheduler';
import { useProgramEventNotificationScheduler } from '@/hooks/useProgramEventNotificationScheduler';
import { useSmartActionNudges } from '@/hooks/useSmartActionNudges';
import { usePeriodNotifications } from '@/hooks/usePeriodNotifications';

/**
 * Ensure local notification permission is granted on Android 13+.
 * Runs once at startup as a safety net (in case onboarding was skipped).
 */
function useEnsureLocalNotificationPermission() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    (async () => {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const status = await LocalNotifications.checkPermissions();
        if (status.display !== 'granted') {
          await LocalNotifications.requestPermissions();
          console.log('[LocalNotifications] Permission requested at startup');
        }
      } catch { /* ignore on web */ }
    })();
  }, []);
}

/**
 * Deferred hooks component - mounts after a delay to free the main thread.
 * Contains non-critical background hooks (install tracking, notification schedulers, etc.)
 */
export const DeferredLayoutHooks = ({ userId }: { userId: string | undefined }) => {
  useEnsureLocalNotificationPermission();
  useAppInstallTracking(userId);
  useAppsFlyerTracking(userId);
  useLocalNotificationScheduler(userId);
  useSmartActionNudges(userId);
  usePeriodNotifications(userId);
  useHybridNotificationScheduler(userId);
  useProgramEventNotificationScheduler();
  
  return null;
};
