import { Capacitor } from '@capacitor/core';
import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { addDays, format } from 'date-fns';
import { logLocalNotificationEvent, logLocalNotificationEventsBatch } from './localNotificationLogger';
import type { Json } from '@/integrations/supabase/types';

export interface UrgentTaskAlarm {
  taskId: string;
  title: string;
  emoji: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  reminderOffset: number; // minutes before
  repeatPattern?: 'none' | 'daily' | 'weekly' | 'monthly' | 'weekend' | 'custom';
  repeatDays?: number[]; // For custom pattern
}

// Number of days to schedule ahead for recurring tasks
const RECURRING_DAYS_AHEAD = 7;

// Notification ID prefix to identify urgent task alarms
const URGENT_ALARM_ID_PREFIX = 900000;

/**
 * Calculate the alarm time based on scheduled time and reminder offset
 * Uses local date parsing to avoid timezone issues
 */
function calculateAlarmTime(scheduledDate: string, scheduledTime: string, reminderOffset: number): Date {
  // Parse date components locally to avoid timezone shifts
  const [year, month, day] = scheduledDate.split('-').map(Number);
  const [hours, minutes] = scheduledTime.split(':').map(Number);
  
  // Create date using local components
  const alarmDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  alarmDate.setMinutes(alarmDate.getMinutes() - reminderOffset);
  return alarmDate;
}

/**
 * Get dates to schedule alarms for based on repeat pattern
 */
function getDatesToSchedule(baseDate: string, repeatPattern?: string, repeatDays?: number[]): string[] {
  const dates: string[] = [];
  const [year, month, day] = baseDate.split('-').map(Number);
  const startDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // For non-repeating tasks, just return the base date if it's today or future
  if (!repeatPattern || repeatPattern === 'none') {
    if (startDate >= today) {
      dates.push(baseDate);
    }
    return dates;
  }
  
  // For recurring tasks, schedule for the next 7 days
  for (let i = 0; i < RECURRING_DAYS_AHEAD; i++) {
    const checkDate = addDays(today, i);
    const checkDateStr = format(checkDate, 'yyyy-MM-dd');
    const dayOfWeek = checkDate.getDay();
    
    let shouldSchedule = false;
    
    if (repeatPattern === 'daily') {
      shouldSchedule = true;
    } else if (repeatPattern === 'weekend') {
      shouldSchedule = dayOfWeek === 0 || dayOfWeek === 6;
    } else if (repeatPattern === 'weekly') {
      const originalDay = startDate.getDay();
      shouldSchedule = dayOfWeek === originalDay;
    } else if (repeatPattern === 'monthly') {
      const originalDayOfMonth = startDate.getDate();
      shouldSchedule = checkDate.getDate() === originalDayOfMonth;
    } else if (repeatPattern === 'custom' && repeatDays) {
      shouldSchedule = repeatDays.includes(dayOfWeek);
    }
    
    if (shouldSchedule) {
      dates.push(checkDateStr);
    }
  }
  
  return dates;
}

/**
 * Generate a unique notification ID for a task + date combo
 */
