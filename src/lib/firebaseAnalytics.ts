import { Capacitor } from '@capacitor/core';

/**
 * Firebase Analytics wrapper for iOS/Android.
 * No-op on web. Safe to call before init (events are dropped silently).
 *
 * Tracks user behavior, retention, activation, and monetization events.
 */

let isInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Initialize Firebase Analytics. Call once at app startup.
 * Native config comes from GoogleService-Info.plist (iOS) / google-services.json (Android).
 */
export async function initFirebaseAnalytics(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[FirebaseAnalytics] Skipping init on web platform');
    return;
  }

  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
      await FirebaseAnalytics.setEnabled({ enabled: true });
      isInitialized = true;
      console.log('[FirebaseAnalytics] ✅ Initialized');
    } catch (error) {
      console.warn('[FirebaseAnalytics] Init failed:', error);
    }
  })();

  return initPromise;
}

/**
 * Log a custom analytics event.
 * Event names should be snake_case, ≤40 chars. Param values: strings ≤100 chars or numbers.
 */
export async function logEvent(
  name: string,
  params: Record<string, string | number | boolean> = {}
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    if (!isInitialized) await initFirebaseAnalytics();
    if (!isInitialized) return;

    const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
    await FirebaseAnalytics.logEvent({ name, params });
  } catch (error) {
    console.warn('[FirebaseAnalytics] logEvent failed:', name, error);
  }
}

/**
 * Link analytics events to a specific user (Supabase UUID).
 * Call after sign-in / sign-up.
 */
export async function setAnalyticsUserId(userId: string | null): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    if (!isInitialized) await initFirebaseAnalytics();
    if (!isInitialized) return;

    const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
    await FirebaseAnalytics.setUserId({ userId });
  } catch (error) {
    console.warn('[FirebaseAnalytics] setUserId failed:', error);
  }
}

/**
 * Set a sticky user property (e.g. is_subscribed, language, age_group).
 * Property names must be ≤24 chars; values ≤36 chars.
 */
export async function setUserProperty(
  key: string,
  value: string | null
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    if (!isInitialized) await initFirebaseAnalytics();
    if (!isInitialized) return;

    const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
    await FirebaseAnalytics.setUserProperty({ key, value });
  } catch (error) {
    console.warn('[FirebaseAnalytics] setUserProperty failed:', key, error);
  }
}

/**
 * Log a screen view event (auto-fired on route change via useFirebaseScreenTracking).
 */
export async function logScreenView(screenName: string, screenClass?: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    if (!isInitialized) await initFirebaseAnalytics();
    if (!isInitialized) return;

    const { FirebaseAnalytics } = await import('@capacitor-firebase/analytics');
    await FirebaseAnalytics.logEvent({
      name: 'screen_view',
      params: {
        screen_name: screenName,
        screen_class: screenClass || screenName,
      },
    });
  } catch (error) {
    console.warn('[FirebaseAnalytics] logScreenView failed:', error);
  }
}

// ─────────────────────────────────────────────────────────────
// Pre-defined event helpers (typed, consistent naming)
// ─────────────────────────────────────────────────────────────

export const Analytics = {
  // 🎯 First Session / Activation
  appFirstOpen: () => logEvent('app_first_open'),
  appOpen: () => logEvent('app_open'),

  onboardingStarted: (flowId: string) =>
    logEvent('onboarding_started', { flow_id: flowId }),
  onboardingStepViewed: (flowId: string, stepId: string, stepIndex: number) =>
    logEvent('onboarding_step_viewed', {
      flow_id: flowId,
      step_id: stepId,
      step_index: stepIndex,
    }),
  onboardingAnswered: (flowId: string, stepId: string) =>
    logEvent('onboarding_answered', { flow_id: flowId, step_id: stepId }),
  onboardingCompleted: (flowId: string, totalSteps: number) =>
    logEvent('onboarding_completed', { flow_id: flowId, total_steps: totalSteps }),
  onboardingSkipped: (flowId: string, stepIndex: number) =>
    logEvent('onboarding_skipped', { flow_id: flowId, step_index: stepIndex }),

  signupStarted: (method: string) =>
    logEvent('signup_started', { method }),
  signupCompleted: (method: string) =>
    logEvent('sign_up', { method }), // GA4 standard event name
  loginCompleted: (method: string) =>
    logEvent('login', { method }), // GA4 standard event name

  quizStarted: (quizId: string) =>
    logEvent('quiz_started', { quiz_id: quizId }),
  quizCompleted: (quizId: string, resultKey?: string) =>
    logEvent('quiz_completed', {
      quiz_id: quizId,
      ...(resultKey ? { result_key: resultKey } : {}),
    }),

  // 🔁 Retention / Daily engagement
  routineStarted: (routineId: string) =>
    logEvent('routine_started', { routine_id: routineId }),
  routineCompleted: (routineId: string, durationSeconds: number) =>
    logEvent('routine_completed', {
      routine_id: routineId,
      duration_seconds: durationSeconds,
    }),

  taskCreated: (category?: string) =>
    logEvent('task_created', category ? { category } : {}),
  taskCompleted: (taskId: string) =>
    logEvent('task_completed', { task_id: taskId }),

  moodLogged: (mood: string) => logEvent('mood_logged', { mood }),
  waterLogged: (amount: number) => logEvent('water_logged', { amount }),
  periodLogged: (type: string) => logEvent('period_logged', { type }),

  meditationPlayed: (audioId: string) =>
    logEvent('meditation_played', { audio_id: audioId }),
  audioPlayed: (audioId: string, category?: string) =>
    logEvent('audio_played', {
      audio_id: audioId,
      ...(category ? { category } : {}),
    }),

  streakMilestone: (days: number) =>
    logEvent('streak_milestone', { days }),

  notificationOpened: (type: string) =>
    logEvent('notification_opened', { type }),

  // 💰 Monetization
  paywallViewed: (variantId: string, source?: string) =>
    logEvent('paywall_viewed', {
      variant_id: variantId,
      ...(source ? { source } : {}),
    }),
  paywallDismissed: (variantId: string) =>
    logEvent('paywall_dismissed', { variant_id: variantId }),

  trialStarted: (productId: string) =>
    logEvent('trial_started', { product_id: productId }),
  subscriptionStarted: (productId: string, revenue: number, currency: string) =>
    logEvent('purchase', {
      // GA4 standard purchase event
      transaction_id: `${productId}_${Date.now()}`,
      value: revenue,
      currency,
      items_product_id: productId,
    }),
  subscriptionCancelled: (productId: string) =>
    logEvent('subscription_cancelled', { product_id: productId }),
};

// Sticky user property setters
export const UserProperties = {
  setSubscribed: (isSubscribed: boolean) =>
    setUserProperty('is_subscribed', isSubscribed ? 'true' : 'false'),
  setSubscriptionPlan: (plan: string | null) =>
    setUserProperty('subscription_plan', plan),
  setNickname: (nickname: string | null) =>
    setUserProperty('nickname', nickname),
  setGender: (gender: string | null) => setUserProperty('gender', gender),
  setAgeGroup: (ageGroup: string | null) =>
    setUserProperty('age_group', ageGroup),
  setLanguage: (language: string | null) =>
    setUserProperty('language', language),
  setSignupDate: (isoDate: string | null) =>
    setUserProperty('signup_date', isoDate),
  setAppVersion: (version: string | null) =>
    setUserProperty('app_version', version),
  setStreakDays: (days: number) =>
    setUserProperty('streak_days', String(days)),
};
