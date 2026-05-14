import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * Comprehensive Local Notification Cleanup
 * 
 * On every app launch, gets ALL pending local notifications and cancels
 * any that don't belong to the current active schedulers.
 * 
 * Active ID ranges:
 * - 200001-200010: Smart Action Nudges (action reminders)
 * - 200011-200020: ProAction Nudges
 * - 200021-200030: Water Reminders
 * - 200031-200040: Period Reminders
 * - 300000-399999: Program Event Notifications (sessions, drip)
 * - 900000-999999: Urgent task alarms (taskAlarm.ts)
 * - All other positive ints: per-task local reminders (localNotifications.ts hashTaskId,
 *   unbounded — only legacy IDs in 100001-100010 are explicitly cancelled)
 * 
 * Legacy IDs (100001-100010) should ALWAYS be cancelled.
 */

// All valid ID ranges that current schedulers use
const VALID_RANGES = [
  { start: 200001, end: 200040 },   // Smart nudges + period
  { start: 300000, end: 399999 },   // Program events
  { start: 900000, end: 999999 },   // Urgent task alarms
];

// Legacy IDs that should ALWAYS be removed
const LEGACY_RANGE = { start: 100001, end: 100010 };

function isValidId(id: number): boolean {
  // Hashed per-task reminder IDs from localNotifications.ts are unbounded
  // positive ints. Treat anything >= 1_000_000 outside the legacy/special
  // ranges as a valid hashed task-reminder ID (do not cancel).
  if (id >= 1_000_000) return true;
  return VALID_RANGES.some(r => id >= r.start && id <= r.end);
}

let didRun = false;

/**
 * Cancel ALL legacy notifications and log pending count.
 * Called once per app launch before individual schedulers run.
 */
export async function cleanupStaleNotifications(): Promise<{
  pending: number;
  cancelled: number;
}> {
  if (!Capacitor.isNativePlatform()) return { pending: 0, cancelled: 0 };
  if (didRun) return { pending: 0, cancelled: 0 };
  didRun = true;

  try {
    const { notifications } = await LocalNotifications.getPending();
    const pendingCount = notifications.length;

    // Cancel legacy IDs unconditionally
    const legacyIds = notifications
      .filter(n => n.id >= LEGACY_RANGE.start && n.id <= LEGACY_RANGE.end)
      .map(n => ({ id: n.id }));

    // Also cancel any unknown IDs (not in any valid range)
    const unknownIds = notifications
      .filter(n => !isValidId(n.id) && !(n.id >= LEGACY_RANGE.start && n.id <= LEGACY_RANGE.end))
      .map(n => ({ id: n.id }));

    const toCancel = [...legacyIds, ...unknownIds];

    if (toCancel.length > 0) {
      await LocalNotifications.cancel({ notifications: toCancel });
      console.log(`[NotifCleanup] 🧹 Cancelled ${toCancel.length} stale notifications (${legacyIds.length} legacy, ${unknownIds.length} unknown) out of ${pendingCount} pending`);
    } else {
      console.log(`[NotifCleanup] ✅ ${pendingCount} pending notifications, all valid`);
    }

    return { pending: pendingCount, cancelled: toCancel.length };
  } catch (err) {
    console.error('[NotifCleanup] Error:', err);
    return { pending: 0, cancelled: 0 };
  }
}
