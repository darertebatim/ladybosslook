import { Capacitor } from '@capacitor/core';

/**
 * ULTRA-ROBUST native platform detection
 * Works even when Capacitor reports "web" due to remote server URL
 * Checks multiple signals: Capacitor bridge, user agent, WebView context
 */
export const isDefinitelyNative = (): boolean => {
  // Check 1: Capacitor bridge exists
  const hasCapacitorBridge = typeof (window as any).Capacitor !== 'undefined';
  
  // Check 2: Standard Capacitor detection
  const isNativePlatform = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  const isIOSOrAndroid = platform === 'ios' || platform === 'android';
  
  // Check 3: User agent detection (iOS WKWebView has "Mobile/" without "Safari/")
  const userAgent = navigator.userAgent;
  const isIOSUserAgent = /iPhone|iPad|iPod/.test(userAgent) && /Mobile\//.test(userAgent) && !/Safari\//.test(userAgent);
  const isAndroidUserAgent = /Android/.test(userAgent) && /wv/.test(userAgent);
  
  // Check 4: Native-only APIs
  const hasNativeAPIs = typeof (window as any).webkit !== 'undefined' || 
                        typeof (window as any).Android !== 'undefined';
  
  // Result: Native if Capacitor exists AND (reports native OR has native user agent)
  const result = hasCapacitorBridge && (isIOSOrAndroid || isIOSUserAgent || isAndroidUserAgent || hasNativeAPIs);
  
  console.log('[Platform Detection] 🔍', {
    hasCapacitorBridge,
    isNativePlatform,
    platform,
    isIOSOrAndroid,
    isIOSUserAgent,
    isAndroidUserAgent,
    hasNativeAPIs,
    userAgent,
    '🎯 FINAL': result ? '📱 NATIVE' : '🌐 WEB'
  });
  
  return result;
};

export const isNativeApp = () => isDefinitelyNative();
export const isIOSApp = () => Capacitor.getPlatform() === 'ios' || /iPhone|iPad|iPod/.test(navigator.userAgent);
export const isWebApp = () => !isDefinitelyNative();
