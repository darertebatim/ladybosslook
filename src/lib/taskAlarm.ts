import { Capacitor } from '@capacitor/core';
import { CapacitorCalendar } from '@ebarooni/capacitor-calendar';
import { checkCalendarPermission, requestCalendarPermission } from './calendarIntegration';
import { addDays, format, parse } from 'date-fns';

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
 * Schedule an urgent alarm using native iOS Calendar
 * Calendar alarms bypass silent mode and show full-screen alerts with sound
 * For recurring tasks, schedules multiple days ahead
 */
export async function scheduleUrgentAlarm(task: UrgentTaskAlarm): Promise<{ success: boolean; error?: string; scheduledCount?: number }> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[TaskAlarm] Skipping - not on native platform');
    return { success: false, error: 'Not a native platform' };
  }
  
  try {
    // Check/request calendar permission
    let permission = await checkCalendarPermission();
    
    if (permission === 'prompt') {
      permission = await requestCalendarPermission();
    }
    
    if (permission !== 'granted') {
      console.log('[TaskAlarm] Calendar permission denied');
      return { success: false, error: 'Calendar permission denied. Enable in Settings to use urgent alarms.' };
    }
    
    // Get all dates that need alarms
    const datesToSchedule = getDatesToSchedule(task.scheduledDate, task.repeatPattern, task.repeatDays);
    
    if (datesToSchedule.length === 0) {
      console.log('[TaskAlarm] No future dates to schedule');
      return { success: false, error: 'No future dates to schedule' };
    }
    
    let scheduledCount = 0;
    
    for (const dateStr of datesToSchedule) {
      const alarmTime = calculateAlarmTime(dateStr, task.scheduledTime, task.reminderOffset);
      
      // Don't schedule if the time has already passed
      if (alarmTime <= new Date()) {
        console.log(`[TaskAlarm] Alarm time already passed for ${dateStr}, skipping`);
        continue;
      }
      
      // Create calendar event with alarm at the event time (alerts: [0] = at event start)
      const result = await CapacitorCalendar.createEvent({
        title: `${task.emoji} ${task.title}`,
        description: '⚠️ Urgent task reminder from LadyBoss Academy',
        location: '',
        startDate: alarmTime.getTime(),
        endDate: alarmTime.getTime() + 30 * 60 * 1000, // 30 min duration
        isAllDay: false,
        alerts: [0], // Alert at event start time - this triggers the iOS alarm!
      });
      
      console.log('[TaskAlarm] ✅ Urgent alarm scheduled:', {
        task: task.title,
        date: dateStr,
        alarmTime: alarmTime.toISOString(),
        eventResult: result,
      });
      
      scheduledCount++;
    }
    
    if (scheduledCount === 0) {
      return { success: false, error: 'All alarm times have already passed' };
    }
    
    console.log(`[TaskAlarm] ✅ Scheduled ${scheduledCount} urgent alarms for "${task.title}"`);
    return { success: true, scheduledCount };
  } catch (error: any) {
    console.error('[TaskAlarm] Failed to schedule urgent alarm:', error);
    return { success: false, error: error.message || 'Failed to schedule alarm' };
  }
}

/**
 * Check if urgent alarms are available
 * Returns true for UI display purposes - actual scheduling will gracefully fail on non-native
 */
export function isUrgentAlarmAvailable(): boolean {
  return true;
}
