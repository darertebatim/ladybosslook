import { useEffect } from 'react';
import { setAnalyticsUserId, UserProperties } from '@/lib/firebaseAnalytics';
import { useSubscription } from '@/hooks/useSubscription';
import { BUILD_INFO } from '@/lib/buildInfo';

/**
 * Syncs current user identity + sticky properties to Firebase Analytics.
 * Mounts inside DeferredLayoutHooks so it runs after the app has settled.
 */
export function useFirebaseUserSync(userId: string | undefined) {
  const { isSubscribed, subscriptions } = useSubscription();

  // Set / clear user ID
  useEffect(() => {
    setAnalyticsUserId(userId ?? null);
  }, [userId]);

  // Subscription status
  useEffect(() => {
    if (!userId) return;
    UserProperties.setSubscribed(isSubscribed);
    const plan = subscriptions[0]?.product_id ?? (isSubscribed ? 'simora_plus' : null);
    UserProperties.setSubscriptionPlan(plan);
  }, [userId, isSubscribed, subscriptions]);

  // Sticky onboarding-derived properties (saved to localStorage during onboarding)
  useEffect(() => {
    if (!userId) return;
    try {
      const nickname = localStorage.getItem('simora_onboarding_nickname');
      const gender = localStorage.getItem('simora_onboarding_gender');
      const ageGroup = localStorage.getItem('simora_onboarding_age_group');
      const language = localStorage.getItem('simora_onboarding_language');
      if (nickname) UserProperties.setNickname(nickname);
      if (gender) UserProperties.setGender(gender);
      if (ageGroup) UserProperties.setAgeGroup(ageGroup);
      if (language) UserProperties.setLanguage(language);
    } catch {
      /* ignore */
    }
    UserProperties.setAppVersion(BUILD_INFO.version);
  }, [userId]);
}
