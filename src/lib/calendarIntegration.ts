import { Capacitor } from '@capacitor/core';
import { CapacitorCalendar, CalendarPermissionScope } from '@ebarooni/capacitor-calendar';

export interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  reminderMinutes?: number | number[]; // e.g., 60 = 1 hour before, or [15, 60] for multiple
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
 * Ensure we have calendar write permission, requesting if needed.
 */
async function ensureCalendarPermission(): Promise<boolean> {
  let permission = await checkCalendarPermission();
  if (permission === 'prompt') {
    permission = await requestCalendarPermission();
  }
  return permission === 'granted';
}

/**
 * Delete calendar events by their native IDs.
 * Silently ignores failures (event may have been manually deleted).
 */
export async function deleteCalendarEventsById(eventIds: string[]): Promise<void> {
  if (!Capacitor.isNativePlatform() || eventIds.length === 0) return;

  try {
    await CapacitorCalendar.deleteEventsById({ ids: eventIds });
    console.log('[Calendar] Deleted events:', eventIds);
  } catch (error) {
    // Silently ignore – the user may have already deleted the event manually
    console.warn('[Calendar] Could not delete some events (may already be removed):', error);
  }
}

/**
 * Add a single event to the native iOS/Android Calendar.
 * Returns the native calendar event ID so it can be stored for future updates/deletes.
 */
export async function addEventToCalendar(event: CalendarEvent): Promise<{ success: boolean; calendarEventId?: string; error?: string }> {
  if (!Capacitor.isNativePlatform()) {
    return { success: false, error: 'Not a native platform' };
  }
  
  try {
    const hasPermission = await ensureCalendarPermission();
    if (!hasPermission) {
      return { success: false, error: 'Calendar permission denied' };
    }
    
    // Build alerts array if reminderMinutes is set (in minutes before event)
    const rmArr = event.reminderMinutes
      ? (Array.isArray(event.reminderMinutes) ? event.reminderMinutes : [event.reminderMinutes])
      : [60];
    const alerts = rmArr.map(m => -m);
    
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
    
    // The plugin returns { result: string } where result is the event ID
    const calendarEventId = (result as any)?.result ?? undefined;
    console.log('[Calendar] Event created:', calendarEventId);
    return { success: true, calendarEventId };
  } catch (error: any) {
    console.error('[Calendar] Failed to add event:', error);
    return { success: false, error: error.message || 'Failed to add event' };
  }
}

/**
 * Replace a calendar event: delete the old one (if exists) then create a new one.
 * Returns the new native calendar event ID.
 */
export async function replaceCalendarEvent(
  event: CalendarEvent,
  oldCalendarEventId?: string
): Promise<{ success: boolean; calendarEventId?: string; error?: string }> {
  // Delete old event first if we have its ID
  if (oldCalendarEventId) {
    await deleteCalendarEventsById([oldCalendarEventId]);
  }
  // Create the new event
  return addEventToCalendar(event);
}

/**
 * Add multiple events to calendar (e.g., all course sessions).
 * Optionally deletes old calendar events first (for re-sync / update).
 * Returns a map of index → calendarEventId for storage.
 */
export async function addMultipleEventsToCalendar(
  events: CalendarEvent[],
  oldCalendarEventIds?: string[]
): Promise<{ success: boolean; addedCount: number; calendarEventIds: (string | undefined)[]; error?: string }> {
  if (!Capacitor.isNativePlatform()) {
    return { success: false, addedCount: 0, calendarEventIds: [], error: 'Not a native platform' };
  }
  
  const hasPermission = await ensureCalendarPermission();
  if (!hasPermission) {
    return { success: false, addedCount: 0, calendarEventIds: [], error: 'Calendar permission denied' };
  }

  // Delete all old calendar events first if provided
  if (oldCalendarEventIds && oldCalendarEventIds.length > 0) {
    const validIds = oldCalendarEventIds.filter(Boolean);
    if (validIds.length > 0) {
      await deleteCalendarEventsById(validIds);
    }
  }
  
  let addedCount = 0;
  const calendarEventIds: (string | undefined)[] = [];
  
  for (const event of events) {
    const result = await addEventToCalendar(event);
    calendarEventIds.push(result.calendarEventId);
    if (result.success) {
      addedCount++;
    }
  }
  
  return { 
    success: addedCount > 0, 
    addedCount,
    calendarEventIds,
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
