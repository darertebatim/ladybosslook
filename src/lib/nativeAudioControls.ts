/**
 * Native audio bridge using @mediagrid/capacitor-native-audio.
 * On native platforms, this plugin handles audio playback natively with
 * lock-screen / notification controls. On web, we fall back to HTML5 Audio.
 */
import { Capacitor } from '@capacitor/core';

const AUDIO_ID = 'main-player';

type StatusCallback = (status: 'playing' | 'paused' | 'stopped') => void;
type VoidCallback = () => void;

let plugin: any = null;
let isReady = false;
let currentSource = '';

// Registered callbacks
let onStatusChange: StatusCallback | null = null;
let onAudioEnd: VoidCallback | null = null;
let onAudioReady: VoidCallback | null = null;

export function isNativeAudioAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

export function setNativeAudioCallbacks(cbs: {
  onStatusChange?: StatusCallback;
  onAudioEnd?: VoidCallback;
  onAudioReady?: VoidCallback;
}) {
  onStatusChange = cbs.onStatusChange || null;
  onAudioEnd = cbs.onAudioEnd || null;
  onAudioReady = cbs.onAudioReady || null;
}

/**
 * Prepare a new track for playback. Destroys previous if exists.
 * Resolves once the audio is buffered and ready to play.
 */
export async function nativeAudioPrepare(opts: {
  source: string;
  title: string;
  artist?: string;
  album?: string;
  artworkUrl?: string;
}): Promise<boolean> {
  const platform = Capacitor.getPlatform();
  console.log('[NativeAudio] Platform:', platform, 'isNative:', Capacitor.isNativePlatform());
  if (!Capacitor.isNativePlatform()) return false;

  try {
    if (!plugin) {
      const mod = await import('@mediagrid/capacitor-native-audio');
      plugin = mod.AudioPlayer;
    }

    // Destroy previous instance if source changed
    if (currentSource && currentSource !== opts.source) {
      try {
        await plugin.destroy({ audioId: AUDIO_ID });
      } catch (_) { /* ignore */ }
      isReady = false;
    }

    if (currentSource === opts.source && isReady) {
      // Just update metadata
      await plugin.changeMetadata({
        audioId: AUDIO_ID,
        friendlyTitle: opts.title,
        artistName: opts.artist || 'Rilo',
        albumTitle: opts.album || '',
        artworkSource: opts.artworkUrl || '',
      });
      return true;
    }

    currentSource = opts.source;
    isReady = false;

    console.log('[NativeAudio] Creating player with source:', opts.source?.substring(0, 80));
    await plugin.create({
      audioId: AUDIO_ID,
      audioSource: opts.source,
      friendlyTitle: opts.title,
      artistName: opts.artist || 'Rilo',
      albumTitle: opts.album || '',
      artworkSource: opts.artworkUrl || '',
      useForNotification: true,
      isBackgroundMusic: false,
      showSeekForward: true,
      showSeekBackward: true,
      seekForwardTime: 15,
      seekBackwardTime: 15,
    });
    console.log('[NativeAudio] Player created successfully');

    // Create a promise that resolves when audio is ready
    const readyPromise = new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('[NativeAudio] Ready timeout after 15s, proceeding anyway');
        resolve();
      }, 15000);

      plugin.onAudioReady({ audioId: AUDIO_ID }, () => {
        console.log('[NativeAudio] ✓ Audio ready');
        clearTimeout(timeout);
        isReady = true;
        onAudioReady?.();
        resolve();
      });
    });

    await plugin.onAudioEnd({ audioId: AUDIO_ID }, () => {
      console.log('[NativeAudio] Audio ended');
      onAudioEnd?.();
    });

    await plugin.onPlaybackStatusChange({ audioId: AUDIO_ID }, (result: { status: 'playing' | 'paused' | 'stopped' }) => {
      console.log('[NativeAudio] Status:', result.status);
      onStatusChange?.(result.status);
    });

    // Initialize (starts buffering)
    await plugin.initialize({ audioId: AUDIO_ID });

    // Wait for audio to actually be ready before returning
    await readyPromise;

    console.log('[NativeAudio] ✓ Prepared:', opts.title);
    return true;
  } catch (e) {
    console.error('[NativeAudio] Prepare failed:', e);
    return false;
  }
}

export async function nativeAudioPlay(): Promise<void> {
  if (!plugin) return;
  try {
    await plugin.play({ audioId: AUDIO_ID });
  } catch (e) {
    console.warn('[NativeAudio] Play failed:', e);
  }
}

export async function nativeAudioPause(): Promise<void> {
  if (!plugin) return;
  try {
    await plugin.pause({ audioId: AUDIO_ID });
  } catch (e) {
    console.warn('[NativeAudio] Pause failed:', e);
  }
}

export async function nativeAudioStop(): Promise<void> {
  if (!plugin) return;
  try {
    await plugin.stop({ audioId: AUDIO_ID });
  } catch (e) {
    console.warn('[NativeAudio] Stop failed:', e);
  }
}

export async function nativeAudioSeek(timeInSeconds: number): Promise<void> {
  if (!plugin) return;
  try {
    const normalizedTimeInSeconds = Math.max(0, Math.round(timeInSeconds));
    await plugin.seek({ audioId: AUDIO_ID, timeInSeconds: normalizedTimeInSeconds });
  } catch (e) {
    console.warn('[NativeAudio] Seek failed:', e);
  }
}

export async function nativeAudioSetRate(rate: number): Promise<void> {
  if (!plugin) return;
  try {
    await plugin.setRate({ audioId: AUDIO_ID, rate });
  } catch (e) {
    console.warn('[NativeAudio] SetRate failed:', e);
  }
}

export async function nativeAudioGetCurrentTime(): Promise<number> {
  if (!plugin) return 0;
  try {
    const result = await plugin.getCurrentTime({ audioId: AUDIO_ID });
    return result.currentTime;
  } catch {
    return 0;
  }
}

export async function nativeAudioGetDuration(): Promise<number> {
  if (!plugin) return 0;
  try {
    const result = await plugin.getDuration({ audioId: AUDIO_ID });
    return result.duration;
  } catch {
    return 0;
  }
}

export async function nativeAudioDestroy(): Promise<void> {
  if (!plugin) return;
  try {
    await plugin.destroy({ audioId: AUDIO_ID });
    currentSource = '';
    isReady = false;
    console.log('[NativeAudio] Destroyed');
  } catch (e) {
    console.warn('[NativeAudio] Destroy failed:', e);
  }
}

/**
 * Pre-warm the native audio plugin on app start.
 * Creates and immediately destroys a silent instance so the native
 * audio session is initialized before the user taps play.
 */
export async function nativeAudioWarmUp(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    if (!plugin) {
      const mod = await import('@mediagrid/capacitor-native-audio');
      plugin = mod.AudioPlayer;
    }
    console.log('[NativeAudio] ✓ Plugin pre-warmed');
  } catch (e) {
    console.warn('[NativeAudio] Warm-up failed:', e);
  }
}

export async function nativeAudioChangeMetadata(opts: {
  title: string;
  artist?: string;
  album?: string;
  artworkUrl?: string;
}): Promise<void> {
  if (!plugin) return;
  try {
    await plugin.changeMetadata({
      audioId: AUDIO_ID,
      friendlyTitle: opts.title,
      artistName: opts.artist || 'Rilo',
      albumTitle: opts.album || '',
      artworkSource: opts.artworkUrl || '',
    });
  } catch (_) { /* ignore */ }
}
