import { useEffect } from 'react';
import { setAppsFlyerUserId, AppsFlyerEvents } from '@/lib/appsflyer';

/**
 * Sets the AppsFlyer customer user ID when the user is authenticated.
 * Also logs a login event.
 */
export function useAppsFlyerTracking(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    setAppsFlyerUserId(userId);
    AppsFlyerEvents.login();
  }, [userId]);
}
