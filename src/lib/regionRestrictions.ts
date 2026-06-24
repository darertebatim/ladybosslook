/**
 * Region-based restrictions.
 * Currently used to gate support chat access for users whose device timezone
 * is set to Iran (Asia/Tehran). Detection uses the browser/device timezone
 * (Intl API) — not IP — so a VPN does not bypass or trigger this.
 */

const IRAN_TIMEZONES = new Set<string>([
  "Asia/Tehran",
]);

const RILOBIZ_HIDDEN_TIMEZONES = new Set<string>([
  "Asia/Tehran",
  "Asia/Kabul",
  "Asia/Baghdad",
]);

export function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
}

export function isIranTimezone(): boolean {
  return IRAN_TIMEZONES.has(getDeviceTimezone());
}

/** Whether the current device timezone should hide the RiloBiz button. */
export function isRiloBizHiddenRegion(): boolean {
  return RILOBIZ_HIDDEN_TIMEZONES.has(getDeviceTimezone());
}

/** Convenience: whether support chat should be blocked for the current device. */
export function isSupportChatBlockedForRegion(): boolean {
  return isIranTimezone();
}