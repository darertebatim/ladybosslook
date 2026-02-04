/**
 * Push Notifications Service - STUBBED (Capacitor removed)
 * 
 * All functions return safe defaults.
 * Capacitor will be added back incrementally to identify the black screen cause.
 */

import { supabase } from '@/integrations/supabase/client';

export type NotificationPermission = 'granted' | 'denied' | 'default';

// Navigation callback for deep linking (no-op)
let navigationCallback: ((url: string) => void) | null = null;

export function registerNavigationCallback(callback: (url: string) => void) {
  navigationCallback = callback;
  console.log('[Push] Navigation callback registered (stubbed)');
}

export async function initializePushNotificationHandlers() {
  console.log('[Push] Handlers initialization skipped (Capacitor removed)');
}

export async function clearBadge(): Promise<void> {
  // No-op
}

export async function getBadgeCount(): Promise<number> {
  return 0;
}

export async function checkPermissionStatus(): Promise<NotificationPermission> {
  return 'default';
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  return 'default';
}

export async function subscribeToPushNotifications(userId: string): Promise<{ success: boolean; error?: string }> {
  console.log('[Push] Subscribe skipped (Capacitor removed)');
  return { success: false, error: 'Not supported on this platform' };
}

export async function unsubscribeFromPushNotifications(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('[Push] Error removing subscription:', error);
      return { success: false, error: error.message };
    }

    console.log('[Push] Unsubscribed successfully');
    return { success: true };
  } catch (error: any) {
    console.error('[Push] Unexpected error:', error);
    return { success: false, error: error.message || 'Failed to unsubscribe' };
  }
}

export async function getRegistrationStatus(): Promise<{
  isRegistered: boolean;
  permission: NotificationPermission;
  deviceCount: number;
}> {
  return { isRegistered: false, permission: 'denied', deviceCount: 0 };
}

export async function refreshDeviceToken(userId: string): Promise<void> {
  // No-op
}
