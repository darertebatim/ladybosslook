import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { isDefinitelyNative } from './platform';

export async function trackPWAInstallation(userId: string): Promise<{ success: boolean; error?: string }> {
  // CRITICAL: Never track PWA installations on native platforms
  if (isDefinitelyNative() || Capacitor.isNativePlatform()) {
    console.log('[PWA Tracking] Skipping - running on native platform');
    return { success: false, error: 'Not applicable on native platform' };
  }

  try {
    console.log('[PWA Tracking] Recording installation for user:', userId);
    
    const userAgent = navigator.userAgent;
    const platform = navigator.platform || 'unknown';
    
    const { error } = await supabase
      .from('pwa_installations')
      .upsert({
        user_id: userId,
        user_agent: userAgent,
        platform: platform,
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('[PWA Tracking] Error saving installation:', error);
      return { success: false, error: error.message };
    }

    console.log('[PWA Tracking] Installation recorded successfully');
    return { success: true };
  } catch (error: any) {
    console.error('[PWA Tracking] Unexpected error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to track PWA installation'
    };
  }
}

export function isPWAInstalled(): boolean {
  // Never report as PWA on native platforms
  if (isDefinitelyNative() || Capacitor.isNativePlatform()) {
    return false;
  }
  return window.matchMedia('(display-mode: standalone)').matches;
}
