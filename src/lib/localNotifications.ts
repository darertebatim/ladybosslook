/**
 * Local Notifications Service - STUBBED (Capacitor removed)
 * 
 * All functions return safe defaults.
 * Capacitor will be added back incrementally to identify the black screen cause.
 */

export interface TaskNotificationInput {
  taskId: string;
  title: string;
  emoji: string;
  scheduledDate: string;
  scheduledTime: string;
  reminderOffset: number;
  repeatPattern?: 'none' | 'daily' | 'weekly' | 'monthly' | 'weekend' | 'custom';
  repeatDays?: number[];
  proLinkType?: string | null;
  proLinkValue?: string | null;
}

export async function scheduleTaskReminder(task: TaskNotificationInput): Promise<{ success: boolean; error?: string }> {
  console.log('[LocalNotifications] Schedule skipped (Capacitor removed)');
  return { success: false, error: 'Not on native platform' };
}

export async function cancelTaskReminder(taskId: string): Promise<void> {
  // No-op
}

export async function requestLocalNotificationPermission(): Promise<boolean> {
  return false;
}

export function isLocalNotificationsAvailable(): boolean {
  return false;
}

export async function initializeLocalNotificationHandlers(navigate: (url: string) => void): Promise<void> {
  // No-op
}
