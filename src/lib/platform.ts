/**
 * Platform detection - STUBBED (Capacitor removed)
 * 
 * All functions return web-only values.
 * Capacitor will be added back incrementally to identify the black screen cause.
 */

export const isNativeApp = (): boolean => {
  // Check for dev preview flag only
  if (typeof window !== 'undefined') {
    const devNative = new URLSearchParams(window.location.search).get('devNative') === 'true';
    if (devNative) return true;
  }
  
  // Capacitor removed - always return false
  return false;
};

export const isIOSApp = (): boolean => {
  // Capacitor removed - always return false
  return false;
};

export const isWebApp = (): boolean => {
  return true;
};

export const isRealDevice = async (): Promise<boolean> => {
  // Capacitor removed - always return false
  return false;
};
