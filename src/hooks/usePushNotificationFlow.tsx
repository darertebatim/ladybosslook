import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { checkPermissionStatus } from '@/lib/pushNotifications';
import { supabase } from '@/integrations/supabase/client';

export type PushFlowState = {
  // Full-screen onboarding (after login)
  showOnboarding: boolean;
  // Home page banner
  showBanner: boolean;
  // Course access prompt
  showCoursePrompt: boolean;
  // Is this a pre-enrolled user (enrolled before first app login)
  isPreEnrolled: boolean;
  // How many times we've prompted
  promptCount: number;
};

/**
 * Central hook for managing push notification permission flow
 * Tracks pre-enrolled users and manages multiple touchpoints
 */
export const usePushNotificationFlow = (userId: string | undefined) => {
  const [flowState, setFlowState] = useState<PushFlowState>({
    showOnboarding: false,
    showBanner: false,
    showCoursePrompt: false,
    isPreEnrolled: false,
    promptCount: 0,
  });

  // Check if user is pre-enrolled (had enrollments before their first app login)
  const checkPreEnrolledStatus = useCallback(async () => {
    if (!userId) return false;

    try {
      // Check if this is their first app session (no previous tracking)
      const firstAppLogin = localStorage.getItem('firstAppLoginTime');
      
      if (!firstAppLogin) {
        // First time opening app - record this time
        localStorage.setItem('firstAppLoginTime', Date.now().toString());
        
        // Check if they have existing enrollments (would mean pre-enrolled)
        const { data: enrollments, error } = await supabase
          .from('course_enrollments')
          .select('id, created_at')
          .eq('user_id', userId)
          .limit(1);
        
        if (!error && enrollments && enrollments.length > 0) {
          // They have enrollments on first app login = pre-enrolled
          localStorage.setItem('preEnrolledNeedsPush', 'true');
          return true;
        }
      }

      // Check existing flag
      return localStorage.getItem('preEnrolledNeedsPush') === 'true';
    } catch (error) {
      console.error('[PushFlow] Error checking pre-enrolled status:', error);
      return false;
    }
  }, [userId]);

  // Initialize flow state on mount
  useEffect(() => {
    const initializeFlow = async () => {
      if (!userId || !Capacitor.isNativePlatform()) {
        return;
      }

      // Check if notifications already enabled
      const permission = await checkPermissionStatus();
      if (permission === 'granted') {
        // Clean up flags
        localStorage.removeItem('preEnrolledNeedsPush');
        return;
      }

      // Check pre-enrolled status
      const isPreEnrolled = await checkPreEnrolledStatus();
      const promptCount = parseInt(localStorage.getItem('pushPromptCount') || '0');
      const onboardingCompleted = localStorage.getItem('pushOnboardingCompleted') === 'true';
      const onboardingDismissed = localStorage.getItem('pushOnboardingDismissed');

      // Determine if we should show full-screen onboarding
      let showOnboarding = false;
      
      if (!onboardingCompleted) {
        if (!onboardingDismissed) {
          // Never seen onboarding - show after 2 seconds
          showOnboarding = true;
        } else {
          // Check how long since dismissed
          const daysSinceDismissed = (Date.now() - parseInt(onboardingDismissed)) / (1000 * 60 * 60 * 24);
          // Pre-enrolled users: show again after 3 days, regular: after 7 days
          const threshold = isPreEnrolled ? 3 : 7;
          if (daysSinceDismissed >= threshold && promptCount < 5) {
            showOnboarding = true;
          }
        }
      }

      setFlowState({
        showOnboarding,
        showBanner: false, // Banner shown by component itself
        showCoursePrompt: false, // Triggered by course page
        isPreEnrolled,
        promptCount,
      });
    };

    // Delay initialization to let the app settle
    const timer = setTimeout(initializeFlow, 2000);
    return () => clearTimeout(timer);
  }, [userId, checkPreEnrolledStatus]);

  // Mark onboarding as completed
  const completeOnboarding = useCallback(() => {
    localStorage.setItem('pushOnboardingCompleted', 'true');
    localStorage.removeItem('preEnrolledNeedsPush');
    setFlowState(prev => ({ ...prev, showOnboarding: false }));
  }, []);

  // Dismiss onboarding (skip)
  const dismissOnboarding = useCallback(() => {
    const count = parseInt(localStorage.getItem('pushPromptCount') || '0');
    localStorage.setItem('pushPromptCount', (count + 1).toString());
    localStorage.setItem('pushOnboardingDismissed', Date.now().toString());
    setFlowState(prev => ({ ...prev, showOnboarding: false, promptCount: count + 1 }));
  }, []);

  // Trigger course access prompt
  const triggerCoursePrompt = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return false;
    
    const permission = await checkPermissionStatus();
    if (permission === 'granted') return false;

    // Check if recently skipped (within 2 hours for course prompt)
    const skippedAt = localStorage.getItem('courseNotificationSkipped');
    if (skippedAt) {
      const hoursSince = (Date.now() - parseInt(skippedAt)) / (1000 * 60 * 60);
      if (hoursSince < 2) return false;
    }

    setFlowState(prev => ({ ...prev, showCoursePrompt: true }));
    return true;
  }, []);

  // Dismiss course prompt
  const dismissCoursePrompt = useCallback(() => {
    setFlowState(prev => ({ ...prev, showCoursePrompt: false }));
  }, []);

  return {
    flowState,
    completeOnboarding,
    dismissOnboarding,
    triggerCoursePrompt,
    dismissCoursePrompt,
  };
};

/**
 * Check if user should see course notification prompt
 * Called from course detail page
 */
export const shouldShowCourseNotificationPrompt = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;
  
  const permission = await checkPermissionStatus();
  if (permission === 'granted') return false;

  // Check if skipped recently
  const skippedAt = localStorage.getItem('courseNotificationSkipped');
  if (skippedAt) {
    const hoursSince = (Date.now() - parseInt(skippedAt)) / (1000 * 60 * 60);
    if (hoursSince < 2) return false; // Don't show if skipped within 2 hours
  }

  return true;
};
