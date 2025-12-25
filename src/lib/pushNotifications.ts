import { supabase } from '@/integrations/supabase/client';
import { PushNotifications, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { toast as shadcnToast } from '@/hooks/use-toast';
import { toast } from 'sonner';

export type NotificationPermission = 'granted' | 'denied' | 'default';

// Navigation callback for deep linking
let navigationCallback: ((url: string) => void) | null = null;

// Register navigation callback from React Router
export function registerNavigationCallback(callback: (url: string) => void) {
  navigationCallback = callback;
  console.log('[Push] ✅ Navigation callback registered');
}

// Helper function to handle deep linking
function handleDeepLink(url: string) {
  console.log('[Push] 🔗 Handling deep link:', url);
  
  if (navigationCallback) {
    console.log('[Push] Using navigation callback');
    navigationCallback(url);
  } else {
    console.log('[Push] No navigation callback, using window.location');
    // Fallback to direct navigation
    window.location.href = url;
  }
}

// Initialize push notification handlers (Phases 2-3: All app states + Deep linking)
export function initializePushNotificationHandlers() {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Push] Not on native platform, skipping handler initialization');
    return;
  }

  console.log('[Push] 🚀 Initializing notification handlers for ALL states (foreground, background, closed)');

  // Phase 5: Clear badge when app opens
  clearBadge();

  // ========================================
  // FOREGROUND: When app is open and active
  // ========================================
  PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
    console.log('[Push] 📱 FOREGROUND notification received:', {
      title: notification.title,
      body: notification.body,
      data: notification.data,
      id: notification.id,
    });
    
    // Phase 5: Badge count is managed by iOS automatically for foreground notifications
    // iOS doesn't increment badge for foreground notifications, so no action needed
    
    // Show in-app toast with action button if URL provided
    toast(notification.title || 'New Notification', {
      description: notification.body || '',
      duration: 5000,
      action: (notification.data?.url || notification.data?.destination_url) ? {
        label: 'View',
        onClick: () => {
          const url = (notification.data?.url || notification.data?.destination_url) as string;
          console.log('[Push] Toast action clicked, navigating to:', url);
          handleDeepLink(url);
          // Phase 5: Clear badge when user interacts with notification
          clearBadge();
        },
      } : undefined,
    });
  });

  // ========================================
  // BACKGROUND/CLOSED: When notification is tapped
  // ========================================
  PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
    console.log('[Push] 🔔 Notification ACTION performed (background/closed):', {
      actionId: action.actionId,
      inputValue: action.inputValue,
      notification: {
        id: action.notification.id,
        title: action.notification.title,
        body: action.notification.body,
        data: action.notification.data,
      },
    });
    
    // Phase 5: Clear badge when notification is tapped
    clearBadge();
    
    const data = action.notification.data;
    
    // Extract URL from data (check multiple possible keys)
    const destinationUrl = (data?.url || data?.destination_url) as string | undefined;
    
    if (destinationUrl) {
      console.log('[Push] 🎯 Deep linking to:', destinationUrl);
      
      // Small delay to ensure app is fully loaded
      setTimeout(() => {
        handleDeepLink(destinationUrl);
      }, 500);
    } else {
      console.log('[Push] ℹ️ No deep link URL found in notification data, navigating to home');
      
      // Navigate to home if no specific URL
      setTimeout(() => {
        handleDeepLink('/app/home');
      }, 500);
    }
  });

  console.log('[Push] ✅ Notification handlers initialized successfully');
  console.log('[Push] ✓ Foreground handler: Shows toast with action button');
  console.log('[Push] ✓ Background/Closed handler: Deep links to content');
  console.log('[Push] ✓ Deep linking: Ready for navigation');
  console.log('[Push] ✓ Badge management: Auto-clear on app open and notification tap');
}

// Phase 5: Clear badge count
export async function clearBadge(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      // Remove all delivered notifications from notification center
      // This also clears the badge count on iOS
      await PushNotifications.removeAllDeliveredNotifications();
      console.log('[Push] 🔔 Badge cleared and notification center cleared');
    } catch (error) {
      console.error('[Push] ❌ Error clearing badge:', error);
    }
  }
}

// Phase 5: Get current badge count (iOS only)
export async function getBadgeCount(): Promise<number> {
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await PushNotifications.getDeliveredNotifications();
      const count = result.notifications.length;
      console.log('[Push] 🔔 Current badge count:', count);
      return count;
    } catch (error) {
      console.error('[Push] ❌ Error getting badge count:', error);
      return 0;
    }
  }
  return 0;
}

export async function checkPermissionStatus(): Promise<NotificationPermission> {
  if (Capacitor.isNativePlatform()) {
    const permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'granted') {
      return 'granted';
    } else if (permStatus.receive === 'denied') {
      return 'denied';
    }
    return 'default';
  }
  
  return 'default';
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (Capacitor.isNativePlatform()) {
    try {
      const permStatus = await PushNotifications.requestPermissions();
      if (permStatus.receive === 'granted') {
        return 'granted';
      } else if (permStatus.receive === 'denied') {
        return 'denied';
      }
      return 'default';
    } catch (error) {
      console.error('[Push] Error requesting permissions:', error);
      return 'denied';
    }
  }
  
  return 'default';
}

// Track if registration is in progress to prevent duplicate calls
let isRegistering = false;
let registrationListenersAttached = false;

