import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  checkReviewEligibility,
  logReviewEvent,
  requestNativeReview,
  ReviewTriggerSource,
  STREAK_MILESTONES,
} from '@/lib/appReview';

interface UseAppReviewReturn {
  isPromptOpen: boolean;
  isFeedbackOpen: boolean;
  triggerSource: ReviewTriggerSource | null;
  checkAndPromptReview: (source: ReviewTriggerSource) => Promise<void>;
  handleRating: (rating: number) => Promise<void>;
  handleFeedbackSubmit: (feedback: string) => Promise<void>;
  handleDismiss: () => void;
  closeFeedback: () => void;
}

export function useAppReview(): UseAppReviewReturn {
  const { user } = useAuth();
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [triggerSource, setTriggerSource] = useState<ReviewTriggerSource | null>(null);
  const [currentRating, setCurrentRating] = useState<number>(0);

  const checkAndPromptReview = useCallback(async (source: ReviewTriggerSource) => {
    if (!user?.id) return;

    const isEligible = await checkReviewEligibility(user.id, source);
    if (isEligible) {
      setTriggerSource(source);
      setIsPromptOpen(true);
      
      // Log that we prompted the user
      await logReviewEvent(user.id, {
        event_type: 'prompted',
        trigger_source: source,
      });
    }
  }, [user?.id]);

  const handleRating = useCallback(async (rating: number) => {
    if (!user?.id) return;

    setCurrentRating(rating);

    // Log the in-app rating
    await logReviewEvent(user.id, {
      event_type: 'rated_in_app',
      in_app_rating: rating,
      trigger_source: triggerSource || undefined,
    });

    if (rating >= 4) {
      // Happy user - trigger native App Store review
      setIsPromptOpen(false);
      
      const nativeShown = await requestNativeReview();
      if (nativeShown) {
        await logReviewEvent(user.id, {
          event_type: 'native_shown',
          in_app_rating: rating,
          trigger_source: triggerSource || undefined,
        });
      }
    } else {
      // Unhappy user - show feedback form
      setIsPromptOpen(false);
      setIsFeedbackOpen(true);
    }
  }, [user?.id, triggerSource]);

  const handleFeedbackSubmit = useCallback(async (feedback: string) => {
    if (!user?.id) return;

    await logReviewEvent(user.id, {
      event_type: 'feedback_given',
      in_app_rating: currentRating,
      feedback,
      trigger_source: triggerSource || undefined,
    });

    setIsFeedbackOpen(false);
    setCurrentRating(0);
    setTriggerSource(null);
  }, [user?.id, currentRating, triggerSource]);

  const handleDismiss = useCallback(() => {
    if (user?.id) {
      logReviewEvent(user.id, {
        event_type: 'dismissed',
        trigger_source: triggerSource || undefined,
      });
    }
    setIsPromptOpen(false);
    setTriggerSource(null);
  }, [user?.id, triggerSource]);

  const closeFeedback = useCallback(() => {
    setIsFeedbackOpen(false);
    setCurrentRating(0);
    setTriggerSource(null);
  }, []);

  return {
    isPromptOpen,
    isFeedbackOpen,
    triggerSource,
    checkAndPromptReview,
    handleRating,
    handleFeedbackSubmit,
    handleDismiss,
    closeFeedback,
  };
}

/**
 * Helper to check if a streak is a milestone worth prompting for
 */
export function isStreakMilestone(streak: number): boolean {
  return STREAK_MILESTONES.includes(streak);
}
