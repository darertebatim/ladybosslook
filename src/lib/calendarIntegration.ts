/**
 * Calendar Integration - STUBBED (Capacitor removed)
 * 
 * All functions return safe defaults.
 * Capacitor will be added back incrementally to identify the black screen cause.
 */

export interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  reminderMinutes?: number;
}

export async function checkCalendarPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  return 'denied';
}

export async function requestCalendarPermission(): Promise<'granted' | 'denied'> {
  return 'denied';
}

export async function addEventToCalendar(event: CalendarEvent): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'Not a native platform' };
}

export async function addMultipleEventsToCalendar(
  events: CalendarEvent[]
): Promise<{ success: boolean; addedCount: number; error?: string }> {
  return { success: false, addedCount: 0, error: 'Not a native platform' };
}

export function isCalendarAvailable(): boolean {
  // Check for dev preview flag only
  if (typeof window !== 'undefined') {
    const devNative = new URLSearchParams(window.location.search).get('devNative') === 'true';
    if (devNative) return true;
  }
  
  return false;
}