// Attach global listeners once only
function attachRegistrationListeners() {
  if (registrationListenersAttached) {
    console.log('[Push] Listeners already attached, skipping');
    return;
  }
  
  console.log('[Push] Attaching global registration listeners');
  registrationListenersAttached = true;
  
  PushNotifications.addListener('registration', (token) => {
    console.log('[Push] ✅ Token received:', token.value.substring(0, 20) + '...');
  });

  PushNotifications.addListener('registrationError', (error) => {
    console.error('[Push] ❌ APNs error:', error.error);
  });
}

export async function subscribeToPushNotifications(userId: string): Promise<{ success: boolean; error?: string }> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Push] Not a native platform, skipping subscribe');
    return { success: false, error: 'Not supported on this platform' };
  }

  if (!userId) {
    console.error('[Push] Missing user ID');
    return { success: false, error: 'Missing user ID' };
  }

  if (isRegistering) {
    console.log('[Push] Registration already in progress, ignoring new request');
    return { success: false, error: 'Registration already in progress' };
  }

  try {
    isRegistering = true;
    console.log('[Push] Starting registration for user:', userId);
    
    // Check if user already has an active native subscription
    const { data: existingSub, error: subError } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (existingSub && existingSub.endpoint?.startsWith('native:')) {
      console.log('[Push] ✅ Existing native subscription found, skipping APNs register()');
      isRegistering = false;
      return { success: true };
    }
    
    // Check permission status before attempting registration
    const permission = await checkPermissionStatus();
    console.log('[Push] Current permission before register:', permission);
    
    if (permission === 'denied') {
      console.log('[Push] ❌ Permission denied, cannot register');
      isRegistering = false;
      return { success: false, error: 'Permission denied' };
    }

    // Attach only per-attempt listeners to avoid any hidden complexity
    let handled = false;

    return new Promise(async (resolve) => {
      const timeout = setTimeout(() => {
        if (handled) return;
        handled = true;
        isRegistering = false;
        console.log('[Push] ❌ Timeout after 15s (no registration / error event received)');
        resolve({ success: false, error: 'Registration timeout' });
      }, 15000);

      const onSuccess = await PushNotifications.addListener('registration', async (token) => {
        if (handled) return;
        handled = true;
        clearTimeout(timeout);
        onSuccess.remove();
        onError.remove();

        console.log('[Push] ✅ Token received from APNs:', token.value.substring(0, 20) + '...');
        console.log('[Push] Saving token to database...');

        const { error } = await supabase
          .from('push_subscriptions')
          .upsert(
            {
              user_id: userId,
              endpoint: `native:${token.value}`,
              p256dh_key: 'native-ios',
              auth_key: 'native-ios',
            },
            {
              onConflict: 'user_id,endpoint',
            }
          );

        isRegistering = false;

        if (error) {
          console.error('[Push] ❌ Database error while saving token:', error);
          resolve({ success: false, error: 'Failed to save token' });
        } else {
          console.log('[Push] ✅ Token saved successfully');
          resolve({ success: true });
        }
      });

      const onError = await PushNotifications.addListener('registrationError', (error) => {
        if (handled) return;
        handled = true;
        clearTimeout(timeout);
        onSuccess.remove();
        onError.remove();
        isRegistering = false;

        console.error('[Push] ❌ APNs registration error:', error.error ?? error);
        resolve({ success: false, error: error.error || 'APNs registration failed' });
      });

      console.log('[Push] Calling PushNotifications.register()');
      PushNotifications.register();
    });
  } catch (error: any) {
    isRegistering = false;
    console.error('[Push] ❌ Exception during subscribeToPushNotifications:', error);
    return { success: false, error: error.message || 'Failed to subscribe' };
  }
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

// Get registration status - useful for UI states
export async function getRegistrationStatus(): Promise<{
  isRegistered: boolean;
  permission: NotificationPermission;
  deviceCount: number;
}> {
  if (!Capacitor.isNativePlatform()) {
    return { isRegistered: false, permission: 'denied', deviceCount: 0 };
  }

  const permission = await checkPermissionStatus();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { isRegistered: false, permission, deviceCount: 0 };
  }

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('id')
    .eq('user_id', user.id);

  const deviceCount = subscriptions?.length || 0;
  const isRegistered = deviceCount > 0;

  console.log('[Push] Registration status:', { isRegistered, permission, deviceCount });
  return { isRegistered, permission, deviceCount };
}

// Refresh device token on app startup - ensures tokens stay valid
export async function refreshDeviceToken(userId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  const permission = await checkPermissionStatus();
  if (permission !== 'granted') {
    console.log('[Push] Permission not granted, skipping token refresh');
    return;
  }

  console.log('[Push] 🔄 Refreshing device token on app startup...');

  try {
    // Re-register to get fresh token from APNs
    const result = await new Promise<{ success: boolean; token?: string }>((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ success: false });
      }, 10000);

      PushNotifications.addListener('registration', async (token) => {
        clearTimeout(timeout);
        resolve({ success: true, token: token.value });
      });

      PushNotifications.addListener('registrationError', () => {
        clearTimeout(timeout);
        resolve({ success: false });
      });

      PushNotifications.register();
    });

    if (result.success && result.token) {
      // Upsert the token (will update if exists, insert if new)
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert(
          {
            user_id: userId,
            endpoint: `native:${result.token}`,
            p256dh_key: 'native-ios',
            auth_key: 'native-ios',
          },
          { onConflict: 'user_id,endpoint' }
        );

      if (error) {
        console.error('[Push] ❌ Failed to refresh token in database:', error);
      } else {
        console.log('[Push] ✅ Device token refreshed successfully');
      }
    }
  } catch (error) {
    console.error('[Push] ❌ Error refreshing device token:', error);
  }
}
