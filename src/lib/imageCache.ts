import { Filesystem, Directory } from '@capacitor/filesystem';
import { isNativeApp } from '@/lib/platform';

const IMAGE_DIR = 'images';

/**
 * Simple hash of a URL string for use as a filename.
 * Uses djb2 algorithm — fast, no crypto needed.
 */
function hashUrl(url: string): string {
  let hash = 5381;
  for (let i = 0; i < url.length; i++) {
    hash = (hash * 33) ^ url.charCodeAt(i);
  }
  // Convert to unsigned 32-bit integer and to hex
  return (hash >>> 0).toString(16);
}

function getFilePath(url: string): string {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
  return `${IMAGE_DIR}/${hashUrl(url)}.${safeExt}`;
}

/**
 * Check if an image is cached locally.
 * Returns the local file:// URI if found, null otherwise.
 */
export async function getCachedImage(url: string): Promise<string | null> {
  if (!isNativeApp() || !url) return null;
  
  try {
    const filePath = getFilePath(url);
    const result = await Filesystem.getUri({
      path: filePath,
      directory: Directory.Cache,
    });
    // Verify the file actually exists by checking the URI
    if (result.uri) {
      // Try to stat the file
      await Filesystem.stat({
        path: filePath,
        directory: Directory.Cache,
      });
      return result.uri;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Download an image from a URL and save it to the cache directory.
 * Returns the local file:// URI on success.
 */
export async function cacheImage(url: string): Promise<string | null> {
  if (!isNativeApp() || !url) return null;
  
  try {
    // Ensure directory exists
    try {
      await Filesystem.mkdir({
        path: IMAGE_DIR,
        directory: Directory.Cache,
        recursive: true,
      });
    } catch {
      // Directory may already exist — ignore
    }

    // Fetch the image as base64
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);
    
    const filePath = getFilePath(url);
    await Filesystem.writeFile({
      path: filePath,
      data: base64,
      directory: Directory.Cache,
    });

    const result = await Filesystem.getUri({
      path: filePath,
      directory: Directory.Cache,
    });

    return result.uri || null;
  } catch (error) {
    console.warn('[ImageCache] Failed to cache image:', url, error);
    return null;
  }
}

/**
 * Get cached image URI, downloading it if not yet cached.
 * This is the main entry point — returns local URI or original URL as fallback.
 */
export async function getOrCacheImage(url: string): Promise<string> {
  if (!isNativeApp() || !url) return url;
  
  // Check cache first
  const cached = await getCachedImage(url);
  if (cached) return cached;
  
  // Download and cache
  const newlyCached = await cacheImage(url);
  return newlyCached || url;
}

/**
 * Clear all cached images. Useful as an admin/debug utility.
 */
export async function clearImageCache(): Promise<void> {
  if (!isNativeApp()) return;
  
  try {
    await Filesystem.rmdir({
      path: IMAGE_DIR,
      directory: Directory.Cache,
      recursive: true,
    });
    console.log('[ImageCache] Cleared all cached images');
  } catch (error) {
    console.warn('[ImageCache] Failed to clear cache:', error);
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix — Capacitor Filesystem only wants the raw base64
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
