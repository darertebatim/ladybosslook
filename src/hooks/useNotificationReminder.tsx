import { useState, useEffect } from 'react';
import { checkPermissionStatus } from '@/lib/pushNotifications';

export interface NotificationReminderState {
  shouldShowPopup: boolean;
  popupType: 'initial' | 'enrollment' | 'timed' | null;
  popupMessage: string;
  promptCount: number;
}

/**
 * Hook to manage push notification reminder logic across the app
 * Handles timing, localStorage tracking, and popup display decisions
 */
export const useNotificationReminder = () => {
  const [reminderState, setReminderState] = useState<NotificationReminderState>({
    shouldShowPopup: false,
    popupType: null,
    popupMessage: '',
    promptCount: 0,
  });

  // Check if we should show a reminder popup
  useEffect(() => {
    const checkReminderStatus = async () => {
      // Check if notifications are already enabled
      const permission = await checkPermissionStatus();
      if (permission === 'granted') {
        return; // Don't show any reminders if already enabled
      }

      // Check if user explicitly declined ("Never ask again")
      const userDeclined = localStorage.getItem('userDeclinedNotifications');
      if (userDeclined === 'true') {
        return; // Respect user's explicit opt-out
      }

      // Get tracking data from localStorage
      const hasSeenInitial = localStorage.getItem('hasSeenInitialNotificationPrompt');
      const lastPromptTime = localStorage.getItem('lastNotificationPromptTime');
      const promptCount = parseInt(localStorage.getItem('notificationPromptCount') || '0');
      const hasSeenEnrollment = localStorage.getItem('hasSeenEnrollmentPrompt');

      const now = Date.now();

      // 1. Initial Welcome Popup (first time app launch, after 2 seconds)
      if (!hasSeenInitial) {
        setTimeout(() => {
          setReminderState({
            shouldShowPopup: true,
            popupType: 'initial',
            popupMessage: 'Get notified about new courses, class reminders, and important updates',
            promptCount: 0,
          });
        }, 2000);
        return;
      }

      // 2. Time-based persistent reminders
      if (lastPromptTime) {
        const lastPrompt = parseInt(lastPromptTime);
        const daysSinceLastPrompt = (now - lastPrompt) / (1000 * 60 * 60 * 24);

        // Stop after 4 weeks of reminders
        if (promptCount >= 7) {
          return; // 3 reminders (every 3 days) + 4 weekly = 7 total
        }

        // First 3 reminders: every 3 days
        if (promptCount < 3 && daysSinceLastPrompt >= 3) {
          setReminderState({
            shouldShowPopup: true,
            popupType: 'timed',
            popupMessage: getTimedReminderMessage(promptCount),
            promptCount,
          });
          return;
        }

        // After first 3: weekly reminders
        if (promptCount >= 3 && daysSinceLastPrompt >= 7) {
          setReminderState({
            shouldShowPopup: true,
            popupType: 'timed',
            popupMessage: getTimedReminderMessage(promptCount),
            promptCount,
          });
          return;
        }
      }
    };

    checkReminderStatus();
  }, []);

  // Mark initial prompt as seen
  const markInitialPromptSeen = () => {
    localStorage.setItem('hasSeenInitialNotificationPrompt', 'true');
    localStorage.setItem('lastNotificationPromptTime', Date.now().toString());
    localStorage.setItem('notificationPromptCount', '1');
  };

  // Mark enrollment prompt as seen
  const markEnrollmentPromptSeen = () => {
    localStorage.setItem('hasSeenEnrollmentPrompt', 'true');
    localStorage.setItem('lastNotificationPromptTime', Date.now().toString());
    const currentCount = parseInt(localStorage.getItem('notificationPromptCount') || '0');
    localStorage.setItem('notificationPromptCount', (currentCount + 1).toString());
  };

  // Mark timed prompt as seen
  const markTimedPromptSeen = () => {
    localStorage.setItem('lastNotificationPromptTime', Date.now().toString());
    const currentCount = parseInt(localStorage.getItem('notificationPromptCount') || '0');
    localStorage.setItem('notificationPromptCount', (currentCount + 1).toString());
  };

  // User explicitly declined notifications
  const markUserDeclined = () => {
    localStorage.setItem('userDeclinedNotifications', 'true');
  };

  // Dismiss current popup
  const dismissPopup = () => {
    setReminderState(prev => ({ ...prev, shouldShowPopup: false, popupType: null }));
  };

  return {
    reminderState,
    markInitialPromptSeen,
    markEnrollmentPromptSeen,
    markTimedPromptSeen,
    markUserDeclined,
    dismissPopup,
  };
};

// Helper: Get varied messages for timed reminders
const getTimedReminderMessage = (count: number): string => {
  const messages = [
    'Stay updated with course reminders and important announcements',
    'Never miss a class! Enable notifications to stay on track',
    'Get the most out of your courses with timely reminders',
    'Join thousands who stay connected with push notifications',
    'Enable notifications to receive exclusive course updates',
  ];
  return messages[count % messages.length];
};

// Check if we should show enrollment reminder
export const shouldShowEnrollmentReminder = async (): Promise<boolean> => {
  const permission = await checkPermissionStatus();
  if (permission === 'granted') return false;

  const userDeclined = localStorage.getItem('userDeclinedNotifications');
  if (userDeclined === 'true') return false;

  const hasSeenEnrollment = localStorage.getItem('hasSeenEnrollmentPrompt');
  return !hasSeenEnrollment;
};

// Check if we should show the in-app banner
export const shouldShowNotificationBanner = async (): Promise<boolean> => {
  const permission = await checkPermissionStatus();
  if (permission === 'granted') return false;

  const userDeclined = localStorage.getItem('userDeclinedNotifications');
  if (userDeclined === 'true') return false;

  const bannerDismissedTime = localStorage.getItem('notificationBannerDismissedTime');
  if (bannerDismissedTime) {
    const dismissed = parseInt(bannerDismissedTime);
    const daysSinceDismissed = (Date.now() - dismissed) / (1000 * 60 * 60 * 24);
    if (daysSinceDismissed < 2) return false; // Don't show if dismissed within 2 days
  }

  return true;
};

// Dismiss banner
export const dismissNotificationBanner = () => {
  localStorage.setItem('notificationBannerDismissedTime', Date.now().toString());
};
