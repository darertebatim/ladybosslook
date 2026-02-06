import { Capacitor } from '@capacitor/core';

const LAST_REVIEW_KEY = 'app_last_review_prompt';
const REVIEW_COOLDOWN_DAYS = 30;

/**
 * Check if we can show a review prompt (respects cooldown period)
 */
export function canRequestReview(): boolean {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }
  
  const lastReview = localStorage.getItem(LAST_REVIEW_KEY);
  if (!lastReview) {
    return true;
  }
  
  const lastDate = new Date(lastReview);
  const now = new Date();
  const daysSinceLastReview = Math.floor(
    (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return daysSinceLastReview >= REVIEW_COOLDOWN_DAYS;
}

/**
 * Request an App Store review from the user
 * Uses the native in-app review dialog (iOS/Android)
 * 
 * Note: iOS limits this to 3 times per 365 days per user
 * and may choose not to show the dialog at all
 */
export async function requestAppReview(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Review] Skipping - not native platform');
    return false;
  }
  
  if (!canRequestReview()) {
    console.log('[Review] Skipping - cooldown period active');
    return false;
  }
  
  try {
    // Check if plugin is available
    if (!Capacitor.isPluginAvailable('InAppReview')) {
      console.warn('[Review] InAppReview plugin not available');
      return false;
    }
    
    const { InAppReview } = await import('@capacitor-community/in-app-review');
    await InAppReview.requestReview();
    
    // Record that we requested a review
    localStorage.setItem(LAST_REVIEW_KEY, new Date().toISOString());
    console.log('[Review] ✓ Review requested successfully');
    
    return true;
  } catch (error) {
    console.error('[Review] Error requesting review:', error);
    return false;
  }
}

/**
 * Force request a review (for testing purposes only)
 * Bypasses the cooldown check
 */
export async function forceRequestReview(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Review] Skipping - not native platform');
    return false;
  }
  
  try {
    if (!Capacitor.isPluginAvailable('InAppReview')) {
      console.warn('[Review] InAppReview plugin not available');
      return false;
    }
    
    const { InAppReview } = await import('@capacitor-community/in-app-review');
    await InAppReview.requestReview();
    console.log('[Review] ✓ Force review requested');
    return true;
  } catch (error) {
    console.error('[Review] Error requesting review:', error);
    return false;
  }
}
