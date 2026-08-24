import { Capacitor } from '@capacitor/core';

/** Production web origin — must match the universal-link domain. */
export const PROD_ORIGIN = 'https://ladybosslook.com';

/**
 * Base origin to use for Supabase auth email redirects.
 *
 * - Native (iOS/Android): always the production https origin so the universal
 *   link opens the app instead of a random preview host.
 * - Web: the current origin, so preview / localhost / production all work.
 */
export function getAuthRedirectOrigin(): string {
  if (Capacitor.isNativePlatform()) return PROD_ORIGIN;
  if (typeof window === 'undefined') return PROD_ORIGIN;
  return window.location.origin;
}

/** Full URL the password-recovery email should point to. */
export function getPasswordResetRedirectUrl(): string {
  return `${getAuthRedirectOrigin()}/reset-password`;
}
