import { useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { requestAppReview, canRequestReview } from '@/lib/appReview';

// Milestone thresholds for triggering review
const STREAK_MILESTONE = 5; // Show review after 5 days this month

/**
 * Hook for managing App Store review prompts
 * 
 * Usage:
 * const { maybeRequestReview, shouldShowForStreak } = useAppReview();
 * 
 * // After streak celebration closes:
 * if (shouldShowForStreak(thisMonthDays)) {
 *   maybeRequestReview();
 * }
 */
export function useAppReview() {
  /**
   * Request a review if conditions are met
   * Returns true if review was requested
   */
  const maybeRequestReview = useCallback(async (trigger?: string): Promise<boolean> => {
    if (!canRequestReview()) {
      return false;
    }
    
    // Small delay to let any UI animations complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return requestAppReview(trigger);
  }, []);

  /**
   * Check if we should show review for a streak milestone
   */
  const shouldShowForStreak = useCallback((thisMonthDays: number): boolean => {
    // Trigger on exactly the milestone day to avoid repeat prompts
    return thisMonthDays === STREAK_MILESTONE && canRequestReview();
  }, []);

  /**
   * Check if we should show review after course completion
   */
  const shouldShowForCourseCompletion = useCallback((): boolean => {
    return canRequestReview();
  }, []);

  /**
   * Android-only secondary trigger. Google's In-App Review API is silently
   * throttled, so we add an extra prompt point on Android (e.g. gold badge)
   * to maximize the chance the OS actually displays the dialog. iOS already
   * gets a prompt at the silver badge / streak milestone, so we skip it here
   * to avoid burning Apple's strict 3-per-365-days quota.
   */
  const maybeRequestReviewAndroidOnly = useCallback(
    async (trigger?: string): Promise<boolean> => {
      if (Capacitor.getPlatform() !== 'android') return false;
      if (!canRequestReview()) return false;
      await new Promise(resolve => setTimeout(resolve, 500));
      return requestAppReview(trigger);
    },
    []
  );

  return {
    maybeRequestReview,
    maybeRequestReviewAndroidOnly,
    shouldShowForStreak,
    shouldShowForCourseCompletion,
    canRequestReview,
  };
}
