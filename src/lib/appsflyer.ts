import { Capacitor } from '@capacitor/core';

/**
 * AppsFlyer SDK initialization and event tracking.
 * Only runs on native platforms (iOS/Android).
 */

const APPSFLYER_DEV_KEY = 'HmUqSP98nbh7uNctZxS48M';
const APPLE_APP_ID = ''; // TODO: Set your Apple App Store ID once published (e.g. "123456789")

let isInitialized = false;

/**
 * Initialize AppsFlyer SDK on native platforms.
 * Call once at app startup.
 */
export async function initAppsFlyer(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[AppsFlyer] Skipping init on web platform');
    return;
  }

  if (isInitialized) {
    console.log('[AppsFlyer] Already initialized');
    return;
  }

  try {
    const { AppsFlyer } = await import('appsflyer-capacitor-plugin');

    await AppsFlyer.initSDK({
      devKey: APPSFLYER_DEV_KEY,
      isDebug: false,
      appID: APPLE_APP_ID, // Required for iOS
      registerOnDeepLink: true,
      registerConversionListener: true,
      waitForATTUserAuthorization: 10, // Wait up to 10s for ATT prompt on iOS
    });

    await AppsFlyer.startSDK();

    isInitialized = true;
    console.log('[AppsFlyer] ✅ SDK initialized successfully');
  } catch (error) {
    console.warn('[AppsFlyer] SDK init failed:', error);
  }
}

/**
 * Log a custom in-app event to AppsFlyer.
 */
export async function logAppsFlyerEvent(
  eventName: string,
  eventValues: Record<string, unknown> = {}
): Promise<void> {
  if (!Capacitor.isNativePlatform() || !isInitialized) return;

  try {
    const { AppsFlyer } = await import('appsflyer-capacitor-plugin');
    await AppsFlyer.logEvent({
      eventName,
      eventValues,
    });
    console.log('[AppsFlyer] Event logged:', eventName);
  } catch (error) {
    console.warn('[AppsFlyer] Failed to log event:', eventName, error);
  }
}

/**
 * Set the AppsFlyer customer user ID (your internal user ID).
 * Call after user logs in.
 */
export async function setAppsFlyerUserId(userId: string): Promise<void> {
  if (!Capacitor.isNativePlatform() || !isInitialized) return;

  try {
    const { AppsFlyer } = await import('appsflyer-capacitor-plugin');
    await AppsFlyer.setCustomerUserId({ cuid: userId });
    console.log('[AppsFlyer] Customer user ID set');
  } catch (error) {
    console.warn('[AppsFlyer] Failed to set user ID:', error);
  }
}

// Pre-defined event helpers
export const AppsFlyerEvents = {
  purchase: (revenue: number, currency: string, productId: string) =>
    logAppsFlyerEvent('af_purchase', {
      af_revenue: revenue,
      af_currency: currency,
      af_content_id: productId,
    }),

  signup: (method: string) =>
    logAppsFlyerEvent('af_complete_registration', {
      af_registration_method: method,
    }),

  subscribe: (revenue: number, currency: string) =>
    logAppsFlyerEvent('af_subscribe', {
      af_revenue: revenue,
      af_currency: currency,
    }),

  startTrial: () =>
    logAppsFlyerEvent('af_start_trial', {}),

  courseEnroll: (courseId: string, courseName: string) =>
    logAppsFlyerEvent('af_content_view', {
      af_content_id: courseId,
      af_content: courseName,
      af_content_type: 'course_enrollment',
    }),

  login: () =>
    logAppsFlyerEvent('af_login', {}),
};
