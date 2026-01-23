import { Capacitor } from '@capacitor/core';
import { CapacitorCalendar, CalendarPermissionScope } from '@ebarooni/capacitor-calendar';
import { checkCalendarPermission, requestCalendarPermission } from './calendarIntegration';

export interface UrgentTaskAlarm {
  taskId: string;
  title: string;
  emoji: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  reminderOffset: number; // minutes before
}

/**
 * Calculate the alarm time based on scheduled time and reminder offset
 */
function calculateAlarmTime(scheduledDate: string, scheduledTime: string, reminderOffset: number): Date {
  const [hours, minutes] = scheduledTime.split(':').map(Number);
  const alarmDate = new Date(`${scheduledDate}T${scheduledTime}:00`);
  alarmDate.setMinutes(alarmDate.getMinutes() - reminderOffset);
  return alarmDate;
}

/**
 * Schedule an urgent alarm using native iOS Calendar
 * Calendar alarms bypass silent mode and show full-screen alerts with sound
 */
export async function scheduleUrgentAlarm(task: UrgentTaskAlarm): Promise<{ success: boolean; error?: string }> {
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
    
    const alarmTime = calculateAlarmTime(task.scheduledDate, task.scheduledTime, task.reminderOffset);
    
    // Don't schedule if the time has already passed
    if (alarmTime <= new Date()) {
      console.log('[TaskAlarm] Alarm time already passed, skipping');
      return { success: false, error: 'Alarm time has already passed' };
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
      alarmTime: alarmTime.toISOString(),
      eventResult: result,
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('[TaskAlarm] Failed to schedule urgent alarm:', error);
    return { success: false, error: error.message || 'Failed to schedule alarm' };
  }
}

/**
 * Check if urgent alarms are available (native platform with calendar support)
 */
export function isUrgentAlarmAvailable(): boolean {
  // Check for dev preview flag
  if (typeof window !== 'undefined') {
    const devNative = new URLSearchParams(window.location.search).get('devNative') === 'true';
    if (devNative) return true;
  }
  
  return Capacitor.isNativePlatform();
}
