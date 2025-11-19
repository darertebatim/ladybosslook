import { supabase } from '@/integrations/supabase/client';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export type NotificationPermission = 'granted' | 'denied' | 'default';

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

  try {
    console.log('[Push] Registering for native push notifications');
    
    await PushNotifications.register();
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('[Push] Registration timeout');
        resolve({ success: false, error: 'Registration timeout' });
      }, 10000);

      PushNotifications.addListener('registration', async (token) => {
        clearTimeout(timeout);
        console.log('[Push] Registration success, token:', token.value);
        
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
            console.error('[Push] Error saving token:', error);
            resolve({ success: false, error: error.message });
          } else {
            console.log('[Push] Token saved successfully');
            resolve({ success: true });
          }
        } catch (error: any) {
          console.error('[Push] Error in registration handler:', error);
          resolve({ success: false, error: error.message });
        }
      });

      PushNotifications.addListener('registrationError', (error) => {
        clearTimeout(timeout);
        console.error('[Push] Registration error:', error);
        resolve({ success: false, error: error.error });
      });
    });
  } catch (error: any) {
    console.error('[Push] Unexpected error:', error);
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
