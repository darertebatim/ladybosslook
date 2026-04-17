import { useEffect } from 'react';
import { Analytics } from '@/lib/firebaseAnalytics';

/**
 * Fires `paywall_viewed` once when a paywall mounts, and provides
 * a helper to fire `paywall_dismissed` when the user closes it.
 *
 * Usage:
 *   const { trackDismiss } = usePaywallTracking('mascot_v2', 'onboarding');
 *   <CloseButton onClick={() => { trackDismiss(); onClose(); }} />
 */
export function usePaywallTracking(variantId: string, source?: string) {
  useEffect(() => {
    Analytics.paywallViewed(variantId, source);
  }, [variantId, source]);

  return {
    trackDismiss: () => Analytics.paywallDismissed(variantId),
  };
}
