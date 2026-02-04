import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Capacitor } from '@capacitor/core';
import { initializePushNotificationHandlers, clearBadge } from './lib/pushNotifications';
import { logBuildInfo } from './lib/buildInfo';

/**
 * Native boot diagnostics
 *
 * iOS sometimes shows a completely black screen with no visible error if:
 * - the JS bundle fails to load (asset path issue)
 * - a runtime error happens before React mounts
 * - a promise rejection occurs during early init
 *
 * This overlay makes those failures visible on-device.
 */
const installNativeBootDiagnostics = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const overlayId = '__native_boot_overlay__';
  if (document.getElementById(overlayId)) return;

  const overlay = document.createElement('div');
  overlay.id = overlayId;
  overlay.setAttribute('role', 'status');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '2147483647';
  overlay.style.padding = '16px';
  overlay.style.background = '#0B0B0E';
  overlay.style.color = '#FFFFFF';
  overlay.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
  overlay.style.fontSize = '12px';
  overlay.style.lineHeight = '1.4';
  overlay.style.overflow = 'auto';
  overlay.style.whiteSpace = 'pre-wrap';

  const setText = (title: string, details?: unknown) => {
    const lines: string[] = [];
    lines.push(`Simora Native Boot Diagnostics`);
    lines.push(`Time: ${new Date().toISOString()}`);
    lines.push('');
    lines.push(String(title));
    if (details !== undefined) {
      try {
        lines.push('');
        lines.push(typeof details === 'string' ? details : JSON.stringify(details, null, 2));
      } catch {
        lines.push('');
        lines.push(String(details));
      }
    }
    overlay.textContent = lines.join('\n');
  };

  setText('Booting… (if this never changes, the JS bundle might not be loading)');
  document.body.appendChild(overlay);

  const onError = (event: ErrorEvent) => {
    setText('window.onerror', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
    });
  };

  const onRejection = (event: PromiseRejectionEvent) => {
    setText('unhandledrejection', {
      reason: (event as any)?.reason,
    });
  };

  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);

  // Expose helper for later updates
  (window as any).__setNativeBootOverlay__ = setText;
};

const updateNativeBootOverlay = (title: string, details?: unknown) => {
  if (typeof window === 'undefined') return;
  const fn = (window as any).__setNativeBootOverlay__ as
    | ((t: string, d?: unknown) => void)
    | undefined;
  fn?.(title, details);
};
if (Capacitor.isNativePlatform()) {
  console.log('[Main] 📱 Native platform detected:', Capacitor.getPlatform());

  installNativeBootDiagnostics();
  updateNativeBootOverlay('Native platform detected. Initializing…', {
    platform: Capacitor.getPlatform(),
  });
  
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

  updateNativeBootOverlay('Native initialization queued. Mounting React…');
} else {
  console.log('[Main] 🌐 Web platform detected');
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If React mounted successfully, hide the overlay after a short delay.
if (Capacitor.isNativePlatform()) {
  window.setTimeout(() => {
    const el = document.getElementById('__native_boot_overlay__');
    if (el) el.style.display = 'none';
  }, 2500);
}
