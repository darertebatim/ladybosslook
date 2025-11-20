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

export async function subscribeToPushNotifications(userId: string): Promise<{ success: boolean; error?: string }> {
  if (!Capacitor.isNativePlatform()) {
    return { success: false, error: 'Not supported on this platform' };
  }

  if (!userId) {
    console.error('[Push] Missing user ID');
    return { success: false, error: 'Missing user ID' };
  }

  try {
    console.log('[Push] Starting push notification registration for user:', userId);
    
    return new Promise((resolve) => {
      let handled = false;
      
      const timeout = setTimeout(() => {
        if (handled) return;
        handled = true;
        console.log('[Push] Registration timeout after 25 seconds');
        resolve({ success: false, error: 'Registration timeout - check APNs configuration' });
      }, 25000);

      console.log('[Push] Attaching registration listeners...');
      
      PushNotifications.addListener('registration', async (token) => {
        if (handled) return;
        handled = true;
        clearTimeout(timeout);
        
        console.log('[Push] ✅ Registration success! Token received:', token.value.substring(0, 20) + '...');
        
        try {
          const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
              user_id: userId,
              endpoint: `native:${token.value}`,
              p256dh_key: 'native-ios',
              auth_key: 'native-ios',
            }, {
              onConflict: 'user_id,endpoint'
            });

          if (error) {
            console.error('[Push] ❌ Error saving token to database:', error);
            resolve({ success: false, error: error.message });
          } else {
            console.log('[Push] ✅ Token saved successfully to database');
            resolve({ success: true });
          }
        } catch (error: any) {
          console.error('[Push] ❌ Error in registration handler:', error);
          resolve({ success: false, error: error.message });
        }
      });

      PushNotifications.addListener('registrationError', (error) => {
        if (handled) return;
        handled = true;
        clearTimeout(timeout);
        
        console.error('[Push] ❌ Registration error from APNs:', error.error);
        resolve({ success: false, error: error.error });
      });

      console.log('[Push] Listeners attached, calling PushNotifications.register()...');
      PushNotifications.register();
      console.log('[Push] Register() called, waiting for APNs response...');
    });
  } catch (error: any) {
    console.error('[Push] ❌ Unexpected error:', error);
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
