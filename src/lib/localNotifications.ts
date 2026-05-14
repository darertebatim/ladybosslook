import { LocalNotifications, ScheduleOn } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { addDays, format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { logLocalNotificationEvent } from './localNotificationLogger';
import type { Json } from '@/integrations/supabase/types';

/**
 * Local Notifications Service for Task Reminders
 * 
 * Uses device-side scheduling for exact timing and offline support.
 * More reliable than server-side push notifications for time-sensitive reminders.
 */

export interface TaskNotificationInput {
  taskId: string;
  title: string;
  emoji: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  reminderOffset: number; // minutes before
  repeatPattern?: 'none' | 'daily' | 'weekly' | 'monthly' | 'weekend' | 'custom';
  repeatDays?: number[]; // for custom: [0,1,2,3,4,5,6] where 0 = Sunday
  proLinkType?: string | null;
  proLinkValue?: string | null;
}

// Notification ID prefix to identify task reminders (separate from urgent alarms 900000–999999)
const TASK_REMINDER_ID_PREFIX = 1_000_000;
// How many upcoming occurrences to schedule for non-daily/weekly recurring patterns
const RECURRING_HORIZON_DAYS = 60;

/**
 * Returns Android exact-alarm permission status.
 * - 'granted' on iOS / non-native (no separate permission needed)
 * - 'granted' | 'denied' | 'unknown' on Android
 */
export async function getAndroidExactAlarmStatus(): Promise<'granted' | 'denied' | 'unknown'> {
  if (!Capacitor.isNativePlatform()) return 'granted';
  if (Capacitor.getPlatform() !== 'android') return 'granted';
  try {
    const setting = await LocalNotifications.checkExactNotificationSetting();
    if (setting.exact_alarm === 'granted') return 'granted';
    if (setting.exact_alarm === 'denied') return 'denied';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/** Open the Android system settings page where the user can grant exact alarms. */
export async function openAndroidExactAlarmSettings(): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;
  try {
    await LocalNotifications.changeExactNotificationSetting();
  } catch (e) {
    console.warn('[LocalNotifications] openAndroidExactAlarmSettings failed:', e);
  }
}

// Convert UUID to numeric ID (LocalNotifications requires number IDs)
function hashTaskId(uuid: string): number {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    hash = ((hash << 5) - hash) + uuid.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Per-(taskId, date) ID for multi-occurrence scheduling
function generateOccurrenceId(taskId: string, dateStr: string): number {
  let hash = 0;
  const str = `${taskId}-${dateStr}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return TASK_REMINDER_ID_PREFIX + (Math.abs(hash) % 100_000_000);
}

// Compute future occurrence dates for a given repeat pattern (next horizon days)
function getOccurrenceDates(
  baseDate: string,
  repeatPattern: TaskNotificationInput['repeatPattern'],
  repeatDays?: number[],
  horizonDays: number = RECURRING_HORIZON_DAYS,
): string[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [by, bm, bd] = baseDate.split('-').map(Number);
  const startDate = new Date(by, bm - 1, bd);

  if (!repeatPattern || repeatPattern === 'none') {
    return startDate >= today ? [baseDate] : [];
  }

  const dates: string[] = [];
  for (let i = 0; i < horizonDays; i++) {
    const d = addDays(today, i);
    const dow = d.getDay();
    let ok = false;
    if (repeatPattern === 'weekend') ok = dow === 0 || dow === 6;
    else if (repeatPattern === 'monthly') ok = d.getDate() === startDate.getDate();
    else if (repeatPattern === 'custom' && repeatDays?.length) ok = repeatDays.includes(dow);
    if (ok) dates.push(format(d, 'yyyy-MM-dd'));
  }
  return dates;
}

// Calculate the notification time based on scheduled time minus offset
function calculateNotificationTime(scheduledDate: string, scheduledTime: string, offsetMinutes: number): Date {
  const [hours, minutes] = scheduledTime.split(':').map(Number);
  const date = new Date(`${scheduledDate}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
  date.setMinutes(date.getMinutes() - offsetMinutes);
  return date;
}

// Get the appropriate deep link URL based on pro_link_type
function getNotificationUrl(proLinkType?: string | null, proLinkValue?: string | null): string {
  if (!proLinkType) return '/app/home';
  
  switch (proLinkType) {
    case 'playlist':
      return proLinkValue ? `/app/player/playlist/${proLinkValue}` : '/app/player';
    case 'channel':
      return '/app/channels';
    case 'journal':
      return '/app/reflections';
    case 'inspire':
    case 'routine':
      return '/app/routines';
    case 'planner':
    default:
      return '/app/home';
  }
}

// Format reminder offset for notification body
function formatOffsetText(offsetMinutes: number): string {
  if (offsetMinutes === 0) return "It's time!";
  if (offsetMinutes === 10) return 'Starting in 10 minutes';
  if (offsetMinutes === 30) return 'Starting in 30 minutes';
  if (offsetMinutes === 60) return 'Starting in 1 hour';
  return `Starting in ${offsetMinutes} minutes`;
}

/**
 * Schedule a local notification for a task reminder
 */
export async function scheduleTaskReminder(task: TaskNotificationInput): Promise<{ success: boolean; error?: string }> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[LocalNotifications] Not on native platform, skipping');
    return { success: false, error: 'Not on native platform' };
  }
  
  try {
    const permission = await LocalNotifications.checkPermissions();
    const displayPermission = permission.display === 'granted'
      ? permission
      : await LocalNotifications.requestPermissions();

    if (displayPermission.display !== 'granted') {
      console.log('[LocalNotifications] Display permission denied, skipping task reminder');
      return { success: false, error: 'Notification permission denied' };
    }

    if (Capacitor.getPlatform() === 'android') {
      const exactSetting = await LocalNotifications.checkExactNotificationSetting();
      if (exactSetting.exact_alarm !== 'granted') {
        console.warn('[LocalNotifications] Exact alarm permission is not granted; opening Android exact alarm settings');
        await LocalNotifications.changeExactNotificationSetting();
        return { success: false, error: 'Exact alarm permission required' };
      }
    }

    const notificationTime = calculateNotificationTime(
      task.scheduledDate,
      task.scheduledTime,
      task.reminderOffset
    );

    const url = getNotificationUrl(task.proLinkType, task.proLinkValue);
    
    // Determine schedule based on repeat pattern
    // allowWhileIdle ensures Android delivers the notification even in Doze mode
    const notifications: any[] = [];

    if (task.repeatPattern === 'daily') {
      // Native repeating daily — single notification, lifetime
      notifications.push({
        id: hashTaskId(task.taskId),
        title: `${task.emoji} ${task.title}`,
        body: formatOffsetText(task.reminderOffset),
        schedule: {
          on: { hour: notificationTime.getHours(), minute: notificationTime.getMinutes() } as ScheduleOn,
          repeats: true,
          allowWhileIdle: true,
        },
        sound: 'default',
        channelId: 'task-reminders',
        extra: { taskId: task.taskId, url, type: 'task_reminder' },
      });
    } else if (task.repeatPattern === 'weekly' && task.scheduledDate) {
      const dayOfWeek = new Date(`${task.scheduledDate}T00:00:00`).getDay();
      notifications.push({
        id: hashTaskId(task.taskId),
        title: `${task.emoji} ${task.title}`,
        body: formatOffsetText(task.reminderOffset),
        schedule: {
          on: {
            weekday: dayOfWeek + 1,
            hour: notificationTime.getHours(),
            minute: notificationTime.getMinutes(),
          } as ScheduleOn,
          repeats: true,
          allowWhileIdle: true,
        },
        sound: 'default',
        channelId: 'task-reminders',
        extra: { taskId: task.taskId, url, type: 'task_reminder' },
      });
    } else {
      // none / monthly / weekend / custom — schedule N upcoming occurrences explicitly.
      // Each (taskId, date) gets a unique ID; refresh on app launch keeps horizon full.
      const dates = getOccurrenceDates(task.scheduledDate, task.repeatPattern, task.repeatDays);
      const now = new Date();
      for (const dateStr of dates) {
        const at = calculateNotificationTime(dateStr, task.scheduledTime, task.reminderOffset);
        if (at <= now) continue;
        notifications.push({
          id: generateOccurrenceId(task.taskId, dateStr),
          title: `${task.emoji} ${task.title}`,
          body: formatOffsetText(task.reminderOffset),
          schedule: { at, allowWhileIdle: true },
          sound: 'default',
          channelId: 'task-reminders',
          extra: { taskId: task.taskId, url, type: 'task_reminder', occurrenceDate: dateStr },
        });
      }
    }

    if (notifications.length === 0) {
      console.log('[LocalNotifications] No future occurrences to schedule');
      return { success: false, error: 'No future occurrences' };
    }

    await LocalNotifications.schedule({ notifications });

    console.log(`[LocalNotifications] ✅ Scheduled ${notifications.length} reminder(s) for "${task.title}"`);

    logLocalNotificationEvent({
      notificationType: 'task_reminder',
      event: 'scheduled',
      taskId: task.taskId,
      notificationId: notifications[0].id,
      metadata: {
        title: task.title,
        scheduledDate: task.scheduledDate,
        scheduledTime: task.scheduledTime,
        reminderOffset: task.reminderOffset,
        repeatPattern: task.repeatPattern || 'none',
        scheduledCount: notifications.length,
      } as Record<string, Json>,
    });

    return { success: true };
  } catch (error) {
    console.error('[LocalNotifications] Failed to schedule reminder:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Cancel a task's local notification
 */
export async function cancelTaskReminder(taskId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  
  try {
    // Cancel both the legacy single-id reminder and any per-occurrence notifications
    const ids = new Set<number>([hashTaskId(taskId)]);
    try {
      const pending = await LocalNotifications.getPending();
      for (const n of pending.notifications) {
        if (n.extra?.taskId === taskId && n.extra?.type === 'task_reminder') {
          ids.add(n.id);
        }
      }
    } catch { /* ignore */ }

    await LocalNotifications.cancel({
      notifications: Array.from(ids).map((id) => ({ id })),
    });
    console.log(`[LocalNotifications] Cancelled reminder for task ${taskId}`);
    
    // Log the cancellation
    logLocalNotificationEvent({
      notificationType: 'task_reminder',
      event: 'cancelled',
      taskId,
      notificationId: hashTaskId(taskId),
    });
  } catch (error) {
    console.error('[LocalNotifications] Failed to cancel reminder:', error);
  }
}

/**
 * Refresh all of a user's task reminders.
 * Call on app launch + on app resume so non-daily/weekly horizons stay full
 * and reminders survive cleanup or device reschedules.
 */
export async function refreshAllTaskReminders(userId: string | undefined): Promise<void> {
  if (!userId) return;
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { data, error } = await supabase
      .from('user_tasks')
      .select('id, title, emoji, scheduled_date, scheduled_time, reminder_enabled, reminder_offset, repeat_pattern, repeat_days, is_urgent, is_active, pro_link_type, pro_link_value')
      .eq('user_id', userId)
      .eq('reminder_enabled', true)
      .eq('is_urgent', false)
      .eq('is_active', true);

    if (error) throw error;
    if (!data?.length) return;

    let refreshed = 0;
    for (const t of data as any[]) {
      if (!t.scheduled_time) continue;
      // For 'none', scheduled_date is required; skip past one-offs
      if ((t.repeat_pattern || 'none') === 'none' && !t.scheduled_date) continue;

      await cancelTaskReminder(t.id);
      const result = await scheduleTaskReminder({
        taskId: t.id,
        title: t.title,
        emoji: t.emoji || '☀️',
        scheduledDate: t.scheduled_date || format(new Date(), 'yyyy-MM-dd'),
        scheduledTime: t.scheduled_time,
        reminderOffset: t.reminder_offset || 0,
        repeatPattern: t.repeat_pattern || 'none',
        repeatDays: t.repeat_days || [],
        proLinkType: t.pro_link_type,
        proLinkValue: t.pro_link_value,
      });
      if (result.success) refreshed++;
    }
    console.log(`[LocalNotifications] Refreshed ${refreshed}/${data.length} task reminders`);
  } catch (e) {
    console.error('[LocalNotifications] refreshAllTaskReminders failed:', e);
  }
}

/**
 * Request local notification permission
 */
export async function requestLocalNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  
  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch (error) {
    console.error('[LocalNotifications] Failed to request permission:', error);
    return false;
  }
}

/**
 * Check if local notifications are available
 */
export function isLocalNotificationsAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Initialize local notification handlers for deep linking
 * Call this once in App.tsx
 */
export function initializeLocalNotificationHandlers(navigate: (url: string) => void): void {
  if (!Capacitor.isNativePlatform()) return;
  
  // Handle notification tap (when app is in background or closed)
  LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    console.log('[LocalNotifications] Notification tapped:', action.notification);
    const url = action.notification.extra?.url || '/app/home';
    const taskId = action.notification.extra?.taskId;
    const isUrgent = action.notification.extra?.isUrgent;
    
    // Log the tap event
    logLocalNotificationEvent({
      notificationType: isUrgent ? 'urgent_alarm' : 'task_reminder',
      event: 'tapped',
      taskId: typeof taskId === 'string' ? taskId : undefined,
      notificationId: action.notification.id,
      metadata: { url } as Record<string, Json>,
    });
    
    navigate(url);
  });
  
  // Handle notification received while app is in foreground
  LocalNotifications.addListener('localNotificationReceived', (notification) => {
    console.log('[LocalNotifications] Notification received in foreground:', notification);
    const taskId = notification.extra?.taskId;
    const isUrgent = notification.extra?.isUrgent;
    
    // Log the delivery event
    logLocalNotificationEvent({
      notificationType: isUrgent ? 'urgent_alarm' : 'task_reminder',
      event: 'delivered',
      taskId: typeof taskId === 'string' ? taskId : undefined,
      notificationId: notification.id,
    });
  });
  
  console.log('[LocalNotifications] Handlers initialized');
}
