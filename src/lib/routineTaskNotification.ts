import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const ROUTINE_TASK_NOTIFICATION_ID = 888888;
const FOCUS_TIMER_NOTIFICATION_ID = 888889;

/**
 * Schedule a local notification to fire when a routine task's timer ends.
 * Fires after `seconds` from now. Cancelled automatically when the user
 * completes/skips/pauses the task while still in the app.
 */
export async function scheduleTaskEndNotification(
  taskTitle: string,
  taskEmoji: string,
  seconds: number,
  notificationId: number = ROUTINE_TASK_NOTIFICATION_ID,
): Promise<void> {
  if (!Capacitor.isNativePlatform() || seconds <= 0) return;

  try {
    // Cancel any previous notification with this ID first
    await cancelTaskEndNotification(notificationId);

    const fireAt = new Date(Date.now() + seconds * 1000);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: notificationId,
          title: `${taskEmoji} ${taskTitle} — Time's up!`,
          body: 'Come back and check off your task ✅',
          schedule: { at: fireAt, allowWhileIdle: true },
          sound: 'default',
          extra: { isRoutineTaskEnd: true },
        },
      ],
    });

    console.log('[TaskPN] Scheduled end notification in', seconds, 's, id:', notificationId);
  } catch (e) {
    console.error('[TaskPN] Failed to schedule:', e);
  }
}

/**
 * Cancel the pending task-end notification (e.g. user completed/skipped/paused).
 */
export async function cancelTaskEndNotification(
  notificationId: number = ROUTINE_TASK_NOTIFICATION_ID,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await LocalNotifications.cancel({
      notifications: [{ id: notificationId }],
    });
  } catch {
    // ignore
  }
}

/**
 * Schedule a focus timer end notification (uses separate ID from routine tasks).
 */
export async function scheduleFocusTimerNotification(
  label: string,
  emoji: string,
  seconds: number,
): Promise<void> {
  return scheduleTaskEndNotification(label, emoji, seconds, FOCUS_TIMER_NOTIFICATION_ID);
}

/**
 * Cancel focus timer notification.
 */
export async function cancelFocusTimerNotification(): Promise<void> {
  return cancelTaskEndNotification(FOCUS_TIMER_NOTIFICATION_ID);
}
