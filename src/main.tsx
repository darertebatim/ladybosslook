import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Capacitor } from '@capacitor/core';
import { initializePushNotificationHandlers, clearBadge } from './lib/pushNotifications';
import { logBuildInfo } from './lib/buildInfo';
import { initAppsFlyer, logAppsFlyerEvent } from './lib/appsflyer';
import { captureInstructorFromUrl } from './hooks/useInstructorOnboarding';
import './i18n';

// Global error handler to catch any uncaught errors
window.onerror = (message, source, lineno, colno, error) => {
  console.error('[FATAL]', message, source, lineno, colno, error);
};

// Log build info immediately on app start
logBuildInfo();

// Capture ?instructor=slug from the URL before anything else (web fallback for AppsFlyer)
try { captureInstructorFromUrl(); } catch { /* ignore */ }

/**
 * Hardened native initialization - uses dynamic imports and availability checks
 * to prevent crashes from plugin failures
 */
async function initializeNative() {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Main] 🌐 Web platform detected');
    return;
  }
  
  console.log('[Main] 📱 Native platform detected:', Capacitor.getPlatform());
  
  // Add native-app class to html for iOS scroll containment
  document.documentElement.classList.add('native-app');
  
  // StatusBar - reactive sync that mirrors the app's light/dark theme
  // so the clock/battery/wifi icons stay legible in both modes.
  try {
    const { startStatusBarThemeSync } = await import('@/lib/statusBarSync');
    startStatusBarThemeSync();
    console.log('[Main] ✓ StatusBar theme sync started');
  } catch (e) {
    console.warn('[Main] StatusBar init failed:', e);
  }
  
  // SplashScreen - with availability check
  try {
    if (Capacitor.isPluginAvailable('SplashScreen')) {
      const { SplashScreen } = await import('@capacitor/splash-screen');
      await SplashScreen.hide();
      console.log('[Main] ✓ SplashScreen hidden');
    }
  } catch (e) {
    console.warn('[Main] SplashScreen init failed:', e);
  }
  
  // Push notifications - already has internal safety
  try {
    initializePushNotificationHandlers();
    // Delay badge clearing to ensure push registration completes first
    setTimeout(() => clearBadge(), 3000);
    console.log('[Main] ✓ Push handlers initialized');
  } catch (e) {
    console.warn('[Main] Push init failed:', e);
  }
  
  // AppsFlyer SDK
  try {
    await initAppsFlyer();
  } catch (e) {
    console.warn('[Main] AppsFlyer init failed:', e);
  }

  // App lifecycle events (via AppsFlyer)
  try {
    const FIRST_OPEN_KEY = 'rilo_app_first_open_logged';
    if (!localStorage.getItem(FIRST_OPEN_KEY)) {
      await logAppsFlyerEvent('app_first_open');
      localStorage.setItem(FIRST_OPEN_KEY, '1');
    }
    await logAppsFlyerEvent('app_open');
  } catch (e) {
    console.warn('[Main] App lifecycle event failed:', e);
  }

  // Pre-warm native audio plugin so first play is instant
  try {
    const { nativeAudioWarmUp } = await import('./lib/nativeAudioControls');
    await nativeAudioWarmUp();
    console.log('[Main] ✓ Native audio pre-warmed');
  } catch (e) {
    console.warn('[Main] Native audio warm-up failed:', e);
  }
}

// Initialize native features (non-blocking)
initializeNative().catch(console.error);

// Render React app
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
