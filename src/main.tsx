import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Capacitor } from '@capacitor/core';
import { initializePushNotificationHandlers, clearBadge } from './lib/pushNotifications';
import { logBuildInfo } from './lib/buildInfo';

// Log build info immediately on app start
logBuildInfo();

// Initialize Capacitor native features
if (Capacitor.isNativePlatform()) {
  console.log('[Main] 📱 Native platform detected:', Capacitor.getPlatform());
  
  // Add native-app class to html for iOS scroll containment
  document.documentElement.classList.add('native-app');
  
  // Safe async initialization with dynamic imports
  (async () => {
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ style: Style.Dark });
      console.log('[Main] ✅ StatusBar initialized');
    } catch (e) {
      console.warn('[Main] ⚠️ StatusBar init failed:', e);
    }
    
    try {
      const { SplashScreen } = await import('@capacitor/splash-screen');
      await SplashScreen.hide();
      console.log('[Main] ✅ SplashScreen hidden');
    } catch (e) {
      console.warn('[Main] ⚠️ SplashScreen init failed:', e);
    }
    
    // Initialize push notification handlers
    initializePushNotificationHandlers();
    
    // Clear badge when app opens
    clearBadge();
  })();
} else {
  console.log('[Main] 🌐 Web platform detected');
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
