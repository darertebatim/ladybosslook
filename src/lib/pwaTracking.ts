import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { isDefinitelyNative } from './platform';

export async function trackPWAInstallation(userId: string): Promise<{ success: boolean; error?: string }> {
  // 🚨 NUCLEAR GUARD LAYER 1: Check global flag IMMEDIATELY
  if ((window as any).__IS_NATIVE_APP__ || (window as any).__PWA_DISABLED__) {
    console.log('[PWA Tracking] 🔐 NUCLEAR GUARD: Blocked by global flag');
    return { success: false, error: 'Not applicable on native platform' };
  }
  
  // LAYER 2: Use robust detection
  if (isDefinitelyNative() || Capacitor.isNativePlatform()) {
    console.log('[PWA Tracking] 🔐 NUCLEAR GUARD: Blocked by platform detection');
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
  // 🚨 NUCLEAR GUARD: Check global flag first
  if ((window as any).__IS_NATIVE_APP__ || (window as any).__PWA_DISABLED__) {
    return false;
  }
  
  if (isDefinitelyNative() || Capacitor.isNativePlatform()) {
    return false;
  }
  return window.matchMedia('(display-mode: standalone)').matches;
}
