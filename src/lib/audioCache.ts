import { Filesystem, Directory } from '@capacitor/filesystem';
import { isNativeApp } from '@/lib/platform';
import { TrackInfo } from '@/contexts/AudioPlayerContext';

const AUDIO_DIR = 'audio';

function getAudioPath(trackId: string): string {
  return `${AUDIO_DIR}/${trackId}.mp3`;
}

/**
 * Check whether a track has been downloaded to local storage.
 */
export async function isAudioCached(trackId: string): Promise<boolean> {
  if (!isNativeApp()) return false;
  
  try {
    await Filesystem.stat({
      path: getAudioPath(trackId),
      directory: Directory.Data,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the local file:// URI for a cached audio track.
 * Returns null if the track hasn't been downloaded.
 */
export async function getCachedAudioPath(trackId: string): Promise<string | null> {
  if (!isNativeApp()) return null;
  
  try {
    const result = await Filesystem.getUri({
      path: getAudioPath(trackId),
      directory: Directory.Data,
    });
    return result.uri || null;
  } catch {
    return null;
  }
}

/**
 * Download an audio track and save it permanently.
 * @param track - TrackInfo including fileUrl and id
 * @param onProgress - Called with 0–100 as bytes arrive (best effort)
 * @returns local file:// URI on success, null on failure
 */
export async function downloadAudio(
  track: TrackInfo,
  onProgress?: (progress: number) => void
): Promise<string | null> {
  if (!isNativeApp()) return null;

  try {
    // Ensure directory exists
    try {
      await Filesystem.mkdir({
        path: AUDIO_DIR,
        directory: Directory.Data,
        recursive: true,
      });
    } catch {
      // Already exists — ignore
    }

    onProgress?.(0);

    // Fetch the audio file
    const response = await fetch(track.fileUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    // Stream with progress if Content-Length is available
    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    
    let loaded = 0;
    const reader = response.body?.getReader();
    const chunks: Uint8Array[] = [];

    if (reader && total > 0) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        onProgress?.(Math.round((loaded / total) * 100));
      }
    } else {
      // Fallback: read all at once
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      chunks.push(new Uint8Array(arrayBuffer));
      onProgress?.(80);
    }

    // Combine chunks into a single Uint8Array
    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    // Convert to base64
    const base64 = uint8ArrayToBase64(combined);
    onProgress?.(90);

    // Write to filesystem
    await Filesystem.writeFile({
      path: getAudioPath(track.id),
      data: base64,
      directory: Directory.Data,
    });

    onProgress?.(100);

    const result = await Filesystem.getUri({
      path: getAudioPath(track.id),
      directory: Directory.Data,
    });

    console.log(`[AudioCache] Downloaded track ${track.id} to ${result.uri}`);
    return result.uri || null;
  } catch (error) {
    console.error('[AudioCache] Download failed:', error);
    // Clean up partial file
    try {
      await Filesystem.deleteFile({
        path: getAudioPath(track.id),
        directory: Directory.Data,
      });
    } catch {
      // Ignore cleanup errors
    }
    return null;
  }
}

/**
 * Delete a downloaded audio track from local storage.
 */
export async function deleteAudio(trackId: string): Promise<boolean> {
  if (!isNativeApp()) return false;
  
  try {
    await Filesystem.deleteFile({
      path: getAudioPath(trackId),
      directory: Directory.Data,
    });
    console.log(`[AudioCache] Deleted track ${trackId}`);
    return true;
  } catch (error) {
    console.warn('[AudioCache] Failed to delete track:', trackId, error);
    return false;
  }
}

/**
 * Get the file size of a downloaded track in MB. Returns 0 if not found.
 */
export async function getAudioFileSize(trackId: string): Promise<number> {
  if (!isNativeApp()) return 0;
  
  try {
    const stat = await Filesystem.stat({
      path: getAudioPath(trackId),
      directory: Directory.Data,
    });
    return stat.size ? stat.size / (1024 * 1024) : 0;
  } catch {
    return 0;
  }
}

/**
 * Get the set of all downloaded track IDs.
 */
export async function getDownloadedTracks(): Promise<Set<string>> {
  if (!isNativeApp()) return new Set();
  
  try {
    const result = await Filesystem.readdir({
      path: AUDIO_DIR,
      directory: Directory.Data,
    });
    
    const trackIds = result.files
      .filter(f => f.name.endsWith('.mp3'))
      .map(f => f.name.replace('.mp3', ''));
    
    return new Set(trackIds);
  } catch {
    return new Set();
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────

function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}
