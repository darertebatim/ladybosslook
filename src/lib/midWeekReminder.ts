import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

const STORAGE_KEY = 'simora_midweek_reminder_enabled';
const NOTIFICATION_ID = 990099; // unique fixed ID for mid-week reminder

/**
 * Schedule a local notification for next Wednesday at 10:00 AM local time.
 * If Wednesday has already passed this week, schedule for next week's Wednesday.
 */
export async function scheduleMidWeekReminder() {
  if (!Capacitor.isNativePlatform()) {
    localStorage.setItem(STORAGE_KEY, 'true');
    return;
  }

  localStorage.setItem(STORAGE_KEY, 'true');

  // Cancel any existing mid-week reminder first
  try {
    await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] });
  } catch {}

  const now = new Date();
  const wednesday = getNextWednesday(now);
  wednesday.setHours(10, 0, 0, 0);

  // If the calculated Wednesday is in the past (shouldn't happen but safety), push to next week
  if (wednesday.getTime() <= now.getTime()) {
    wednesday.setDate(wednesday.getDate() + 7);
  }

  await LocalNotifications.schedule({
    notifications: [{
      id: NOTIFICATION_ID,
      title: '🔔 Mid-week check-in',
      body: "How's your week going? Take a moment to reflect on your progress 💪",
      schedule: { at: wednesday },
      actionTypeId: 'midweek-checkin',
      extra: { url: '/app/home' },
    }],
  });

  console.log('[MidWeekReminder] ✅ Scheduled for', wednesday.toISOString());
}

export async function cancelMidWeekReminder() {
  localStorage.setItem(STORAGE_KEY, 'false');

  if (!Capacitor.isNativePlatform()) return;

  try {
    await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] });
    console.log('[MidWeekReminder] ❌ Cancelled');
  } catch {}
}

export function isMidWeekReminderEnabled(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

function getNextWednesday(from: Date): Date {
  const d = new Date(from);
  const day = d.getDay(); // 0=Sun, 3=Wed
  const daysUntilWed = (3 - day + 7) % 7 || 7; // always next Wednesday
  d.setDate(d.getDate() + daysUntilWed);
  return d;
}
