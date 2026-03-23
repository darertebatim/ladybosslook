import { useState, useEffect, useCallback, useMemo } from 'react';

interface CalendarSyncState {
  lastSyncTime: string | null;
  syncedSessionIds: Set<string>;
  lastSyncedSessionCount: number;
  /** Maps session ID → native calendar event ID for delete/update support */
  calendarEventIds: Record<string, string>;
}

interface StoredSyncState {
  lastSyncTime: string | null;
  syncedSessionIds: string[];
  lastSyncedSessionCount: number;
  calendarEventIds?: Record<string, string>;
}

/**
 * Custom hook to track which calendar sessions have been synced.
 * Uses localStorage to persist sync status across sessions.
 * Now also stores native calendar event IDs so events can be updated/deleted.
 */
export function useCalendarSyncTracking(roundId: string | undefined) {
  const [syncState, setSyncState] = useState<CalendarSyncState>({
    lastSyncTime: null,
    syncedSessionIds: new Set(),
    lastSyncedSessionCount: 0,
    calendarEventIds: {},
  });

  const storageKey = useMemo(() => roundId ? `calendarSync_${roundId}` : null, [roundId]);

  // Load from localStorage on mount or when roundId changes
  useEffect(() => {
    if (!storageKey) return;
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: StoredSyncState = JSON.parse(stored);
        setSyncState({
          lastSyncTime: parsed.lastSyncTime,
          syncedSessionIds: new Set(parsed.syncedSessionIds || []),
          lastSyncedSessionCount: parsed.lastSyncedSessionCount || 0,
          calendarEventIds: parsed.calendarEventIds || {},
        });
      }
    } catch (error) {
      console.error('Error loading calendar sync state:', error);
    }
  }, [storageKey]);

  // Persist state to localStorage
  const persistState = useCallback((newState: CalendarSyncState) => {
    if (!storageKey) return;
    
    try {
      const toStore: StoredSyncState = {
        lastSyncTime: newState.lastSyncTime,
        syncedSessionIds: Array.from(newState.syncedSessionIds),
        lastSyncedSessionCount: newState.lastSyncedSessionCount,
        calendarEventIds: newState.calendarEventIds,
      };
      localStorage.setItem(storageKey, JSON.stringify(toStore));
    } catch (error) {
      console.error('Error saving calendar sync state:', error);
    }
  }, [storageKey]);

  // Mark a single session as synced, optionally storing native calendar event ID
  const markSessionSynced = useCallback((sessionId: string, calendarEventId?: string) => {
    if (!storageKey) return;
    
    setSyncState(prev => {
      const newSyncedIds = new Set(prev.syncedSessionIds);
      newSyncedIds.add(sessionId);
      
      const newCalendarEventIds = { ...prev.calendarEventIds };
      if (calendarEventId) {
        newCalendarEventIds[sessionId] = calendarEventId;
      }
      
      const newState: CalendarSyncState = {
        ...prev,
        syncedSessionIds: newSyncedIds,
        calendarEventIds: newCalendarEventIds,
      };
      
      persistState(newState);
      return newState;
    });
  }, [storageKey, persistState]);

  // Mark all sessions as synced (bulk sync) with their calendar event IDs
  const markAllSessionsSynced = useCallback((
    sessionIds: string[],
    calendarEventIdMap?: Record<string, string>
  ) => {
    if (!storageKey) return;
    
    const newState: CalendarSyncState = {
      lastSyncTime: new Date().toISOString(),
      syncedSessionIds: new Set(sessionIds),
      lastSyncedSessionCount: sessionIds.length,
      calendarEventIds: calendarEventIdMap || {},
    };
    
    setSyncState(newState);
    persistState(newState);
  }, [storageKey, persistState]);

  // Check if a specific session is synced
  const isSessionSynced = useCallback((sessionId: string) => {
    return syncState.syncedSessionIds.has(sessionId);
  }, [syncState.syncedSessionIds]);

  // Check if all provided sessions are synced
  const areAllSessionsSynced = useCallback((currentSessionIds: string[]) => {
    if (currentSessionIds.length === 0) return false;
    return currentSessionIds.every(id => syncState.syncedSessionIds.has(id));
  }, [syncState.syncedSessionIds]);

  // Get count of unsynced sessions
  const getUnsyncedCount = useCallback((currentSessionIds: string[]) => {
    return currentSessionIds.filter(id => !syncState.syncedSessionIds.has(id)).length;
  }, [syncState.syncedSessionIds]);

  // Get list of unsynced session IDs
  const getUnsyncedSessionIds = useCallback((currentSessionIds: string[]) => {
    return currentSessionIds.filter(id => !syncState.syncedSessionIds.has(id));
  }, [syncState.syncedSessionIds]);

  // Get the native calendar event ID for a specific session
  const getCalendarEventId = useCallback((sessionId: string): string | undefined => {
    return syncState.calendarEventIds[sessionId];
  }, [syncState.calendarEventIds]);

  // Get all stored native calendar event IDs (for bulk delete before re-sync)
  const getAllCalendarEventIds = useCallback((): string[] => {
    return Object.values(syncState.calendarEventIds).filter(Boolean);
  }, [syncState.calendarEventIds]);

  return {
    syncState,
    markSessionSynced,
    markAllSessionsSynced,
    isSessionSynced,
    areAllSessionsSynced,
    getUnsyncedCount,
    getUnsyncedSessionIds,
    getCalendarEventId,
    getAllCalendarEventIds,
  };
}
