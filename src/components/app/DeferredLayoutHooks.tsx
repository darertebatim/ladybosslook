import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAppInstallTracking } from '@/hooks/useAppInstallTracking';
import { useAppsFlyerTracking } from '@/hooks/useAppsFlyerTracking';
import { useLocalNotificationScheduler } from '@/hooks/useLocalNotificationScheduler';
import { useProgramEventNotificationScheduler } from '@/hooks/useProgramEventNotificationScheduler';
import { useSmartActionNudges } from '@/hooks/useSmartActionNudges';
import { usePeriodNotifications } from '@/hooks/usePeriodNotifications';
import { useWaterNotifications } from '@/hooks/useWaterNotifications';
import { useProteinNotifications } from '@/hooks/useProteinNotifications';
import { useFastingNotifications } from '@/hooks/useFastingNotifications';
import { useFirebaseUserSync } from '@/hooks/useFirebaseUserSync';
import { useOfflinePrefetch } from '@/hooks/useOfflinePrefetch';
import { InstructorWelcomeSheet } from '@/components/instructor/InstructorWelcomeSheet';
import { InstructorInviteModal } from '@/components/instructor/InstructorInviteModal';

/**
 * Set up the Android notification channel for task reminders so OEMs
 * (Xiaomi/Huawei/Samsung) don't suppress them and so users get a heads-up
 * popup with sound.
 *
 * IMPORTANT: We intentionally do NOT call `requestPermissions()` at startup.
 * On iOS, local-notification and push-notification permission is shared, so
 * calling it here would auto-fire the iOS system permission dialog before
 * the user taps our in-app banner — that was a real bug. Permission is now
 * requested only on explicit user action (push onboarding, settings toggle,
 * or the first time we actually need to schedule a notification).
 */
function useEnsureLocalNotificationChannel() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (Capacitor.getPlatform() !== 'android') return;

    (async () => {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');

        try {
          const exactSetting = await LocalNotifications.checkExactNotificationSetting();
          if (exactSetting.exact_alarm !== 'granted') {
            console.warn('[LocalNotifications] Android exact alarm permission is not granted');
          }
        } catch { /* checkExactNotificationSetting unsupported on older Android */ }

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
      } catch { /* ignore on web */ }
    })();
  }, []);
}

/**
 * Deferred hooks component - mounts after a delay to free the main thread.
 * Contains non-critical background hooks (install tracking, notification schedulers, etc.)
 */
export const DeferredLayoutHooks = ({ userId }: { userId: string | undefined }) => {
  useEnsureLocalNotificationChannel();
  useAppInstallTracking(userId);
  useAppsFlyerTracking(userId);
  useFirebaseUserSync(userId);
  useOfflinePrefetch(userId);
  useLocalNotificationScheduler(userId);
  useSmartActionNudges(userId);
  usePeriodNotifications(userId);
  useWaterNotifications(userId);
  useProteinNotifications(userId);
  useFastingNotifications(userId);
  useProgramEventNotificationScheduler();

  return (
    <>
      <InstructorInviteModal />
      <InstructorWelcomeSheet />
    </>
  );
};
