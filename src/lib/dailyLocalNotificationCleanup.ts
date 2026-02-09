import { Capacitor } from '@capacitor/core';
import { LocalNotifications, type LocalNotificationSchema } from '@capacitor/local-notifications';

// Legacy daily notifications were previously scheduled locally.
// We now send them server-side, but some devices may still have repeating
// local schedules saved under older IDs. This helper removes only the legacy
// DAILY schedules (and avoids touching task reminders / urgent alarms).

const DAILY_TYPES = new Set(['morning_summary', 'evening_checkin', 'time_period', 'goal_nudge']);

// Current reserved IDs used by the legacy local daily scheduler.
// (If older builds used different IDs, we still catch them via extra.type.)
const RESERVED_DAILY_IDS = new Set<number>([
  100001, 100002, 100003, 100004, 100005, 100006, 100007, 100008, 100009, 100010,
]);

let didCleanup = false;

function shouldCancel(notification: LocalNotificationSchema): boolean {
  const id = typeof notification.id === 'number' ? notification.id : NaN;
  const type = String((notification as any)?.extra?.type ?? '');

  if (RESERVED_DAILY_IDS.has(id)) return true;
  if (id >= 100001 && id <= 100010) return true;
  if (DAILY_TYPES.has(type)) return true;

  return false;
}

export async function clearLegacyDailyLocalNotificationsOnce(): Promise<{
  ran: boolean;
  pending: number;
  cleared: number;
}> {
  if (!Capacitor.isNativePlatform()) {
    return { ran: false, pending: 0, cleared: 0 };
  }

  if (didCleanup) {
    return { ran: false, pending: 0, cleared: 0 };
  }
  didCleanup = true;

  const pending = await LocalNotifications.getPending();
  const pendingCount = pending.notifications?.length ?? 0;

  const toCancel = (pending.notifications ?? []).filter(shouldCancel);

  if (toCancel.length > 0) {
    await LocalNotifications.cancel({
      notifications: toCancel.map((n) => ({ id: n.id })),
    });
  }

  return {
    ran: true,
    pending: pendingCount,
    cleared: toCancel.length,
  };
}
