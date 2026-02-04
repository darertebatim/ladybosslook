import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

export type NotificationPermission = 'granted' | 'denied' | 'default';

/**
 * Push Notifications Service
 * 
 * IMPORTANT: The @capacitor/push-notifications plugin is dynamically imported
 * to prevent app crashes if the native bridge is misconfigured.
 * This ensures the app still loads even if push notifications fail to initialize.
 */

// Lazy-loaded plugin reference
let PushNotificationsPlugin: typeof import('@capacitor/push-notifications').PushNotifications | null = null;

// Initialize plugin on demand
async function getPlugin() {
  if (!PushNotificationsPlugin && Capacitor.isNativePlatform()) {
    try {
      if (!Capacitor.isPluginAvailable('PushNotifications')) {
        console.warn('[Push] Native plugin not available (PushNotifications).');
        return null;
      }
      const module = await import('@capacitor/push-notifications');
      PushNotificationsPlugin = module.PushNotifications;
      console.log('[Push] Plugin loaded successfully');
    } catch (error) {
      console.error('[Push] Failed to load plugin:', error);
    }
  }
  return PushNotificationsPlugin;
}

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
    window.location.href = url;
  }
}

// Initialize push notification handlers (Phases 2-3: All app states + Deep linking)
export async function initializePushNotificationHandlers() {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Push] Not on native platform, skipping handler initialization');
    return;
  }

  if (!Capacitor.isPluginAvailable('PushNotifications')) {
    console.warn('[Push] PushNotifications plugin is not available on this build; skipping init.');
    return;
  }

  try {
    const plugin = await getPlugin();
    if (!plugin) {
      console.warn('[Push] Plugin not available, skipping handler initialization');
      return;
    }

    console.log('[Push] 🚀 Initializing notification handlers for ALL states (foreground, background, closed)');

    // Phase 5: Clear badge when app opens
    await clearBadge();

    // ========================================
    // FOREGROUND: When app is open and active
    // ========================================
    await plugin.addListener('pushNotificationReceived', (notification) => {
      console.log('[Push] 📱 FOREGROUND notification received:', {
        title: notification.title,
        body: notification.body,
        data: notification.data,
        id: notification.id,
      });

      // Show in-app toast with action button if URL provided
      toast(notification.title || 'New Notification', {
        description: notification.body || '',
        duration: 5000,
        action: (notification.data?.url || notification.data?.destination_url)
          ? {
              label: 'View',
              onClick: () => {
                const url = (notification.data?.url || notification.data?.destination_url) as string;
                console.log('[Push] Toast action clicked, navigating to:', url);
                handleDeepLink(url);
                clearBadge().catch((e) => console.error('[Push] clearBadge failed:', e));
              },
            }
          : undefined,
      });
    });

    // ========================================
    // BACKGROUND/CLOSED: When notification is tapped
    // ========================================
    await plugin.addListener('pushNotificationActionPerformed', (action) => {
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
      clearBadge().catch((e) => console.error('[Push] clearBadge failed:', e));

      const data = action.notification.data;
      const destinationUrl = (data?.url || data?.destination_url) as string | undefined;

      if (destinationUrl) {
        console.log('[Push] 🎯 Deep linking to:', destinationUrl);
        setTimeout(() => handleDeepLink(destinationUrl), 500);
      } else {
        console.log('[Push] ℹ️ No deep link URL found, navigating to home');
        setTimeout(() => handleDeepLink('/app/home'), 500);
      }
    });

    console.log('[Push] ✅ Notification handlers initialized successfully');
  } catch (error) {
    // Critical: never allow plugin init to prevent app render.
    console.error('[Push] ❌ Failed to initialize push handlers (non-fatal):', error);
  }
}

// Phase 5: Clear badge count
export async function clearBadge(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  
  const plugin = await getPlugin();
  if (!plugin) return;
  
  try {
    await plugin.removeAllDeliveredNotifications();
    console.log('[Push] 🔔 Badge cleared and notification center cleared');
  } catch (error) {
    console.error('[Push] ❌ Error clearing badge:', error);
  }
}

