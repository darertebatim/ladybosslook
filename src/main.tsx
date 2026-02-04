import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Capacitor } from '@capacitor/core';
import { initializePushNotificationHandlers, clearBadge } from './lib/pushNotifications';
import { logBuildInfo } from './lib/buildInfo';
if (Capacitor.isNativePlatform()) {
  console.log('[Main] 📱 Native platform detected:', Capacitor.getPlatform());
  
  // Add native-app class to html for iOS scroll containment
  document.documentElement.classList.add('native-app');
  
  // Dynamically import StatusBar with error handling (prevents crash if plugin unavailable)
  import('@capacitor/status-bar')
    .then(({ StatusBar, Style }) => {
      StatusBar.setStyle({ style: Style.Dark }).catch(console.error);
    })
    .catch((e) => console.warn('[Main] StatusBar plugin not available:', e));
  
  // Dynamically import SplashScreen with error handling (prevents crash if plugin unavailable)
  import('@capacitor/splash-screen')
    .then(({ SplashScreen }) => {
      SplashScreen.hide().catch(console.error);
    })
    .catch((e) => console.warn('[Main] SplashScreen plugin not available:', e));
  
  // Initialize push notification handlers (async, won't block app load)
  initializePushNotificationHandlers().catch(console.error);
  
  // Clear badge when app opens (async, won't block app load)
  clearBadge().catch(console.error);
} else {
  console.log('[Main] 🌐 Web platform detected');
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
