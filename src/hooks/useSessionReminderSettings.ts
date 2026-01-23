import { useState, useEffect, useCallback, useMemo } from 'react';

export interface ReminderSettings {
  reminderMinutes: number;
  isUrgent: boolean;
}

interface SessionReminderState {
  [sessionId: string]: ReminderSettings;
}

interface ContentReminderState {
  [itemId: string]: {
    reminderMinutes: number;
    enabled: boolean;
  };
}

const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  reminderMinutes: 60,
  isUrgent: false,
};

const DEFAULT_CONTENT_REMINDER = {
  reminderMinutes: 60,
  enabled: false,
};

/**
 * Custom hook to manage reminder settings for sessions and content items.
 * Uses localStorage to persist settings per round.
 */
export function useSessionReminderSettings(roundId: string | undefined) {
  const [sessionSettings, setSessionSettings] = useState<SessionReminderState>({});
  const [contentSettings, setContentSettings] = useState<ContentReminderState>({});

  const sessionStorageKey = useMemo(() => roundId ? `sessionReminders_${roundId}` : null, [roundId]);
  const contentStorageKey = useMemo(() => roundId ? `contentReminders_${roundId}` : null, [roundId]);

  // Load session settings from localStorage on mount or when roundId changes
  useEffect(() => {
    if (!sessionStorageKey) return;
    
    try {
      const stored = localStorage.getItem(sessionStorageKey);
      if (stored) {
        setSessionSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading session reminder settings:', error);
    }
  }, [sessionStorageKey]);

  // Load content settings from localStorage
  useEffect(() => {
    if (!contentStorageKey) return;
    
    try {
      const stored = localStorage.getItem(contentStorageKey);
      if (stored) {
        setContentSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading content reminder settings:', error);
    }
  }, [contentStorageKey]);

  // Persist session settings to localStorage
  const persistSessionSettings = useCallback((newState: SessionReminderState) => {
    if (!sessionStorageKey) return;
    
    try {
      localStorage.setItem(sessionStorageKey, JSON.stringify(newState));
    } catch (error) {
      console.error('Error saving session reminder settings:', error);
    }
  }, [sessionStorageKey]);

  // Persist content settings to localStorage
  const persistContentSettings = useCallback((newState: ContentReminderState) => {
    if (!contentStorageKey) return;
    
    try {
      localStorage.setItem(contentStorageKey, JSON.stringify(newState));
    } catch (error) {
      console.error('Error saving content reminder settings:', error);
    }
  }, [contentStorageKey]);

  // Get settings for a specific session
  const getSessionSettings = useCallback((sessionId: string): ReminderSettings => {
    return sessionSettings[sessionId] || DEFAULT_REMINDER_SETTINGS;
  }, [sessionSettings]);

  // Update settings for a specific session
  const setSessionReminderSettings = useCallback((sessionId: string, settings: ReminderSettings) => {
    setSessionSettings(prev => {
      const newState = {
        ...prev,
        [sessionId]: settings,
      };
      persistSessionSettings(newState);
      return newState;
    });
  }, [persistSessionSettings]);

  // Get settings for a specific content item
  const getContentSettings = useCallback((itemId: string) => {
    return contentSettings[itemId] || DEFAULT_CONTENT_REMINDER;
  }, [contentSettings]);

  // Update settings for a specific content item
  const setContentReminderSettings = useCallback((itemId: string, settings: { reminderMinutes: number; enabled: boolean }) => {
    setContentSettings(prev => {
      const newState = {
        ...prev,
        [itemId]: settings,
      };
      persistContentSettings(newState);
      return newState;
    });
  }, [persistContentSettings]);

  // Check if a content item has a reminder enabled
  const hasContentReminder = useCallback((itemId: string): boolean => {
    return contentSettings[itemId]?.enabled || false;
  }, [contentSettings]);

  // Clear reminder for a content item
  const clearContentReminder = useCallback((itemId: string) => {
    setContentSettings(prev => {
      const newState = { ...prev };
      delete newState[itemId];
      persistContentSettings(newState);
      return newState;
    });
  }, [persistContentSettings]);

  return {
    getSessionSettings,
    setSessionReminderSettings,
    getContentSettings,
    setContentReminderSettings,
    hasContentReminder,
    clearContentReminder,
    DEFAULT_REMINDER_SETTINGS,
  };
}
