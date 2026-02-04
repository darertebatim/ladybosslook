import { Capacitor } from '@capacitor/core';
import type { ScheduleOn } from '@capacitor/local-notifications';

let localNotificationsPlugin: typeof import('@capacitor/local-notifications').LocalNotifications | null = null;

async function getLocalNotifications() {
  if (!Capacitor.isNativePlatform()) return null;
  if (!Capacitor.isPluginAvailable('LocalNotifications')) {
    console.warn('[LocalNotifications] LocalNotifications plugin not available');
    return null;
  }

  if (!localNotificationsPlugin) {
    const mod = await import('@capacitor/local-notifications');
    localNotificationsPlugin = mod.LocalNotifications;
  }

  return localNotificationsPlugin;
}

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

// Convert UUID to numeric ID (LocalNotifications requires number IDs)
function hashTaskId(uuid: string): number {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    hash = ((hash << 5) - hash) + uuid.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
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
      return '/app/journal';
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

  const LocalNotifications = await getLocalNotifications();
  if (!LocalNotifications) {
    return { success: false, error: 'Local notifications plugin not available' };
  }
  
  try {
    const notificationTime = calculateNotificationTime(
      task.scheduledDate,
      task.scheduledTime,
      task.reminderOffset
    );
    
    // Don't schedule if time has already passed
    if (notificationTime <= new Date()) {
      console.log('[LocalNotifications] Notification time has passed, skipping');
      return { success: false, error: 'Notification time has passed' };
    }
    
    const notificationId = hashTaskId(task.taskId);
    const url = getNotificationUrl(task.proLinkType, task.proLinkValue);
    
    // Determine schedule based on repeat pattern
    let schedule: any = { at: notificationTime };
    
    // For repeating tasks, use native repeat functionality
    if (task.repeatPattern === 'daily') {
      schedule = {
        on: {
          hour: notificationTime.getHours(),
          minute: notificationTime.getMinutes(),
        } as ScheduleOn,
        repeats: true,
      };
    } else if (task.repeatPattern === 'weekly' && task.scheduledDate) {
      // Weekly - same day of week
      const dayOfWeek = new Date(task.scheduledDate).getDay();
      schedule = {
        on: {
          weekday: dayOfWeek + 1, // iOS uses 1-7, JS uses 0-6
          hour: notificationTime.getHours(),
          minute: notificationTime.getMinutes(),
        } as ScheduleOn,
        repeats: true,
      };
    }
    // For other patterns (none, monthly, weekend, custom), use one-time scheduling
    // The server-side cron can handle the more complex patterns as a fallback
    
    await LocalNotifications.schedule({
      notifications: [{
        id: notificationId,
        title: `${task.emoji} ${task.title}`,
        body: formatOffsetText(task.reminderOffset),
        schedule,
        sound: 'default',
        extra: {
          taskId: task.taskId,
          url,
          type: 'task_reminder',
        },
      }],
    });
    
    console.log(`[LocalNotifications] ✅ Scheduled reminder for "${task.title}" at ${notificationTime.toISOString()}`);
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

  const LocalNotifications = await getLocalNotifications();
  if (!LocalNotifications) return;
  
  try {
    const notificationId = hashTaskId(taskId);
    await LocalNotifications.cancel({
      notifications: [{ id: notificationId }],
    });
    console.log(`[LocalNotifications] Cancelled reminder for task ${taskId}`);
  } catch (error) {
    console.error('[LocalNotifications] Failed to cancel reminder:', error);
  }
}

/**
 * Request local notification permission
 */
export async function requestLocalNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  const LocalNotifications = await getLocalNotifications();
  if (!LocalNotifications) return false;
  
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

  (async () => {
    const LocalNotifications = await getLocalNotifications();
    if (!LocalNotifications) return;

    // Handle notification tap (when app is in background or closed)
    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      console.log('[LocalNotifications] Notification tapped:', action.notification);
      const url = action.notification.extra?.url || '/app/home';
      navigate(url);
    });

    // Handle notification received while app is in foreground
    LocalNotifications.addListener('localNotificationReceived', (notification) => {
      console.log('[LocalNotifications] Notification received in foreground:', notification);
    });

    console.log('[LocalNotifications] Handlers initialized');
  })().catch((e) => console.error('[LocalNotifications] Handler init failed:', e));
}
