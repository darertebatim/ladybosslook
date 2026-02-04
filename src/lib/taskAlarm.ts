/**
 * Task Alarm Service - STUBBED (Capacitor removed)
 * 
 * All functions return safe defaults.
 * Capacitor will be added back incrementally to identify the black screen cause.
 */

export interface UrgentTaskAlarm {
  taskId: string;
  title: string;
  emoji: string;
  scheduledDate: string;
  scheduledTime: string;
  reminderOffset: number;
  repeatPattern?: 'none' | 'daily' | 'weekly' | 'monthly' | 'weekend' | 'custom';
  repeatDays?: number[];
}

export async function scheduleUrgentAlarm(task: UrgentTaskAlarm): Promise<{ success: boolean; error?: string; scheduledCount?: number }> {
  console.log('[TaskAlarm] Skipping - Capacitor removed');
  return { success: false, error: 'Not a native platform' };
}

export async function cancelUrgentAlarms(taskId: string): Promise<void> {
  // No-op
}

export function isUrgentAlarmAvailable(): boolean {
  // Return true for UI display purposes
  return true;
}
