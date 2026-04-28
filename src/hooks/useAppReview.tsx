import { useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { requestAppReview, canRequestReview } from '@/lib/appReview';
import { supabase } from '@/integrations/supabase/client';
import { App } from '@capacitor/app';

// Milestone thresholds for triggering review
const STREAK_MILESTONE = 5; // Show review after 5 days this month

// iOS App Store ID for direct review deep link
const IOS_APP_ID = '6755076134';
const IOS_REVIEW_URL_NATIVE = `itms-apps://itunes.apple.com/app/id${IOS_APP_ID}?action=write-review`;
const IOS_REVIEW_URL_WEB = `https://apps.apple.com/app/id${IOS_APP_ID}?action=write-review`;

// Android Play Store package + direct review deep links
const ANDROID_PACKAGE = 'com.ladybosslook.academy';
const ANDROID_REVIEW_URL_NATIVE = `market://details?id=${ANDROID_PACKAGE}&showAllReviews=true`;
const ANDROID_REVIEW_URL_WEB = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}&showAllReviews=true`;

/**
 * Open the Google Play Store directly to the app's review section.
 * Used as a fallback when the native In-App Review API silently no-ops.
 */
export async function openAndroidReviewPage(trigger?: string): Promise<boolean> {
  try {
    const url = Capacitor.isNativePlatform() ? ANDROID_REVIEW_URL_NATIVE : ANDROID_REVIEW_URL_WEB;
    window.open(url, '_blank');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        let appVersion: string | undefined;
        try {
          if (Capacitor.isNativePlatform()) {
            const info = await App.getInfo();
            appVersion = info.version;
          }
        } catch {}
        await supabase.from('app_review_prompts').insert({
          user_id: user.id,
          platform: Capacitor.getPlatform() === 'android' ? 'android' : 'web',
          trigger_source: trigger ?? 'android_softlink',
          success: true,
          forced: false,
          app_version: appVersion ?? null,
          error_message: 'softlink',
        });
      }
    } catch {}
    return true;
  } catch (e) {
    console.warn('[Review] Failed to open Android review URL', e);
    return false;
  }
}

/**
 * Open the iOS App Store directly to the "Write a Review" page.
 * Bypasses Apple's 3/365 native quota since it's a regular link.
 */
export async function openIOSReviewPage(trigger?: string): Promise<boolean> {
  try {
    const url = Capacitor.isNativePlatform() ? IOS_REVIEW_URL_NATIVE : IOS_REVIEW_URL_WEB;
    window.open(url, '_blank');
    // Log it for KPI tracking (mirrors logReviewPrompt shape)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        let appVersion: string | undefined;
        try {
          if (Capacitor.isNativePlatform()) {
            const info = await App.getInfo();
            appVersion = info.version;
          }
        } catch {}
        await supabase.from('app_review_prompts').insert({
          user_id: user.id,
          platform: Capacitor.getPlatform() === 'ios' ? 'ios' : (Capacitor.getPlatform() === 'android' ? 'android' : 'web'),
          trigger_source: trigger ?? 'ios_softlink',
          success: true,
          forced: false,
          app_version: appVersion ?? null,
          error_message: 'softlink',
        });
      }
    } catch {}
    return true;
  } catch (e) {
    console.warn('[Review] Failed to open iOS review URL', e);
    return false;
  }
}

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

  /**
   * iOS-only soft-link review prompt. Opens the App Store "Write a Review"
   * page directly via deep link, bypassing Apple's 3/365-day native API quota.
   * Uses a separate cooldown key so it doesn't conflict with the native prompt.
   */
  const openIOSReviewSoftLink = useCallback(
    async (trigger?: string): Promise<boolean> => {
      if (Capacitor.getPlatform() !== 'ios') return false;
      return openIOSReviewPage(trigger);
    },
    []
  );

  /**
   * Android-only soft-link review. Opens the Play Store review page directly.
   * Use this as a guaranteed fallback when you want a 100% reliable open
   * (vs. the throttled native In-App Review API).
   */
  const openAndroidReviewSoftLink = useCallback(
    async (trigger?: string): Promise<boolean> => {
      if (Capacitor.getPlatform() !== 'android') return false;
      return openAndroidReviewPage(trigger);
    },
    []
  );

  return {
    maybeRequestReview,
    maybeRequestReviewAndroidOnly,
    openIOSReviewSoftLink,
    openAndroidReviewSoftLink,
    shouldShowForStreak,
    shouldShowForCourseCompletion,
    canRequestReview,
  };
}
