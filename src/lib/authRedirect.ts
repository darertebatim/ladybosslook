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

/**
 * Sanitize a "come back here after sign-in" path.
 * Only same-origin absolute paths are allowed (no protocol-relative or
 * external URLs), and empty values fall back to null.
 */
export function sanitizeRedirectPath(path: string | null | undefined): string | null {
  if (!path) return null;
  if (!path.startsWith('/') || path.startsWith('//')) return null;
  if (path.startsWith('/auth')) return null;
  return path;
}

/** Current location (path + query + hash) as a redirect target. */
export function currentPathForRedirect(): string {
  if (typeof window === 'undefined') return '/';
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

/** Build an /auth URL that returns the user to `path` after signing in. */
export function authUrlFor(path?: string | null, mode?: 'login' | 'signup'): string {
  const target = sanitizeRedirectPath(path ?? currentPathForRedirect()) || '/';
  const params = new URLSearchParams();
  params.set('redirect', target);
  if (mode) params.set('mode', mode);
  return `/auth?${params.toString()}`;
}
