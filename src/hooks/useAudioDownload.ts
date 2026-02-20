import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  isAudioCached,
  downloadAudio,
  deleteAudio,
  getDownloadedTracks,
  getAudioFileSize,
} from '@/lib/audioCache';
import { TrackInfo } from '@/contexts/AudioPlayerContext';
import { isNativeApp } from '@/lib/platform';

interface DownloadState {
  isDownloaded: boolean;
  isDownloading: boolean;
  progress: number; // 0-100
}

interface UseAudioDownloadReturn {
  downloadedTracks: Set<string>;
  isDownloaded: (trackId: string) => boolean;
  isDownloading: (trackId: string) => boolean;
  getProgress: (trackId: string) => number;
  downloadTrack: (track: TrackInfo) => Promise<void>;
  deleteDownload: (trackId: string) => Promise<void>;
  getFileSize: (trackId: string) => Promise<number>;
  isNative: boolean;
}

// Global state shared across all hook instances
const downloadStates = new Map<string, DownloadState>();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(fn => fn());
}

export function useAudioDownload(): UseAudioDownloadReturn {
  const [downloadedTracks, setDownloadedTracks] = useState<Set<string>>(new Set());
  const [, forceUpdate] = useState(0);
  const isNative = isNativeApp();

  // Subscribe to global state changes
  useEffect(() => {
    const listener = () => forceUpdate(n => n + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  // Load all downloaded tracks from filesystem on mount
  useEffect(() => {
    if (!isNative) return;
    
    getDownloadedTracks().then(tracks => {
      setDownloadedTracks(tracks);
      // Sync global state
      tracks.forEach(id => {
        if (!downloadStates.has(id)) {
          downloadStates.set(id, { isDownloaded: true, isDownloading: false, progress: 100 });
        }
      });
    });
  }, [isNative]);

  const isDownloaded = useCallback((trackId: string): boolean => {
    return downloadStates.get(trackId)?.isDownloaded || downloadedTracks.has(trackId);
  }, [downloadedTracks]);

  const isDownloading = useCallback((trackId: string): boolean => {
    return downloadStates.get(trackId)?.isDownloading || false;
  }, []);

  const getProgress = useCallback((trackId: string): number => {
    return downloadStates.get(trackId)?.progress || 0;
  }, []);

  const downloadTrack = useCallback(async (track: TrackInfo) => {
    if (!isNative) return;
    if (downloadStates.get(track.id)?.isDownloading) return;
    if (downloadStates.get(track.id)?.isDownloaded) {
      toast.info('Already downloaded');
      return;
    }

    // Set downloading state
    downloadStates.set(track.id, { isDownloaded: false, isDownloading: true, progress: 0 });
    notify();

    const toastId = toast.loading(`Downloading "${track.title}"...`, {
      description: '0%',
    });

    try {
      const localUri = await downloadAudio(track, (progress) => {
        downloadStates.set(track.id, { isDownloaded: false, isDownloading: true, progress });
        notify();
        toast.loading(`Downloading "${track.title}"...`, {
          id: toastId,
          description: `${progress}%`,
        });
      });

      if (localUri) {
        downloadStates.set(track.id, { isDownloaded: true, isDownloading: false, progress: 100 });
        setDownloadedTracks(prev => new Set([...prev, track.id]));
        toast.success('Downloaded!', {
          id: toastId,
          description: `"${track.title}" is ready for offline playback`,
        });
      } else {
        throw new Error('Download returned no URI');
      }
    } catch (error) {
      downloadStates.delete(track.id);
      toast.error('Download failed', {
        id: toastId,
        description: 'Please check your connection and try again',
      });
    }
    
    notify();
  }, [isNative]);

  const deleteDownload = useCallback(async (trackId: string) => {
    if (!isNative) return;
    
    const success = await deleteAudio(trackId);
    if (success) {
      downloadStates.delete(trackId);
      setDownloadedTracks(prev => {
        const next = new Set(prev);
        next.delete(trackId);
        return next;
      });
      notify();
      toast.success('Download removed');
    } else {
      toast.error('Failed to remove download');
    }
  }, [isNative]);

  const getFileSize = useCallback(async (trackId: string): Promise<number> => {
    return getAudioFileSize(trackId);
  }, []);

  return {
    downloadedTracks,
    isDownloaded,
    isDownloading,
    getProgress,
    downloadTrack,
    deleteDownload,
    getFileSize,
    isNative,
  };
}
