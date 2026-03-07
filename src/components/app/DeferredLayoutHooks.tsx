import { useAppInstallTracking } from '@/hooks/useAppInstallTracking';
import { useAppsFlyerTracking } from '@/hooks/useAppsFlyerTracking';
import { useLocalNotificationScheduler } from '@/hooks/useLocalNotificationScheduler';
import { useHybridNotificationScheduler } from '@/hooks/useHybridNotificationScheduler';
import { useProgramEventNotificationScheduler } from '@/hooks/useProgramEventNotificationScheduler';
import { useSmartActionNudges } from '@/hooks/useSmartActionNudges';
import { usePeriodNotifications } from '@/hooks/usePeriodNotifications';

/**
 * Deferred hooks component - mounts after a delay to free the main thread.
 * Contains non-critical background hooks (install tracking, notification schedulers, etc.)
 */
export const DeferredLayoutHooks = ({ userId }: { userId: string | undefined }) => {
  useAppInstallTracking(userId);
  useAppsFlyerTracking(userId);
  useLocalNotificationScheduler(userId);
  useSmartActionNudges(userId);
  usePeriodNotifications(userId);
  useHybridNotificationScheduler(userId);
  useProgramEventNotificationScheduler();
  
  return null;
};
