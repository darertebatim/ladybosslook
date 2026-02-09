import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { logLocalNotificationEvent } from './localNotificationLogger';
import type { PNConfig } from '@/hooks/usePNConfig';
import type { Json } from '@/integrations/supabase/types';

/**
 * Hybrid Local Notification Scheduler
 * 
 * Uses LOCAL notifications for reliable delivery but with SERVER-CONTROLLED config.
 * This allows admin to update message content, timing, and enabled state
 * without requiring an app update.
 * 
 * Flow:
 * 1. App fetches pn_config from server on launch
 * 2. App subscribes to realtime changes
 * 3. On config change, reschedule all local notifications
 */

// Fixed notification ID base for daily notifications (to avoid collision with task reminders)
const DAILY_PN_BASE_ID = 200000;

// Map notification_key to a stable numeric ID
function getNotificationId(key: string): number {
  // Simple hash to convert key to number
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash |= 0;
  }
  return DAILY_PN_BASE_ID + Math.abs(hash % 10000);
}

interface UserPreferences {
  wake_time: string;
  sleep_time: string;
  morning_summary: boolean;
  evening_checkin: boolean;
  time_period_reminders: boolean;
  goal_nudges: boolean;
}

// Parse time string to hours and minutes
function parseTime(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute };
}

// Check if notification time is within user's active hours
function isWithinActiveHours(hour: number, wakeTime: string, sleepTime: string): boolean {
  const wake = parseTime(wakeTime);
  const sleep = parseTime(sleepTime);
  
  // Handle midnight crossing
  if (sleep.hour < wake.hour) {
    return hour >= wake.hour || hour < sleep.hour;
  }
  
  return hour >= wake.hour && hour < sleep.hour;
}

// Check if user has enabled this notification type based on category
function isUserEnabled(config: PNConfig, prefs: UserPreferences): boolean {
  switch (config.category) {
    case 'daily':
      if (config.notification_key === 'morning_summary') return prefs.morning_summary;
      if (config.notification_key === 'evening_checkin') return prefs.evening_checkin;
      return true;
    case 'time_period':
      return prefs.time_period_reminders;
    case 'goal_nudge':
      return prefs.goal_nudges;
    default:
      return true; // Other categories always enabled if server says so
  }
}

/**
 * Schedule all daily local notifications based on server config
 */
export async function scheduleHybridNotifications(
  configs: PNConfig[],
  userPrefs: UserPreferences
): Promise<{ scheduled: number; skipped: number }> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[HybridPN] Not on native platform, skipping');
    return { scheduled: 0, skipped: 0 };
  }

  const { wake_time, sleep_time } = userPrefs;
  let scheduled = 0;
  let skipped = 0;

  // Get all notification IDs we'll be managing
  const managedIds = configs.map(c => getNotificationId(c.notification_key));

  // Cancel all existing daily notifications first
  try {
    await LocalNotifications.cancel({
      notifications: managedIds.map(id => ({ id })),
    });
    console.log('[HybridPN] Cancelled', managedIds.length, 'existing notifications');
  } catch (err) {
    console.error('[HybridPN] Error cancelling notifications:', err);
  }

  // Schedule enabled notifications
  const toSchedule: Array<{
    id: number;
    title: string;
    body: string;
    schedule: any;
    sound: string;
    extra: any;
  }> = [];

  for (const config of configs) {
    // Skip if disabled on server
    if (!config.is_enabled) {
      skipped++;
      continue;
    }

    // Skip if user has disabled this type
    if (!isUserEnabled(config, userPrefs)) {
      skipped++;
      continue;
    }

    // Skip if outside user's active hours
    if (!isWithinActiveHours(config.schedule_hour, wake_time, sleep_time)) {
      skipped++;
      continue;
    }

    const notificationId = getNotificationId(config.notification_key);

    // Build schedule
    const schedule: any = {
      on: {
        hour: config.schedule_hour,
        minute: config.schedule_minute,
      },
      repeats: true,
    };

    // If specific days configured, add weekday constraint (iOS only supports one day)
    // For multi-day support, we'd need multiple notifications
    if (config.repeat_days && config.repeat_days.length === 1) {
      schedule.on.weekday = config.repeat_days[0] + 1; // iOS uses 1-7
    }

    toSchedule.push({
      id: notificationId,
      title: `${config.emoji} ${config.title}`,
      body: config.body,
      schedule,
      sound: config.sound || 'default',
      extra: {
        type: config.notification_key,
        category: config.category,
        url: '/app/home',
        isUrgent: config.is_urgent,
      },
    });

    scheduled++;
  }

  // Schedule all at once
  if (toSchedule.length > 0) {
    try {
      await LocalNotifications.schedule({
        notifications: toSchedule,
      });
      console.log('[HybridPN] ✅ Scheduled', toSchedule.length, 'notifications');

      // Log each scheduled notification
      for (const n of toSchedule) {
        logLocalNotificationEvent({
          notificationType: n.extra.type,
          event: 'scheduled',
          notificationId: n.id,
          metadata: {
            title: n.title,
            body: n.body,
            schedule_hour: n.schedule.on.hour,
            schedule_minute: n.schedule.on.minute,
            source: 'hybrid_server_config',
          } as Record<string, Json>,
        });
      }
    } catch (err) {
      console.error('[HybridPN] Error scheduling notifications:', err);
    }
  }

  return { scheduled, skipped };
}

/**
 * Cancel all hybrid notifications (used when user logs out)
 */
export async function cancelAllHybridNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  // Cancel a range of IDs that could be used
  const idsToCancel = Array.from({ length: 100 }, (_, i) => DAILY_PN_BASE_ID + i);
  
  try {
    await LocalNotifications.cancel({
      notifications: idsToCancel.map(id => ({ id })),
    });
    console.log('[HybridPN] Cancelled all hybrid notifications');
  } catch (err) {
    console.error('[HybridPN] Error cancelling all notifications:', err);
  }
}

/**
 * Get currently scheduled hybrid notifications (for debugging)
 */
export async function getScheduledHybridNotifications(): Promise<number[]> {
  if (!Capacitor.isNativePlatform()) return [];

  try {
    const { notifications } = await LocalNotifications.getPending();
    return notifications
      .filter(n => n.id >= DAILY_PN_BASE_ID && n.id < DAILY_PN_BASE_ID + 10000)
      .map(n => n.id);
  } catch (err) {
    console.error('[HybridPN] Error getting pending notifications:', err);
    return [];
  }
}
