/**
 * ⚠️ Legacy module name — kept for backward compatibility.
 *
 * Firebase Analytics has been removed. All events now route to AppsFlyer.
 * This file is a thin shim so the dozens of existing call sites keep working
 * unchanged. New code should import from `@/lib/appsflyer` directly.
 */
import { logAppsFlyerEvent, setAppsFlyerUserId } from './appsflyer';

// Backwards-compatible no-op init (AppsFlyer is initialized in main.tsx).
export async function initFirebaseAnalytics(): Promise<void> {
  // no-op
}

/**
 * Log a custom analytics event. Forwards to AppsFlyer.
 * AppsFlyer accepts arbitrary key/value JSON in eventValue.
 */
export async function logEvent(
  name: string,
  params: Record<string, string | number | boolean> = {}
): Promise<void> {
  await logAppsFlyerEvent(name, params);
}

/**
 * Link analytics events to a specific user (Supabase UUID).
 * Forwards to AppsFlyer customer user id.
 */
export async function setAnalyticsUserId(userId: string | null): Promise<void> {
  if (!userId) return;
  await setAppsFlyerUserId(userId);
}

/**
 * Sticky user properties — forwarded as a single AppsFlyer event so they
 * still surface in dashboards. AppsFlyer doesn't have a 1:1 "user property"
 * primitive like Firebase, so we emit `user_property_set` events instead.
 */
export async function setUserProperty(
  key: string,
  value: string | null
): Promise<void> {
  if (value == null) return;
  await logAppsFlyerEvent('user_property_set', { key, value });
}

/**
 * Screen view event — forwarded to AppsFlyer as a custom event.
 */
export async function logScreenView(screenName: string, screenClass?: string): Promise<void> {
  await logAppsFlyerEvent('screen_view', {
    screen_name: screenName,
    screen_class: screenClass || screenName,
  });
}

// ─────────────────────────────────────────────────────────────
// Pre-defined event helpers (forwarded to AppsFlyer)
// ─────────────────────────────────────────────────────────────

export const Analytics = {
  // 🎯 First Session / Activation
  appFirstOpen: () => logEvent('app_first_open'),
  appOpen: () => logEvent('app_open'),

  // Onboarding
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

  // Auth
  signupStarted: (method: string) =>
    logEvent('signup_started', { method }),
  signupCompleted: (method: string) =>
    logEvent('af_complete_registration', { af_registration_method: method }),
  loginCompleted: (method: string) =>
    logEvent('af_login', { method }),

  // Quiz
  quizStarted: (quizId: string) =>
    logEvent('quiz_started', { quiz_id: quizId }),
  quizCompleted: (quizId: string, resultKey?: string) =>
    logEvent('quiz_completed', {
      quiz_id: quizId,
      ...(resultKey ? { result_key: resultKey } : {}),
    }),

  // Self-Care Quiz specific (richer breakdown)
  selfcareQuizAnswer: (stepId: string, cluster: string, answer: string) =>
    logEvent('selfcare_quiz_answer', { step_id: stepId, cluster, answer }),
  selfcareQuizDiagnosisViewed: (topCluster: string) =>
    logEvent('selfcare_quiz_diagnosis_viewed', { top_cluster: topCluster }),
  selfcareQuizSuggestionsViewed: (count: number) =>
    logEvent('selfcare_quiz_suggestions_viewed', { suggestion_count: count }),
  selfcareQuizCommitment: (frequency: string) =>
    logEvent('selfcare_quiz_commitment', { frequency }),

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
    logEvent('af_start_trial', { product_id: productId }),
  subscriptionStarted: (productId: string, revenue: number, currency: string) =>
    logEvent('af_subscribe', {
      af_revenue: revenue,
      af_currency: currency,
      product_id: productId,
    }),
  subscriptionCancelled: (productId: string) =>
    logEvent('subscription_cancelled', { product_id: productId }),
};

// Sticky user property setters — forwarded as user_property_set events
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
