import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

// Initialize Capacitor native features
if (Capacitor.isNativePlatform()) {
  console.log('[Main] 🚀 Native platform detected');
  console.log('[Main] Platform:', Capacitor.getPlatform());
  console.log('[Main] Capacitor object exists:', typeof (window as any).Capacitor !== 'undefined');
  StatusBar.setStyle({ style: Style.Dark }).catch(console.error);
  SplashScreen.hide().catch(console.error);
} else {
  console.log('[Main] 🌐 Web platform detected');
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
