/**
 * Native lock-screen / notification audio controls via @mediagrid/capacitor-native-audio.
 * Only activates on native platforms (iOS/Android). On web it's a no-op.
 */
import { Capacitor } from '@capacitor/core';

let nativePlayer: any = null;
let initialized = false;

// Callbacks from native controls → JS audio player
type NativeCallbacks = {
  onPlay: () => void;
  onPause: () => void;
  onSeekForward: () => void;
  onSeekBackward: () => void;
  onNextTrack: () => void;
};

let callbacks: NativeCallbacks | null = null;

export function setNativeAudioCallbacks(cbs: NativeCallbacks) {
  callbacks = cbs;
}

export async function initNativeAudioControls(): Promise<void> {
  if (!Capacitor.isNativePlatform() || initialized) return;
  
  try {
    const { NativeAudio } = await import('@mediagrid/capacitor-native-audio');
    nativePlayer = NativeAudio;
    
    // Create the player instance
    await nativePlayer.create({
      id: 'main-player',
      isMixedAudio: false,
      useForNotification: true,
      // Notification media controls
      notificationControls: {
        hasPrev: false,
        hasNext: true,
        hasClose: true,
        hasSkipForward: true,
        hasSkipBackward: true,
        skipForwardSeconds: 15,
        skipBackwardSeconds: 15,
      },
    });

    // Listen for native control events
    await nativePlayer.addListener('play', () => {
      console.log('[NativeAudio] play from lock screen');
      callbacks?.onPlay();
    });
    
    await nativePlayer.addListener('pause', () => {
      console.log('[NativeAudio] pause from lock screen');
      callbacks?.onPause();
    });
    
    await nativePlayer.addListener('seekForward', () => {
      console.log('[NativeAudio] seekForward from lock screen');
      callbacks?.onSeekForward();
    });
    
    await nativePlayer.addListener('seekBackward', () => {
      console.log('[NativeAudio] seekBackward from lock screen');
      callbacks?.onSeekBackward();
    });

    await nativePlayer.addListener('next', () => {
      console.log('[NativeAudio] next from lock screen');
      callbacks?.onNextTrack();
    });

    initialized = true;
    console.log('[NativeAudio] ✓ Lock screen controls initialized');
  } catch (e) {
    console.warn('[NativeAudio] Failed to init:', e);
  }
}

export async function updateNativeNowPlaying(opts: {
  title: string;
  artist?: string;
  album?: string;
  imageUrl?: string;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
}): Promise<void> {
  if (!nativePlayer) return;
  
  try {
    await nativePlayer.changeMetadata({
      id: 'main-player',
      title: opts.title,
      artist: opts.artist || 'LadyBoss Academy',
      album: opts.album || '',
      imageUrl: opts.imageUrl || '',
      duration: opts.duration,
      currentTime: opts.currentTime,
      isPlaying: opts.isPlaying,
    });
  } catch (e) {
    // Silently ignore metadata update errors
  }
}

export async function updateNativePlaybackState(isPlaying: boolean, currentTime: number): Promise<void> {
  if (!nativePlayer) return;
  
  try {
    await nativePlayer.updateMetadata({
      id: 'main-player',
      isPlaying,
      currentTime,
    });
  } catch (e) {
    // Silently ignore
  }
}

export async function destroyNativeAudioControls(): Promise<void> {
  if (!nativePlayer) return;
  
  try {
    await nativePlayer.destroy({ id: 'main-player' });
    console.log('[NativeAudio] Destroyed');
  } catch (e) {
    console.warn('[NativeAudio] Destroy failed:', e);
  }
}