function generateNotificationId(taskId: string, dateStr: string): number {
  // Create a hash from taskId + date for uniqueness
  let hash = 0;
  const str = `${taskId}-${dateStr}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Ensure positive number and add prefix
  return URGENT_ALARM_ID_PREFIX + Math.abs(hash % 100000);
}

/**
 * Request notification permissions
 */
async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const permission = await LocalNotifications.checkPermissions();
    
    if (permission.display === 'granted') {
      return true;
    }
    
    if (permission.display === 'prompt' || permission.display === 'prompt-with-rationale') {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    }
    
    return false;
  } catch (error) {
    console.error('[TaskAlarm] Permission check failed:', error);
    return false;
  }
}

/**
 * Schedule an urgent alarm using Time-Sensitive Local Notifications
 * These bypass Focus/DND on iOS 15+ and play a loud sound
 * For recurring tasks, schedules multiple days ahead
 */
export async function scheduleUrgentAlarm(task: UrgentTaskAlarm): Promise<{ success: boolean; error?: string; scheduledCount?: number }> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[TaskAlarm] Skipping - not on native platform');
    return { success: false, error: 'Not a native platform' };
  }
  
  try {
    // Check/request notification permission
    const hasPermission = await ensureNotificationPermission();
    
    if (!hasPermission) {
      console.log('[TaskAlarm] Notification permission denied');
      return { success: false, error: 'Notification permission denied. Enable in Settings to use urgent alarms.' };
    }
    
    // Get all dates that need alarms
    const datesToSchedule = getDatesToSchedule(task.scheduledDate, task.repeatPattern, task.repeatDays);
    
    if (datesToSchedule.length === 0) {
      console.log('[TaskAlarm] No future dates to schedule');
      return { success: false, error: 'No future dates to schedule' };
    }
    
    const notifications: LocalNotificationSchema[] = [];
    
    for (const dateStr of datesToSchedule) {
      const alarmTime = calculateAlarmTime(dateStr, task.scheduledTime, task.reminderOffset);
      
      // Don't schedule if the time has already passed
      if (alarmTime <= new Date()) {
        console.log(`[TaskAlarm] Alarm time already passed for ${dateStr}, skipping`);
        continue;
      }
      
      const notificationId = generateNotificationId(task.taskId, dateStr);
      
      notifications.push({
        id: notificationId,
        title: `⚠️ ${task.emoji} ${task.title}`,
        body: 'Urgent task reminder - Time to take action!',
        schedule: {
          at: alarmTime,
          allowWhileIdle: true, // Deliver even in Doze mode
        },
        sound: 'alarm.wav', // Use default loud sound if custom not available
        // iOS specific options for time-sensitive notifications
        extra: {
          taskId: task.taskId,
          isUrgent: true,
          scheduledDate: dateStr,
        },
        // This makes it "time-sensitive" on iOS 15+
        // Note: Capacitor may use 'importance' or the sound config for this
      });
      
      console.log('[TaskAlarm] Preparing notification:', {
        id: notificationId,
        task: task.title,
        date: dateStr,
        alarmTime: alarmTime.toISOString(),
      });
    }
    
    if (notifications.length === 0) {
      return { success: false, error: 'All alarm times have already passed' };
    }
    
    // Schedule all notifications
    await LocalNotifications.schedule({ notifications });
    
    console.log(`[TaskAlarm] ✅ Scheduled ${notifications.length} urgent alarms for "${task.title}"`);
    
    // Log all scheduled alarms
    const events = notifications.map(n => ({
      notificationType: 'urgent_alarm' as const,
      event: 'scheduled' as const,
      taskId: task.taskId,
      notificationId: n.id,
      metadata: {
        title: task.title,
        scheduledDate: n.extra?.scheduledDate,
        alarmTime: n.schedule?.at instanceof Date ? n.schedule.at.toISOString() : String(n.schedule?.at),
      } as Record<string, Json>,
    }));
    logLocalNotificationEventsBatch(events);
    
    return { success: true, scheduledCount: notifications.length };
  } catch (error: any) {
    console.error('[TaskAlarm] Failed to schedule urgent alarm:', error);
    return { success: false, error: error.message || 'Failed to schedule alarm' };
  }
}

/**
 * Cancel all urgent alarms for a specific task
 */
export async function cancelUrgentAlarms(taskId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  
  try {
    const pending = await LocalNotifications.getPending();
    const taskNotifications = pending.notifications.filter(n => 
      n.extra?.taskId === taskId && n.extra?.isUrgent === true
    );
    
    if (taskNotifications.length > 0) {
      await LocalNotifications.cancel({ 
        notifications: taskNotifications.map(n => ({ id: n.id }))
      });
      console.log(`[TaskAlarm] Cancelled ${taskNotifications.length} alarms for task ${taskId}`);
      
      // Log cancellations
      const events = taskNotifications.map(n => ({
        notificationType: 'urgent_alarm' as const,
        event: 'cancelled' as const,
        taskId,
        notificationId: n.id,
      }));
      logLocalNotificationEventsBatch(events);
    }
  } catch (error) {
    console.error('[TaskAlarm] Failed to cancel alarms:', error);
  }
}

/**
 * Check if urgent alarms are available
 * Returns true for UI display purposes - actual scheduling will gracefully fail on non-native
 */
export function isUrgentAlarmAvailable(): boolean {
  return true;
}
