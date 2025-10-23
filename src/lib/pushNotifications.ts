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
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.error('Push notifications not supported');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any,
    });

    const subscriptionJSON = subscription.toJSON();

    // Save subscription to database (table will be created via migration)
    const { error } = await supabase.from('push_subscriptions' as any).insert({
      user_id: userId,
      endpoint: subscriptionJSON.endpoint || '',
      p256dh_key: subscriptionJSON.keys?.p256dh || '',
      auth_key: subscriptionJSON.keys?.auth || '',
    });

    if (error) {
      console.error('Error saving subscription:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
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
