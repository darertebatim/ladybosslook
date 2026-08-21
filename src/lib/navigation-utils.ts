import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

const INTERNAL_DOMAINS = [
  'ladybosslook.com',
  'ladybosslook.lovable.app',
  'ladybosslook.lovableproject.com',
];

/**
 * Extract internal app path from a URL if it points to our app.
 * Returns the path (e.g. "/app/player/playlist/xxx") or null if external.
 */
export function getInternalPath(url: string): string | null {
  const trimmed = (url || '').trim();
  if (!trimmed) return null;

  // Relative paths are always internal ("/app/programs", "programs/x")
  if (trimmed.startsWith('/')) return trimmed;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed) && !trimmed.includes('.')) {
    return `/${trimmed.replace(/^\/+/, '')}`;
  }

  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const isInternal = INTERNAL_DOMAINS.some(d => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`));
    if (isInternal) {
      return (parsed.pathname || '/') + parsed.search + parsed.hash;
    }
  } catch {
    // not a valid URL
  }
  return null;
}


/**
 * Open a URL: navigate internally if it's an app link, otherwise open externally.
 */
export async function smartOpenUrl(url: string, navigate: (path: string) => void) {
  const internalPath = getInternalPath(url);
  if (internalPath) {
    navigate(internalPath);
    return;
  }

  try {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url });
    } else {
      window.open(url, '_blank');
    }
  } catch {
    window.open(url, '_blank');
  }
}
