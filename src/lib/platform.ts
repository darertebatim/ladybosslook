import { Capacitor } from '@capacitor/core';

/**
 * 🚨 NUCLEAR GUARD: BULLETPROOF native platform detection
 * LAYER 1: Check global flag set in main.tsx
 * LAYER 2: User agent signatures (works immediately, no Capacitor needed)
 * LAYER 3: Native APIs and Capacitor (if available)
 */
export const isDefinitelyNative = (): boolean => {
  // LAYER 1: Check global flag first (set in main.tsx before any imports)
  if (typeof window !== 'undefined') {
    if ((window as any).__IS_NATIVE_APP__ === true) {
      console.log('[Platform] 🔐 NUCLEAR GUARD: Global flag confirms NATIVE');
      return true;
    }
    if ((window as any).__PWA_DISABLED__ === true) {
      console.log('[Platform] 🔐 NUCLEAR GUARD: PWA disabled flag confirms NATIVE');
      return true;
    }
  }
  // PRIMARY CHECK: User agent signatures (works immediately, no Capacitor needed)
  const userAgent = navigator.userAgent;
  
  // Exclude Telegram's in-app browser
  const isTelegramBrowser = /Telegram/i.test(userAgent);
  if (isTelegramBrowser) {
    console.log('[Platform] 🚫 Telegram browser detected - treating as WEB');
    return false;
  }
  
  // iOS WKWebView: Has "Mobile/" but NO "Safari/" 
  // Real Safari: Has BOTH "Mobile/" AND "Safari/"
  const isIOSWebView = /iPhone|iPad|iPod/.test(userAgent) && 
                       /Mobile\//.test(userAgent) && 
                       !/Safari\//.test(userAgent);
  
  // Android WebView: Has "Android" and "wv"
  const isAndroidWebView = /Android/.test(userAgent) && /wv/.test(userAgent);
  
  // SECONDARY CHECKS: Native APIs and Capacitor (if available)
  const hasWebKit = typeof (window as any).webkit !== 'undefined';
  const hasAndroidBridge = typeof (window as any).Android !== 'undefined';
  const hasCapacitor = typeof (window as any).Capacitor !== 'undefined';
  
  // TERTIARY CHECK: Capacitor detection (fallback)
  let capacitorSaysNative = false;
  let capacitorPlatform = 'unknown';
  try {
    capacitorSaysNative = Capacitor.isNativePlatform();
    capacitorPlatform = Capacitor.getPlatform();
  } catch (e) {
    // Capacitor not ready yet
  }
  
  // RESULT: Native if ANY strong signal exists
  const isNative = isIOSWebView || 
                   isAndroidWebView || 
                   hasWebKit || 
                   hasAndroidBridge ||
                   (hasCapacitor && capacitorSaysNative);
  
  console.log('[Platform Detection] 🔍', {
    '📱 User Agent': userAgent,
    '🍎 isIOSWebView': isIOSWebView,
    '🤖 isAndroidWebView': isAndroidWebView,
    '⚡ hasCapacitor': hasCapacitor,
    '🔌 capacitorSaysNative': capacitorSaysNative,
    '📊 capacitorPlatform': capacitorPlatform,
    '🎯 FINAL DECISION': isNative ? '📱 NATIVE' : '🌐 WEB'
  });
  
  return isNative;
};

export const isNativeApp = () => isDefinitelyNative();
export const isIOSApp = () => {
  const userAgent = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(userAgent) && /Mobile\//.test(userAgent) && !/Safari\//.test(userAgent);
};
export const isWebApp = () => !isDefinitelyNative();
