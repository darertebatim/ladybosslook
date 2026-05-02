import { Capacitor } from '@capacitor/core';

/**
 * Keeps the iOS/Android native status bar legible against the current theme.
 *
 * Capacitor `Style` semantics (counter-intuitive):
 *   - `Style.Dark`  → status bar text is WHITE (use when app background is dark)
 *   - `Style.Light` → status bar text is BLACK (use when app background is light)
 *
 * We mirror the `.dark` class on `<html>` so the clock/battery/wifi icons
 * stay readable in both modes. Safe to call on web — it's a no-op when the
 * StatusBar plugin isn't available.
 */
let started = false;

export function startStatusBarThemeSync() {
  if (started || typeof document === 'undefined') return;
  started = true;

  const apply = async () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('StatusBar')) {
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
      } catch (e) {
        console.warn('[StatusBarSync] setStyle failed:', e);
      }
    }
    // Web parity: keep the browser address-bar/notch tint in sync too.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', isDark ? '#000000' : '#FFFFFF');
    }
  };

  // Initial sync
  apply();

  // React to theme toggles anywhere in the app
  const observer = new MutationObserver(() => apply());
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
}