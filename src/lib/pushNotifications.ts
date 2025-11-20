import { supabase } from '@/integrations/supabase/client';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { toast } from '@/hooks/use-toast';

export type NotificationPermission = 'granted' | 'denied' | 'default';

// Initialize push notification handlers (Phase 3)
export function initializePushNotificationHandlers() {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Push] Not on native platform, skipping handler initialization');
    return;
  }

  console.log('[Push] Initializing notification handlers');

  // Handle notification received while app is in foreground
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('[Push] Notification received in foreground:', notification);
    
    toast({
      title: notification.title || 'New Notification',
      description: notification.body || '',
    });
  });

  // Handle notification clicked (app opened from notification)
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('[Push] Notification clicked:', action);
    
    const url = action.notification.data?.url || '/app/home';
    console.log('[Push] Navigating to:', url);
    
    // Deep link navigation
    if (typeof window !== 'undefined') {
      window.location.href = url;
    }
  });

  console.log('[Push] Notification handlers initialized successfully');
}

// Clear badge count (Phase 6)
export async function clearBadge(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      // iOS automatically clears badge when app is opened
      // but we can also manually clear it
      console.log('[Push] Badge cleared');
    } catch (error) {
      console.error('[Push] Error clearing badge:', error);
    }
  }
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
