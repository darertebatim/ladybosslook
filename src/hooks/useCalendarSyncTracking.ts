import { useState, useEffect, useCallback, useMemo } from 'react';

interface CalendarSyncState {
  lastSyncTime: string | null;
  syncedSessionIds: Set<string>;
  lastSyncedSessionCount: number;
}

interface StoredSyncState {
  lastSyncTime: string | null;
  syncedSessionIds: string[];
  lastSyncedSessionCount: number;
}

/**
 * Custom hook to track which calendar sessions have been synced.
 * Uses localStorage to persist sync status across sessions.
 * This allows us to show "synced" state on buttons without needing calendar read permissions.
 */
export function useCalendarSyncTracking(roundId: string | undefined) {
  const [syncState, setSyncState] = useState<CalendarSyncState>({
    lastSyncTime: null,
    syncedSessionIds: new Set(),
    lastSyncedSessionCount: 0,
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
      };
      localStorage.setItem(storageKey, JSON.stringify(toStore));
    } catch (error) {
      console.error('Error saving calendar sync state:', error);
    }
  }, [storageKey]);

  // Mark a single session as synced
  const markSessionSynced = useCallback((sessionId: string) => {
    if (!storageKey) return;
    
    setSyncState(prev => {
      const newSyncedIds = new Set(prev.syncedSessionIds);
      newSyncedIds.add(sessionId);
      
      const newState: CalendarSyncState = {
        ...prev,
        syncedSessionIds: newSyncedIds,
      };
      
      persistState(newState);
      return newState;
    });
  }, [storageKey, persistState]);

  // Mark all sessions as synced (bulk sync)
  const markAllSessionsSynced = useCallback((sessionIds: string[]) => {
    if (!storageKey) return;
    
    const newState: CalendarSyncState = {
      lastSyncTime: new Date().toISOString(),
      syncedSessionIds: new Set(sessionIds),
      lastSyncedSessionCount: sessionIds.length,
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

  return {
    syncState,
    markSessionSynced,
    markAllSessionsSynced,
    isSessionSynced,
    areAllSessionsSynced,
    getUnsyncedCount,
    getUnsyncedSessionIds,
  };
}
