import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

// Minimum days between review prompts
const MIN_DAYS_BETWEEN_PROMPTS = 30;

// Minimum engagement thresholds
const MIN_COMPLETED_TRACKS = 3;
const MIN_STREAK_DAYS = 3;

// Streak milestones that trigger review prompt
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

export type ReviewTriggerSource = 
  | 'track_complete' 
  | 'playlist_complete' 
  | 'streak_milestone' 
  | 'course_complete'
  | 'journal_entry'
  | 'breathing_session';

export type ReviewEventType = 
  | 'prompted' 
  | 'rated_in_app' 
  | 'native_shown' 
  | 'feedback_given' 
  | 'dismissed';

interface ReviewEvent {
  event_type: ReviewEventType;
  in_app_rating?: number;
  feedback?: string;
  trigger_source?: ReviewTriggerSource;
}

/**
 * Check if we're running on native iOS
 */
export const isNativeIOS = (): boolean => {
  return Capacitor.getPlatform() === 'ios' && Capacitor.isNativePlatform();
};

/**
 * Request the native App Store review prompt
 * Note: Apple may choose not to display the prompt
 */
export const requestNativeReview = async (): Promise<boolean> => {
  if (!isNativeIOS()) {
    console.log('[AppReview] Not on native iOS, skipping native review request');
    return false;
  }

  try {
    const { AppReview } = await import('@capawesome/capacitor-app-review');
    await AppReview.requestReview();
    console.log('[AppReview] Native review prompt requested');
    return true;
  } catch (error) {
    console.error('[AppReview] Failed to request native review:', error);
    return false;
  }
};

/**
 * Log a review event to the database
 */
export const logReviewEvent = async (
  userId: string,
  event: ReviewEvent
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('app_review_events')
      .insert({
        user_id: userId,
        event_type: event.event_type,
        in_app_rating: event.in_app_rating,
        feedback: event.feedback,
        trigger_source: event.trigger_source,
      });

    if (error) throw error;
    console.log('[AppReview] Event logged:', event.event_type);
  } catch (error) {
    console.error('[AppReview] Failed to log event:', error);
  }
};

/**
 * Check if user was prompted recently (within MIN_DAYS_BETWEEN_PROMPTS)
 */
export const wasPromptedRecently = async (userId: string): Promise<boolean> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MIN_DAYS_BETWEEN_PROMPTS);

    const { data, error } = await supabase
      .from('app_review_events')
      .select('id')
      .eq('user_id', userId)
      .eq('event_type', 'prompted')
      .gte('created_at', cutoffDate.toISOString())
      .limit(1);

    if (error) throw error;
    return (data?.length ?? 0) > 0;
  } catch (error) {
    console.error('[AppReview] Failed to check recent prompts:', error);
    return true; // Fail safe: don't prompt if we can't check
  }
};

/**
 * Check if native review was already shown (Apple limits to 3x/year)
 */
export const wasNativeReviewShown = async (userId: string): Promise<boolean> => {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const { data, error } = await supabase
      .from('app_review_events')
      .select('id')
      .eq('user_id', userId)
      .eq('event_type', 'native_shown')
      .gte('created_at', oneYearAgo.toISOString());

    if (error) throw error;
    // Apple allows max 3 prompts per year
    return (data?.length ?? 0) >= 3;
  } catch (error) {
    console.error('[AppReview] Failed to check native review history:', error);
    return true; // Fail safe
  }
};

/**
 * Get user's completed audio tracks count
 */
export const getCompletedTracksCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('audio_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true);

    if (error) throw error;
    return count ?? 0;
  } catch (error) {
    console.error('[AppReview] Failed to get completed tracks:', error);
    return 0;
  }
};

/**
 * Get user's current streak from user_streaks table
 */
export const getUserStreak = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('user_streaks')
      .select('current_streak')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.current_streak ?? 0;
  } catch (error) {
    console.error('[AppReview] Failed to get user streak:', error);
    return 0;
  }
};

/**
 * Check if user is engaged enough to be prompted
 */
export const isUserEngaged = async (userId: string): Promise<boolean> => {
  const [completedTracks, streak] = await Promise.all([
    getCompletedTracksCount(userId),
    getUserStreak(userId),
  ]);

  return completedTracks >= MIN_COMPLETED_TRACKS || streak >= MIN_STREAK_DAYS;
};

/**
 * Main eligibility check - should we show the review prompt?
 */
export const checkReviewEligibility = async (
  userId: string,
  triggerSource: ReviewTriggerSource
): Promise<boolean> => {
  // Must be on native iOS
  if (!isNativeIOS()) {
    console.log('[AppReview] Not eligible: not on native iOS');
    return false;
  }

  // Check if prompted recently
  const recentlyPrompted = await wasPromptedRecently(userId);
  if (recentlyPrompted) {
    console.log('[AppReview] Not eligible: prompted recently');
    return false;
  }

  // Check if native review already shown max times
  const nativeMaxReached = await wasNativeReviewShown(userId);
  if (nativeMaxReached) {
    console.log('[AppReview] Not eligible: native review shown max times this year');
    return false;
  }

  // Check if user is engaged enough
  const engaged = await isUserEngaged(userId);
  if (!engaged) {
    console.log('[AppReview] Not eligible: user not engaged enough');
    return false;
  }

  console.log('[AppReview] User is eligible for review prompt, trigger:', triggerSource);
  return true;
};
