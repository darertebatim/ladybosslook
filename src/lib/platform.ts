import { Capacitor } from '@capacitor/core';

/**
 * Simplified platform detection using Capacitor's built-in APIs
 * Supports ?devNative=true URL parameter for previewing native layout in browser
 */
export const isNativeApp = (): boolean => {
  // Check for dev preview flag
  if (typeof window !== 'undefined') {
    const devNative = new URLSearchParams(window.location.search).get('devNative') === 'true';
    if (devNative) return true;
  }
  
  return Capacitor.isNativePlatform();
};

export const isIOSApp = (): boolean => {
  return Capacitor.getPlatform() === 'ios';
};

export const isWebApp = (): boolean => {
  return !isNativeApp();
};

export const isRealDevice = async (): Promise<boolean> => {
  if (!isIOSApp()) return false;
  
  try {
    const { Device } = await import('@capacitor/device');
    const info = await Device.getInfo();
    // isVirtual is true for simulators
    return !info.isVirtual;
  } catch (error) {
    console.error('[Platform] Failed to check device type:', error);
    return false;
  }
};
