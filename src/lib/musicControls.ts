import { Capacitor } from "@capacitor/core";

// Dynamic import for the music controls plugin
let CapacitorMusicControls: any = null;

async function getMusicControls() {
  if (!Capacitor.isNativePlatform()) return null;
  
  if (!CapacitorMusicControls) {
    try {
      const module = await import("capacitor-music-controls-plugin");
      CapacitorMusicControls = module.CapacitorMusicControls;
    } catch (error) {
      console.warn("Music controls plugin not available:", error);
      return null;
    }
  }
  
  return CapacitorMusicControls;
}

interface MusicControlsOptions {
  track: string;
  artist: string;
  cover: string;
  isPlaying: boolean;
  duration: number;
  elapsed: number;
  hasPrev: boolean;
  hasNext: boolean;
}

interface MusicControlsCallbacks {
  onPlay: () => void;
  onPause: () => void;
  onSeekForward: () => void;
  onSeekBackward: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

let controlsCreated = false;
let lastTrackId = "";
let lastUpdateTime = 0;
const UPDATE_THROTTLE = 1000; // Update at most once per second

/**
 * Convert relative URLs to absolute URLs for iOS lock screen artwork
 */
function getAbsoluteCoverUrl(cover: string): string {
  if (!cover) return "";
  
  // Already absolute URL
  if (cover.startsWith("http://") || cover.startsWith("https://")) {
    return cover;
  }
  
  // Supabase storage URL - already absolute
  if (cover.includes("supabase.co")) {
    return cover;
  }
  
  // For relative URLs, convert to absolute using the app's origin
  // On native, we'll use the production URL
  const baseUrl = "https://ladybosslook.lovable.app";
  
  // Handle leading slash
  const path = cover.startsWith("/") ? cover : `/${cover}`;
  
  return `${baseUrl}${path}`;
}

export async function updateMusicControls(options: MusicControlsOptions & { trackId?: string }) {
  const controls = await getMusicControls();
  if (!controls) return;
  
  const now = Date.now();
  const trackChanged = options.trackId && options.trackId !== lastTrackId;
  
  // Throttle updates unless track changed
  if (!trackChanged && now - lastUpdateTime < UPDATE_THROTTLE && controlsCreated) {
    return;
  }
  lastUpdateTime = now;
  
  // Convert cover URL to absolute
  const absoluteCover = getAbsoluteCoverUrl(options.cover);
  
  try {
    // Always recreate controls when track changes to update all metadata including artwork
    if (!controlsCreated || trackChanged) {
      // Destroy existing controls first if track changed
      if (controlsCreated && trackChanged) {
        try {
          await controls.destroy();
        } catch (e) {
          // Ignore destroy errors
        }
      }
      
      await controls.create({
        track: options.track,
        artist: options.artist,
        cover: absoluteCover,
        isPlaying: options.isPlaying,
        dismissable: true,
        hasPrev: options.hasPrev,
        hasNext: options.hasNext,
        hasClose: true,
        duration: options.duration,
        elapsed: options.elapsed,
        playIcon: "media_play",
        pauseIcon: "media_pause",
        prevIcon: "media_prev",
        nextIcon: "media_next",
        closeIcon: "media_close",
        notificationIcon: "notification",
      });
      
      controlsCreated = true;
      if (options.trackId) {
        lastTrackId = options.trackId;
      }
    } else {
      // Just update playback state for existing track
      await controls.updateIsPlaying({ isPlaying: options.isPlaying });
      await controls.updateElapsed({ elapsed: options.elapsed, isPlaying: options.isPlaying });
    }
  } catch (error) {
    console.error("Error updating music controls:", error);
  }
}

export async function destroyMusicControls() {
  const controls = await getMusicControls();
  if (!controls) return;
  
  try {
    await controls.destroy();
    controlsCreated = false;
  } catch (error) {
    console.error("Error destroying music controls:", error);
  }
}

export async function setupMusicControlsListeners(callbacks: MusicControlsCallbacks) {
  const controls = await getMusicControls();
  if (!controls) return;
  
  try {
    controls.addListener("controlsNotification", (info: { message: string }) => {
      switch (info.message) {
        case "music-controls-play":
          callbacks.onPlay();
          break;
        case "music-controls-pause":
          callbacks.onPause();
          break;
        case "music-controls-next":
          callbacks.onNext?.();
          break;
        case "music-controls-previous":
          callbacks.onPrev?.();
          break;
        case "music-controls-seek-forward":
          callbacks.onSeekForward();
          break;
        case "music-controls-seek-backward":
          callbacks.onSeekBackward();
          break;
        case "music-controls-destroy":
          // Handle destroy
          break;
      }
    });
  } catch (error) {
    console.error("Error setting up music controls listeners:", error);
  }
}
