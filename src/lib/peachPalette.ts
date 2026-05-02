import { useEffect, useState } from 'react';

const PEACHES_LIGHT = [
  'hsl(31 100% 89%)',
  'hsl(28 100% 84%)',
  'hsl(22 100% 87%)',
  'hsl(35 100% 90%)',
  'hsl(18 100% 88%)',
  'hsl(30 90% 82%)',
];

// Darker, muted peach tones for dark mode — sit naturally on a black surface
// without the harsh "spotlight" look of light peach on dark.
const PEACHES_DARK = [
  'hsl(28 38% 28%)',
  'hsl(24 42% 24%)',
  'hsl(20 40% 26%)',
  'hsl(32 36% 30%)',
  'hsl(18 44% 25%)',
  'hsl(30 38% 27%)',
];

function hashSeed(seed: string | undefined | null): number {
  const s = seed || '';
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function isDarkMode(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

/**
 * Returns a peach background color that adapts to the current theme.
 * Light mode → soft peach. Dark mode → darker muted peach.
 * Re-renders consumers when the theme toggles.
 */
export function pickPeach(seed: string | undefined | null): string {
  const palette = isDarkMode() ? PEACHES_DARK : PEACHES_LIGHT;
  return palette[hashSeed(seed) % palette.length];
}

/**
 * Hook variant — subscribes to `.dark` class changes on <html> so cards
 * update instantly when the theme is toggled in-app.
 */
export function usePeach(seed: string | undefined | null): string {
  const dark = useIsDarkMode();
  const palette = dark ? PEACHES_DARK : PEACHES_LIGHT;
  return palette[hashSeed(seed) % palette.length];
}

/**
 * Subscribes to dark-mode toggles on <html>. Use this in components that
 * call `pickPeach()` inside loops (where a hook can't be invoked per item)
 * so the parent re-renders when the theme changes.
 */
export function useIsDarkMode(): boolean {
  const [dark, setDark] = useState<boolean>(isDarkMode);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const el = document.documentElement;
    const observer = new MutationObserver(() => {
      setDark(el.classList.contains('dark'));
    });
    observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return dark;
}