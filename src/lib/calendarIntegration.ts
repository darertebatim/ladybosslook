import { Capacitor } from '@capacitor/core';
import { CapacitorCalendar, CalendarPermissionScope } from '@ebarooni/capacitor-calendar';

export interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  reminderMinutes?: number; // e.g., 60 = 1 hour before
}

/**
 * Check if we have calendar permission
 */
export async function checkCalendarPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!Capacitor.isNativePlatform()) return 'denied';
  
  try {
    const result = await CapacitorCalendar.checkPermission({ 
      scope: CalendarPermissionScope.WRITE_CALENDAR 
    });
    
    if (result.result === 'granted') {
      return 'granted';
    } else if (result.result === 'denied') {
      return 'denied';
    }
    return 'prompt';
  } catch (error) {
    console.error('[Calendar] Error checking permission:', error);
    return 'denied';
  }
}

/**
 * Request calendar permission from user
 */
export async function requestCalendarPermission(): Promise<'granted' | 'denied'> {
  if (!Capacitor.isNativePlatform()) return 'denied';
  
  try {
    const result = await CapacitorCalendar.requestWriteOnlyCalendarAccess();
    return result.result === 'granted' ? 'granted' : 'denied';
  } catch (error) {
    console.error('[Calendar] Error requesting permission:', error);
    return 'denied';
  }
}

/**
 * Add a single event to the native iOS Calendar
 */
export async function addEventToCalendar(event: CalendarEvent): Promise<{ success: boolean; error?: string }> {
  if (!Capacitor.isNativePlatform()) {
    return { success: false, error: 'Not a native platform' };
  }
  
  try {
    // Check/request permission first
    let permission = await checkCalendarPermission();
    
    if (permission === 'prompt') {
      permission = await requestCalendarPermission();
    }
    
    if (permission !== 'granted') {
      return { success: false, error: 'Calendar permission denied' };
    }
    
    // Build alerts array if reminderMinutes is set (in minutes before event)
    const alerts = event.reminderMinutes ? [-event.reminderMinutes] : [-60]; // Default: 1 hour before
    
    // Create the event
    const result = await CapacitorCalendar.createEvent({
      title: event.title,
      description: event.description,
      location: event.location || '',
      startDate: event.startDate.getTime(),
      endDate: event.endDate.getTime(),
      isAllDay: false,
      alerts,
    });
    
    console.log('[Calendar] Event created:', result);
    return { success: true };
  } catch (error: any) {
    console.error('[Calendar] Failed to add event:', error);
    return { success: false, error: error.message || 'Failed to add event' };
  }
}

/**
 * Add multiple events to calendar (e.g., all course sessions)
 */
export async function addMultipleEventsToCalendar(
  events: CalendarEvent[]
): Promise<{ success: boolean; addedCount: number; error?: string }> {
  if (!Capacitor.isNativePlatform()) {
    return { success: false, addedCount: 0, error: 'Not a native platform' };
  }
  
  // Check/request permission first
  let permission = await checkCalendarPermission();
  
  if (permission === 'prompt') {
    permission = await requestCalendarPermission();
  }
  
  if (permission !== 'granted') {
    return { success: false, addedCount: 0, error: 'Calendar permission denied' };
  }
  
  let addedCount = 0;
  
  for (const event of events) {
    const result = await addEventToCalendar(event);
    if (result.success) {
      addedCount++;
    }
  }
  
  return { 
    success: addedCount > 0, 
    addedCount,
    error: addedCount === 0 ? 'No events were added' : undefined
  };
}

/**
 * Check if calendar integration is available (native iOS/Android only)
 * Also respects ?devNative=true for preview purposes
 */
export function isCalendarAvailable(): boolean {
  // Check for dev preview flag
  if (typeof window !== 'undefined') {
    const devNative = new URLSearchParams(window.location.search).get('devNative') === 'true';
    if (devNative) return true;
  }
  
  return Capacitor.isNativePlatform();
}
