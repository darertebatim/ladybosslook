import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAppInstallTracking } from '@/hooks/useAppInstallTracking';
import { useAppsFlyerTracking } from '@/hooks/useAppsFlyerTracking';
import { useLocalNotificationScheduler } from '@/hooks/useLocalNotificationScheduler';
import { useHybridNotificationScheduler } from '@/hooks/useHybridNotificationScheduler';
import { useProgramEventNotificationScheduler } from '@/hooks/useProgramEventNotificationScheduler';
import { useSmartActionNudges } from '@/hooks/useSmartActionNudges';
import { usePeriodNotifications } from '@/hooks/usePeriodNotifications';
import { useFirebaseUserSync } from '@/hooks/useFirebaseUserSync';
import { useOfflinePrefetch } from '@/hooks/useOfflinePrefetch';
import { InstructorWelcomeSheet } from '@/components/instructor/InstructorWelcomeSheet';
import { InstructorInviteModal } from '@/components/instructor/InstructorInviteModal';

/**
 * Ensure local notification permission is granted on Android 13+.
 * Runs once at startup as a safety net (in case onboarding was skipped).
 * Also creates a high-importance Android notification channel for task
 * reminders so OEMs (Xiaomi/Huawei/Samsung) don't suppress them and so
 * users get a heads-up popup with sound.
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

        // Android only: create the high-importance channel used by task reminders.
        // No-op on iOS. Safe to call on every launch — Android dedupes by id.
        if (Capacitor.getPlatform() === 'android') {
          try {
            const exactSetting = await LocalNotifications.checkExactNotificationSetting();
            if (exactSetting.exact_alarm !== 'granted') {
              console.warn('[LocalNotifications] Android exact alarm permission is not granted');
            }

            await LocalNotifications.createChannel({
              id: 'task-reminders',
              name: 'Task Reminders',
              description: 'Reminders for your scheduled tasks and routines',
              importance: 5, // HIGH = heads-up popup + sound
              visibility: 1, // PUBLIC = show on lock screen
              sound: 'default',
              vibration: true,
              lights: true,
            });
            console.log('[LocalNotifications] Android channel "task-reminders" ready');
          } catch (err) {
            console.warn('[LocalNotifications] Failed to create Android channel:', err);
          }
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
  useFirebaseUserSync(userId);
  useOfflinePrefetch(userId);
  useLocalNotificationScheduler(userId);
  useSmartActionNudges(userId);
  usePeriodNotifications(userId);
  useHybridNotificationScheduler(userId);
  useProgramEventNotificationScheduler();

  return (
    <>
      <InstructorInviteModal />
      <InstructorWelcomeSheet />
    </>
  );
};
