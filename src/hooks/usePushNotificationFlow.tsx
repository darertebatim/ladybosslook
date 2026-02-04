/**
 * Push Notification Flow hook - STUBBED (Capacitor removed)
 * 
 * Returns safe defaults.
 * Capacitor will be added back incrementally to identify the black screen cause.
 */

import { useState, useCallback } from 'react';

export type PushFlowState = {
  showOnboarding: boolean;
  showBanner: boolean;
  showCoursePrompt: boolean;
  isPreEnrolled: boolean;
  promptCount: number;
};

export const shouldShowPushUI = () => {
  return false;
};

export const usePushNotificationFlow = (userId: string | undefined) => {
  const [flowState] = useState<PushFlowState>({
    showOnboarding: false,
    showBanner: false,
    showCoursePrompt: false,
    isPreEnrolled: false,
    promptCount: 0,
  });

  const completeOnboarding = useCallback(() => {}, []);
  const dismissOnboarding = useCallback(() => {}, []);
  const triggerCoursePrompt = useCallback(async () => false, []);
  const dismissCoursePrompt = useCallback(() => {}, []);

  return {
    flowState,
    completeOnboarding,
    dismissOnboarding,
    triggerCoursePrompt,
    dismissCoursePrompt,
  };
};

export const shouldShowCourseNotificationPrompt = async (): Promise<boolean> => {
  return false;
};
