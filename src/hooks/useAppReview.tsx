import { useCallback } from 'react';
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
  const maybeRequestReview = useCallback(async (): Promise<boolean> => {
    if (!canRequestReview()) {
      return false;
    }
    
    // Small delay to let any UI animations complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return requestAppReview();
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

  return {
    maybeRequestReview,
    shouldShowForStreak,
    shouldShowForCourseCompletion,
    canRequestReview,
  };
}
