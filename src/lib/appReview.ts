/**
 * App Review - STUBBED (Capacitor removed)
 * 
 * All functions return safe defaults.
 * Capacitor will be added back incrementally to identify the black screen cause.
 */

import { supabase } from '@/integrations/supabase/client';

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

export const isNativeIOS = (): boolean => {
  return false;
};

export const requestNativeReview = async (): Promise<boolean> => {
  return false;
};

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

export const wasPromptedRecently = async (userId: string): Promise<boolean> => {
  return true; // Don't prompt
};

export const wasNativeReviewShown = async (userId: string): Promise<boolean> => {
  return true; // Don't show
};

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

export const isUserEngaged = async (userId: string): Promise<boolean> => {
  return false;
};

export const checkReviewEligibility = async (
  userId: string,
  triggerSource: ReviewTriggerSource
): Promise<boolean> => {
  return false;
};
