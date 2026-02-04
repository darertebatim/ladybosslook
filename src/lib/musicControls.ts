/**
 * Music Controls - DISABLED
 * 
 * The capacitor-music-controls-plugin was removed to debug black screen issues.
 * This file provides no-op stubs so the rest of the app continues to work.
 */

interface MusicControlsOptions {
  track: string;
  artist: string;
  cover: string;
  isPlaying: boolean;
  duration: number;
  elapsed: number;
  hasPrev: boolean;
  hasNext: boolean;
  trackId?: string;
}

interface MusicControlsCallbacks {
  onPlay: () => void;
  onPause: () => void;
  onSeekForward: () => void;
  onSeekBackward: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onTap?: () => void;
}

// No-op implementations
export async function updateMusicControls(_options: MusicControlsOptions): Promise<void> {
  // Music controls plugin removed - no-op
}

export async function destroyMusicControls(): Promise<void> {
  // Music controls plugin removed - no-op
}

export async function setupMusicControlsListeners(_callbacks: MusicControlsCallbacks): Promise<void> {
  // Music controls plugin removed - no-op
}
