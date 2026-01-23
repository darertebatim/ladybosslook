import { useState, useCallback, useEffect, useMemo } from 'react';

export interface ReminderSettings {
  reminderMinutes: number;
  isUrgent: boolean;
}

const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  reminderMinutes: 60,
  isUrgent: false,
};

/**
 * Custom hook to manage GLOBAL reminder settings for all sessions and content items in a round.
 * Uses localStorage to persist settings per round.
 */
export function useSessionReminderSettings(roundId: string | undefined) {
  // Global settings for ALL sessions in this round
  const [sessionSettings, setSessionSettingsState] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  // Global settings for ALL content items in this round
  const [contentSettings, setContentSettingsState] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  // Track which content items have reminders scheduled
  const [scheduledContentIds, setScheduledContentIds] = useState<Set<string>>(new Set());

  const sessionStorageKey = useMemo(() => roundId ? `sessionReminders_${roundId}` : null, [roundId]);
  const contentStorageKey = useMemo(() => roundId ? `contentReminders_${roundId}` : null, [roundId]);
  const scheduledStorageKey = useMemo(() => roundId ? `scheduledContent_${roundId}` : null, [roundId]);

  // Load settings from localStorage on mount or when roundId changes
  useEffect(() => {
    if (!sessionStorageKey) return;
    
    try {
      const stored = localStorage.getItem(sessionStorageKey);
      if (stored) {
        setSessionSettingsState(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading session reminder settings:', error);
    }
  }, [sessionStorageKey]);

  useEffect(() => {
    if (!contentStorageKey) return;
    
    try {
      const stored = localStorage.getItem(contentStorageKey);
      if (stored) {
        setContentSettingsState(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading content reminder settings:', error);
    }
  }, [contentStorageKey]);

  useEffect(() => {
    if (!scheduledStorageKey) return;
    
    try {
      const stored = localStorage.getItem(scheduledStorageKey);
      if (stored) {
        setScheduledContentIds(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.error('Error loading scheduled content IDs:', error);
    }
  }, [scheduledStorageKey]);

  // Save global session settings
  const setSessionSettings = useCallback((settings: ReminderSettings) => {
    if (!sessionStorageKey) return;
    setSessionSettingsState(settings);
    localStorage.setItem(sessionStorageKey, JSON.stringify(settings));
  }, [sessionStorageKey]);

  // Save global content settings
  const setContentSettings = useCallback((settings: ReminderSettings) => {
    if (!contentStorageKey) return;
    setContentSettingsState(settings);
    localStorage.setItem(contentStorageKey, JSON.stringify(settings));
  }, [contentStorageKey]);

  // Track scheduled content reminders
  const markContentScheduled = useCallback((contentId: string) => {
    if (!scheduledStorageKey) return;
    setScheduledContentIds(prev => {
      const updated = new Set(prev);
      updated.add(contentId);
      localStorage.setItem(scheduledStorageKey, JSON.stringify([...updated]));
      return updated;
    });
  }, [scheduledStorageKey]);

  const unmarkContentScheduled = useCallback((contentId: string) => {
    if (!scheduledStorageKey) return;
    setScheduledContentIds(prev => {
      const updated = new Set(prev);
      updated.delete(contentId);
      localStorage.setItem(scheduledStorageKey, JSON.stringify([...updated]));
      return updated;
    });
  }, [scheduledStorageKey]);

  const hasContentReminder = useCallback((contentId: string): boolean => {
    return scheduledContentIds.has(contentId);
  }, [scheduledContentIds]);

  return {
    sessionSettings,
    setSessionSettings,
    contentSettings,
    setContentSettings,
    hasContentReminder,
    markContentScheduled,
    unmarkContentScheduled,
    DEFAULT_REMINDER_SETTINGS,
  };
}
