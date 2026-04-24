import { useState, useEffect, useCallback } from 'react';
import { checkPermissionStatus } from '@/lib/pushNotifications';
import { shouldShowPushUI } from './usePushNotificationFlow';

/**
 * Reactive push-permission state.
 * Returns `granted` | `denied` | `default` | `unsupported` | null (loading).
 * Re-checks when the tab becomes visible and when other flows fire `pushNotificationsEnabled`.
 */
export function usePushPermission() {
  const [permission, setPermission] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!shouldShowPushUI()) {
      setPermission('unsupported');
      return;
    }
    try {
      const p = await checkPermissionStatus();
      setPermission(p || 'default');
    } catch {
      setPermission('default');
    }
  }, []);

  useEffect(() => {
    refresh();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    const onEnabled = () => setPermission('granted');

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pushNotificationsEnabled', onEnabled);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pushNotificationsEnabled', onEnabled);
    };
  }, [refresh]);

  const isGranted = permission === 'granted';
  const needsAttention = shouldShowPushUI() && permission !== null && permission !== 'granted' && permission !== 'unsupported';

  return { permission, isGranted, needsAttention, refresh };
}