// Phase 5: Get current badge count (iOS only)
export async function getBadgeCount(): Promise<number> {
  if (!Capacitor.isNativePlatform()) return 0;
  
  const plugin = await getPlugin();
  if (!plugin) return 0;
  
  try {
    const result = await plugin.getDeliveredNotifications();
    const count = result.notifications.length;
    console.log('[Push] 🔔 Current badge count:', count);
    return count;
  } catch (error) {
    console.error('[Push] ❌ Error getting badge count:', error);
    return 0;
  }
}

export async function checkPermissionStatus(): Promise<NotificationPermission> {
  if (!Capacitor.isNativePlatform()) return 'default';
  
  const plugin = await getPlugin();
  if (!plugin) return 'default';
  
  try {
    const permStatus = await plugin.checkPermissions();
    if (permStatus.receive === 'granted') return 'granted';
    if (permStatus.receive === 'denied') return 'denied';
    return 'default';
  } catch (error) {
    console.error('[Push] Error checking permissions:', error);
    return 'default';
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!Capacitor.isNativePlatform()) return 'default';
  
  const plugin = await getPlugin();
  if (!plugin) return 'default';
  
  try {
    const permStatus = await plugin.requestPermissions();
    if (permStatus.receive === 'granted') return 'granted';
    if (permStatus.receive === 'denied') return 'denied';
    return 'default';
  } catch (error) {
    console.error('[Push] Error requesting permissions:', error);
    return 'denied';
  }
}

// Track if registration is in progress to prevent duplicate calls
let isRegistering = false;

export async function subscribeToPushNotifications(userId: string): Promise<{ success: boolean; error?: string }> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Push] Not a native platform, skipping subscribe');
    return { success: false, error: 'Not supported on this platform' };
  }

  const plugin = await getPlugin();
  if (!plugin) {
    return { success: false, error: 'Push notifications not available' };
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
    const { data: existingSub } = await supabase
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

    return new Promise(async (resolve) => {
      let handled = false;
      
      const timeout = setTimeout(() => {
        if (handled) return;
        handled = true;
        isRegistering = false;
        console.log('[Push] ❌ Timeout after 15s (no registration / error event received)');
        resolve({ success: false, error: 'Registration timeout' });
      }, 15000);

      const onSuccess = await plugin.addListener('registration', async (token) => {
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
            { onConflict: 'user_id,endpoint' }
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

      const onError = await plugin.addListener('registrationError', (error) => {
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
      try {
        plugin.register();
      } catch (e) {
        console.error('[Push] ❌ register() threw (non-fatal):', e);
      }
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
  if (!Capacitor.isNativePlatform()) return;

  if (!Capacitor.isPluginAvailable('PushNotifications')) {
    console.warn('[Push] PushNotifications plugin not available; skipping token refresh.');
    return;
  }

  const plugin = await getPlugin();
  if (!plugin) return;

  const permission = await checkPermissionStatus();
  if (permission !== 'granted') {
    console.log('[Push] Permission not granted, skipping token refresh');
    return;
  }

  console.log('[Push] 🔄 Refreshing device token on app startup...');

  try {
    const result = await new Promise<{ success: boolean; token?: string }>((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ success: false });
      }, 10000);

      // Wrap listener registration so a missing native bridge can't crash startup.
      (async () => {
        try {
          await plugin.addListener('registration', async (token) => {
            clearTimeout(timeout);
            resolve({ success: true, token: token.value });
          });

          await plugin.addListener('registrationError', () => {
            clearTimeout(timeout);
            resolve({ success: false });
          });

          plugin.register();
        } catch (e) {
          clearTimeout(timeout);
          console.error('[Push] ❌ Failed to register listeners/register() (non-fatal):', e);
          resolve({ success: false });
        }
      })();
    });

    if (result.success && result.token) {
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
