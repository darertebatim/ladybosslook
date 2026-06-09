/**
 * Region-based restrictions.
 * Currently used to gate support chat access for users whose device timezone
 * is set to Iran (Asia/Tehran). Detection uses the browser/device timezone
 * (Intl API) — not IP — so a VPN does not bypass or trigger this.
 */

/**
 * Timezones where support chat is blocked. Managed here (hardcoded) — the
 * Admin → System page surfaces the list for visibility.
 */
export const SUPPORT_CHAT_BLOCKED_TIMEZONES: readonly string[] = [
  "Asia/Tehran",
  "Asia/Kabul",
  "Asia/Baghdad",
] as const;

const BLOCKED_TZ_SET = new Set<string>(SUPPORT_CHAT_BLOCKED_TIMEZONES);

export function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
}

export function isIranTimezone(): boolean {
  // Kept for backwards-compat: now matches any blocked timezone.
  return BLOCKED_TZ_SET.has(getDeviceTimezone());
}

/** Convenience: whether support chat should be blocked for the current device. */
export function isSupportChatBlockedForRegion(): boolean {
  return BLOCKED_TZ_SET.has(getDeviceTimezone());
}