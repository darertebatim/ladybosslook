import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { initializePushNotificationHandlers, clearBadge } from './lib/pushNotifications';
import { logBuildInfo } from './lib/buildInfo';

// Log build info immediately on app start
logBuildInfo();

// Initialize Capacitor native features
if (Capacitor.isNativePlatform()) {
  console.log('[Main] 📱 Native platform detected:', Capacitor.getPlatform());
  
  // Add native-app class to html for iOS scroll containment
  document.documentElement.classList.add('native-app');
  
  StatusBar.setStyle({ style: Style.Dark }).catch(console.error);
  SplashScreen.hide().catch(console.error);
  
  // Initialize push notification handlers
  initializePushNotificationHandlers();
  
  // Clear badge when app opens
  clearBadge();
} else {
  console.log('[Main] 🌐 Web platform detected');
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
