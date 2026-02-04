import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import type { URLOpenListenerEvent } from '@capacitor/app';

/**
 * Hook to handle Universal Links (deep links) from iOS/Android
 * When a Universal Link is opened (e.g., https://ladybosslook.com/app/playlist/123),
 * this hook extracts the path and navigates to it within the app.
 */
export function useDeepLinks() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      console.log('[DeepLinks] Not on native platform, skipping');
      return;
    }

    if (!Capacitor.isPluginAvailable('App')) {
      console.warn('[DeepLinks] App plugin not available, skipping');
      return;
    }

    console.log('[DeepLinks] 🔗 Initializing Universal Link handler');

    // Handle Universal Links when app is opened via a deep link
    const handleAppUrlOpen = (event: URLOpenListenerEvent) => {
      console.log('[DeepLinks] 📱 App opened with URL:', event.url);

      try {
        const url = new URL(event.url);
        const path = url.pathname;
        
        console.log('[DeepLinks] Extracted path:', path);
        console.log('[DeepLinks] Full URL details:', {
          protocol: url.protocol,
          host: url.host,
          pathname: url.pathname,
          search: url.search,
          hash: url.hash,
        });

        // Only handle paths that should open in the app
        if (path.startsWith('/app/') || path === '/app' || path.startsWith('/auth')) {
          const fullPath = path + url.search + url.hash;
          console.log('[DeepLinks] ✅ Navigating to:', fullPath);
          navigate(fullPath);
        } else {
          console.log('[DeepLinks] ⚠️ Path not configured for deep linking, ignoring:', path);
        }
      } catch (error) {
        console.error('[DeepLinks] ❌ Error parsing URL:', error);
      }
    };

    let listenerHandle: { remove: () => Promise<void> } | null = null;

    // Add listener for app URL open events
    (async () => {
      const { App } = await import('@capacitor/app');
      const listener = await App.addListener('appUrlOpen', handleAppUrlOpen);
      console.log('[DeepLinks] ✅ Listener registered');
      listenerHandle = listener;
    })().catch((e) => console.error('[DeepLinks] Listener init failed:', e));

    // Cleanup on unmount
    return () => {
      if (listenerHandle) {
        console.log('[DeepLinks] 🧹 Removing listener');
        listenerHandle.remove();
      }
    };
  }, [navigate]);
}

/**
 * Check if the app was opened with a Universal Link on cold start
 * This handles the case where the app was completely closed and opened via a link
 */
export async function checkInitialDeepLink(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  if (!Capacitor.isPluginAvailable('App')) {
    return null;
  }

  try {
    const { App } = await import('@capacitor/app');
    const launchUrl = await App.getLaunchUrl();
    
    if (launchUrl?.url) {
      console.log('[DeepLinks] 🚀 App launched with URL:', launchUrl.url);
      
      const url = new URL(launchUrl.url);
      const path = url.pathname;
      
      if (path.startsWith('/app/') || path === '/app' || path.startsWith('/auth')) {
        const fullPath = path + url.search + url.hash;
        console.log('[DeepLinks] ✅ Initial deep link path:', fullPath);
        return fullPath;
      }
    }
    
    return null;
  } catch (error) {
    console.error('[DeepLinks] ❌ Error checking launch URL:', error);
    return null;
  }
}
