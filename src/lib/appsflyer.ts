import { Capacitor } from '@capacitor/core';

/**
 * AppsFlyer SDK initialization and event tracking.
 * Only runs on native platforms (iOS/Android).
 */

const APPSFLYER_DEV_KEY = 'HmUqSP98nbh7uNctZxS48M';
const APPLE_APP_ID = '6755076134';

/**
 * OneLink configuration for instructor referral links.
 * Generate URLs like: https://ladyboss.onelink.me/lt6v?af_sub1=<instructorSlug>&deep_link_value=<instructorSlug>
 */
export const ONELINK_TEMPLATE_ID = 'lt6v';
export const ONELINK_SUBDOMAIN = 'ladyboss.onelink.me';
export const ONELINK_BASE_URL = `https://${ONELINK_SUBDOMAIN}/${ONELINK_TEMPLATE_ID}`;

/**
 * Build a OneLink URL for a specific instructor.
 * The follower clicks this → goes to the App Store → on first launch, AppsFlyer
 * surfaces the `af_sub1` value so we can auto-enroll them in the instructor's setup.
 */
export function buildInstructorOneLink(instructorSlug: string): string {
  const params = new URLSearchParams({
    af_sub1: instructorSlug,
    deep_link_value: instructorSlug,
    af_xp: 'custom',
    pid: 'instructor_referral',
    c: instructorSlug,
  });
  return `${ONELINK_BASE_URL}?${params.toString()}`;
}

const ATTRIBUTION_STORAGE_KEY = 'rilo_appsflyer_attribution';
const ATTRIBUTION_PROCESSED_KEY = 'rilo_appsflyer_attribution_processed';

/**
 * Custom event fired in-page whenever AppsFlyer captures a new instructor slug
 * (via UDL or conversion callback). Lets React hooks react immediately to a
 * deep link tap that arrives AFTER initial mount.
 */
export const APPSFLYER_ATTRIBUTION_EVENT = 'appsflyer:attribution-captured';

function dispatchAttributionEvent(slug: string) {
  try {
    window.dispatchEvent(new CustomEvent(APPSFLYER_ATTRIBUTION_EVENT, { detail: { slug } }));
  } catch {/* ignore */}
}

export interface AppsFlyerAttribution {
  instructorSlug?: string;
  raw: Record<string, unknown>;
  capturedAt: string;
}

/**
 * Read previously captured attribution (set by the conversion data listener).
 */
export function getStoredAttribution(): AppsFlyerAttribution | null {
  try {
    const raw = localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppsFlyerAttribution) : null;
  } catch {
    return null;
  }
}

export function markAttributionProcessed(): void {
  try {
    localStorage.setItem(ATTRIBUTION_PROCESSED_KEY, '1');
  } catch {/* ignore */}
}

export function isAttributionProcessed(): boolean {
  try {
    return localStorage.getItem(ATTRIBUTION_PROCESSED_KEY) === '1';
  } catch {
    return false;
  }
}

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

    // CRITICAL: Register listeners BEFORE startSDK so the very first
    // deep link / conversion event isn't missed.
    try {
      const { AFConstants } = await import('appsflyer-capacitor-plugin');

      AppsFlyer.addListener(AFConstants.CONVERSION_CALLBACK, (event: any) => {
        console.log('[AppsFlyer] 🔔 Conversion callback fired:', JSON.stringify(event));
        try {
          const data = event?.data || {};
          const instructorSlug =
            (data?.af_sub1 as string | undefined) ||
            (data?.deep_link_value as string | undefined) ||
            (data?.c as string | undefined);
          const payload: AppsFlyerAttribution = {
            instructorSlug: instructorSlug ? String(instructorSlug).trim().toLowerCase() : undefined,
            raw: data as Record<string, unknown>,
            capturedAt: new Date().toISOString(),
          };
          localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(payload));
          console.log('[AppsFlyer] ✅ Conversion data captured. Slug:', payload.instructorSlug ?? '(none)');
          if (payload.instructorSlug) dispatchAttributionEvent(payload.instructorSlug);
        } catch (err) {
          console.warn('[AppsFlyer] Conversion data parse failed:', err);
        }
      });

      AppsFlyer.addListener(AFConstants.UDL_CALLBACK, (event: any) => {
        console.log('[AppsFlyer] 🔗 UDL callback fired:', JSON.stringify(event));
        try {
          const data = event?.deepLink || event?.data || event || {};
          const instructorSlug =
            (data?.deep_link_value as string | undefined) ||
            (data?.af_sub1 as string | undefined) ||
            (data?.c as string | undefined);
          if (instructorSlug) {
            const payload: AppsFlyerAttribution = {
              instructorSlug: String(instructorSlug).trim().toLowerCase(),
              raw: data as Record<string, unknown>,
              capturedAt: new Date().toISOString(),
            };
            // Also clear the "processed" flag so the modal can re-trigger for a new instructor on re-engagement
            try { localStorage.removeItem(ATTRIBUTION_PROCESSED_KEY); } catch {/* ignore */}
            localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(payload));
            console.log('[AppsFlyer] ✅ Deep link captured. Slug:', payload.instructorSlug);
            dispatchAttributionEvent(payload.instructorSlug);
          } else {
            console.log('[AppsFlyer] UDL fired but no instructor slug found in payload');
          }
        } catch (err) {
          console.warn('[AppsFlyer] Deep link parse failed:', err);
        }
      });

      console.log('[AppsFlyer] Listeners registered (pre-start)');
    } catch (err) {
      console.warn('[AppsFlyer] Failed to register conversion listener:', err);
    }

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
      eventValue: eventValues,
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
