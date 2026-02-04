import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Capacitor } from '@capacitor/core';
import { initializePushNotificationHandlers, clearBadge } from './lib/pushNotifications';
import { logBuildInfo } from './lib/buildInfo';

// Global error handler to catch any uncaught errors
window.onerror = (message, source, lineno, colno, error) => {
  console.error('[FATAL]', message, source, lineno, colno, error);
  const errorDiv = document.getElementById('error-display');
  if (errorDiv) {
    errorDiv.style.display = 'block';
    errorDiv.textContent = `Error: ${message}`;
  }
};

// Log build info immediately on app start
logBuildInfo();

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
  
  // StatusBar - with availability check
  try {
    if (Capacitor.isPluginAvailable('StatusBar')) {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ style: Style.Dark });
      console.log('[Main] ✓ StatusBar configured');
    }
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
    clearBadge();
    console.log('[Main] ✓ Push handlers initialized');
  } catch (e) {
    console.warn('[Main] Push init failed:', e);
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
