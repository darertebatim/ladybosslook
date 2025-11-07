// Force GitHub sync - Nuclear Guard verification
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

// 🚨 NUCLEAR GUARD: Detect native platform IMMEDIATELY before anything else runs
const userAgent = navigator.userAgent;
const isIOSWebView = /iPhone|iPad|iPod/.test(userAgent) && /Mobile\//.test(userAgent) && !/Safari\//.test(userAgent);
const isAndroidWebView = /Android/.test(userAgent) && /wv/.test(userAgent);
const hasWebKit = typeof (window as any).webkit !== 'undefined';
const hasAndroidBridge = typeof (window as any).Android !== 'undefined';
let capacitorSaysNative = false;
try {
  capacitorSaysNative = Capacitor.isNativePlatform();
} catch (e) {
  // Capacitor not ready
}

const IS_NATIVE_PLATFORM = isIOSWebView || isAndroidWebView || hasWebKit || hasAndroidBridge || capacitorSaysNative;

// Set global flag that all PWA code will check
(window as any).__IS_NATIVE_APP__ = IS_NATIVE_PLATFORM;
(window as any).__PWA_DISABLED__ = IS_NATIVE_PLATFORM;

console.log('[Main] 🔐 NUCLEAR GUARD ACTIVATED');
console.log('[Main] Platform:', IS_NATIVE_PLATFORM ? '📱 NATIVE' : '🌐 WEB');
console.log('[Main] User Agent:', userAgent);
console.log('[Main] Global flags set:', {
  __IS_NATIVE_APP__: (window as any).__IS_NATIVE_APP__,
  __PWA_DISABLED__: (window as any).__PWA_DISABLED__
});

// Initialize Capacitor native features
if (IS_NATIVE_PLATFORM) {
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
