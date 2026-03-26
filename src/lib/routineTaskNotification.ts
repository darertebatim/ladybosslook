import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const ROUTINE_TASK_NOTIFICATION_ID = 888888;

/**
 * Schedule a local notification to fire when a routine task's timer ends.
 * Fires after `seconds` from now. Cancelled automatically when the user
 * completes/skips/pauses the task while still in the app.
 */
export async function scheduleTaskEndNotification(
  taskTitle: string,
  taskEmoji: string,
  seconds: number,
): Promise<void> {
  if (!Capacitor.isNativePlatform() || seconds <= 0) return;

  try {
    // Cancel any previous task-end notification first
    await cancelTaskEndNotification();

    const fireAt = new Date(Date.now() + seconds * 1000);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: ROUTINE_TASK_NOTIFICATION_ID,
          title: `${taskEmoji} ${taskTitle} — Time's up!`,
          body: 'Come back and check off your task ✅',
          schedule: { at: fireAt, allowWhileIdle: true },
          sound: 'default',
          extra: { isRoutineTaskEnd: true },
        },
      ],
    });

    console.log('[RoutineTaskPN] Scheduled end notification in', seconds, 's');
  } catch (e) {
    console.error('[RoutineTaskPN] Failed to schedule:', e);
  }
}

/**
 * Cancel the pending task-end notification (e.g. user completed/skipped/paused).
 */
export async function cancelTaskEndNotification(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await LocalNotifications.cancel({
      notifications: [{ id: ROUTINE_TASK_NOTIFICATION_ID }],
    });
  } catch {
    // ignore
  }
}
