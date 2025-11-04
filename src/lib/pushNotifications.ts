import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

const VAPID_PUBLIC_KEY = 'BAri-GDjcQmDuVrGZnXHG1YhsXfpaKbB5VGZpATGVBkYhpJszSG36cjbXiUahGAgvAamJayRgq5EXThyILzbF7Y';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function checkPermissionStatus(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.error('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

export async function subscribeToPushNotifications(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[Push] Starting subscription process for user:', userId);
    
    // Use native push notifications on native platforms
    if (Capacitor.isNativePlatform()) {
      console.log('[Push] Using native push notifications');
      
      const permResult = await PushNotifications.checkPermissions();
      if (permResult.receive === 'granted') {
        await PushNotifications.register();
        
        // Listen for registration
        PushNotifications.addListener('registration', async (token) => {
          console.log('[Push] Native token received:', token.value);
          
          // Save native token to database
          const { error } = await supabase.from('push_subscriptions').upsert({
            user_id: userId,
            endpoint: `native:${token.value}`,
            p256dh_key: '',
            auth_key: '',
          }, {
            onConflict: 'user_id,endpoint'
          });
          
          if (error) {
            console.error('[Push] Error saving native subscription:', error);
          }
        });
        
        return { success: true };
      } else {
        throw new Error('Push notification permission not granted');
      }
    }
    
    // Web push notifications for PWA/web
    if (!('serviceWorker' in navigator)) {
      console.error('[Push] Service Workers not supported');
      throw new Error('Service Workers are not supported in your browser');
    }
    
    if (!('PushManager' in window)) {
      console.error('[Push] Push notifications not supported');
      throw new Error('Push notifications are not supported. On iOS, you need iOS 16.4+ and the app must be installed to your home screen.');
    }

    console.log('[Push] Waiting for service worker...');
    const registration = await navigator.serviceWorker.ready;
    console.log('[Push] Service worker ready:', registration);
    
    console.log('[Push] Subscribing to push manager...');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });

    console.log('[Push] Subscription created:', subscription);
    const subscriptionJSON = subscription.toJSON();
    console.log('[Push] Subscription JSON:', subscriptionJSON);

    // Save subscription to database
    console.log('[Push] Saving to database...');
    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: userId,
      endpoint: subscriptionJSON.endpoint || '',
      p256dh_key: subscriptionJSON.keys?.p256dh || '',
      auth_key: subscriptionJSON.keys?.auth || '',
    }, {
      onConflict: 'user_id,endpoint'
    });

    if (error) {
      console.error('[Push] Error saving subscription to database:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('[Push] Subscription saved successfully!');
    return { success: true };
  } catch (error: any) {
    console.error('[Push] Error during subscription:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to subscribe to push notifications'
    };
  }
}

export async function unsubscribeFromPushNotifications(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
    }

    // Remove from database
    const { error } = await supabase
      .from('push_subscriptions' as any)
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing subscription:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error unsubscribing from push notifications:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to unsubscribe from push notifications'
    };
  }
}
