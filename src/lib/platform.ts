import { Capacitor } from '@capacitor/core';

/**
 * BULLETPROOF native platform detection
 * Works EVEN IF Capacitor hasn't initialized yet
 * Priority: iOS/Android signatures > Capacitor APIs
 */
export const isDefinitelyNative = (): boolean => {
  // PRIMARY CHECK: User agent signatures (works immediately, no Capacitor needed)
  const userAgent = navigator.userAgent;
  
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
