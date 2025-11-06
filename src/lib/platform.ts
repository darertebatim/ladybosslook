import { Capacitor } from '@capacitor/core';

/**
 * Robust native platform detection using multiple methods
 * This prevents false negatives in iOS WKWebView environments
 */
export const isDefinitelyNative = (): boolean => {
  const hasCapacitor = typeof (window as any).Capacitor !== 'undefined';
  const isNativePlatform = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();
  const isIOSOrAndroid = platform === 'ios' || platform === 'android';
  
  const result = hasCapacitor && isNativePlatform && isIOSOrAndroid;
  
  console.log('[Platform Detection]', {
    hasCapacitor,
    isNativePlatform,
    platform,
    isIOSOrAndroid,
    finalResult: result
  });
  
  return result;
};

export const isNativeApp = () => isDefinitelyNative();
export const isIOSApp = () => Capacitor.getPlatform() === 'ios';
export const isWebApp = () => !isDefinitelyNative();
