import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { App } from '@capacitor/app';

const LAST_REVIEW_KEY = 'app_last_review_prompt';
const REVIEW_COOLDOWN_DAYS = 30;

function currentPlatform(): 'ios' | 'android' | 'web' {
  const p = Capacitor.getPlatform();
  if (p === 'ios') return 'ios';
  if (p === 'android') return 'android';
  return 'web';
}

async function logReviewPrompt(opts: {
  success: boolean;
  forced: boolean;
  trigger?: string;
  errorMessage?: string;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    let appVersion: string | undefined;
    try {
      if (Capacitor.isNativePlatform()) {
        const info = await App.getInfo();
        appVersion = info.version;
      }
    } catch {}
    await supabase.from('app_review_prompts').insert({
      user_id: user.id,
      platform: currentPlatform(),
      trigger_source: opts.trigger ?? null,
      success: opts.success,
      forced: opts.forced,
      app_version: appVersion ?? null,
      error_message: opts.errorMessage ?? null,
    });
  } catch (e) {
    console.warn('[Review] Failed to log prompt', e);
  }
}

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
 * Android: Google's In-App Review API is system-throttled and silently
 * no-ops on debug builds. Real prompts only appear via Play Store / internal track.
 */
export async function requestAppReview(trigger?: string): Promise<boolean> {
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
      await logReviewPrompt({ success: false, forced: false, trigger, errorMessage: 'plugin_unavailable' });
      return false;
    }
    
    const { InAppReview } = await import('@capacitor-community/in-app-review');
    await InAppReview.requestReview();
    
    // Record that we requested a review
    localStorage.setItem(LAST_REVIEW_KEY, new Date().toISOString());
    console.log('[Review] ✓ Review requested successfully');
    await logReviewPrompt({ success: true, forced: false, trigger });
    return true;
  } catch (error) {
    console.error('[Review] Error requesting review:', error);
    await logReviewPrompt({
      success: false,
      forced: false,
      trigger,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Force request a review (for testing purposes only)
 * Bypasses the cooldown check
 */
export async function forceRequestReview(trigger: string = 'admin_test'): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Review] Skipping - not native platform');
    return false;
  }
  
  try {
    if (!Capacitor.isPluginAvailable('InAppReview')) {
      console.warn('[Review] InAppReview plugin not available');
      await logReviewPrompt({ success: false, forced: true, trigger, errorMessage: 'plugin_unavailable' });
      return false;
    }
    
    const { InAppReview } = await import('@capacitor-community/in-app-review');
    await InAppReview.requestReview();
    console.log('[Review] ✓ Force review requested');
    await logReviewPrompt({ success: true, forced: true, trigger });
    return true;
  } catch (error) {
    console.error('[Review] Error requesting review:', error);
    await logReviewPrompt({
      success: false,
      forced: true,
      trigger,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
