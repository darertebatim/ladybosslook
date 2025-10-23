import { supabase } from '@/integrations/supabase/client';

const VAPID_PUBLIC_KEY = 'BMQaNgdxdaTzhGYI8EfbZv2LfHmVqgle9OngNEhN8unj5DbvKAh3M1GEIJkYNifKATNcbtB2OsYR9dyYHLFvJNE';

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

export async function subscribeToPushNotifications(userId: string): Promise<boolean> {
  try {
    console.log('[Push] Starting subscription process for user:', userId);
    
    if (!('serviceWorker' in navigator)) {
      console.error('[Push] Service Workers not supported');
      throw new Error('Service Workers not supported');
    }
    
    if (!('PushManager' in window)) {
      console.error('[Push] Push notifications not supported');
      throw new Error('Push notifications not supported');
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
    const { error } = await supabase.from('push_subscriptions').insert({
      user_id: userId,
      endpoint: subscriptionJSON.endpoint || '',
      p256dh_key: subscriptionJSON.keys?.p256dh || '',
      auth_key: subscriptionJSON.keys?.auth || '',
    });

    if (error) {
      console.error('[Push] Error saving subscription to database:', error);
      throw error;
    }

    console.log('[Push] Subscription saved successfully!');
    return true;
  } catch (error) {
    console.error('[Push] Error during subscription:', error);
    return false;
  }
}

export async function unsubscribeFromPushNotifications(userId: string): Promise<boolean> {
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
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return false;
  }
}
