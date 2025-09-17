import { useState, useRef, useCallback, useEffect } from 'react';

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLoading: boolean;
  error: string | null;
}

export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isLoading: false,
    error: null
  });

  const updateState = useCallback((updates: Partial<AudioPlayerState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const play = useCallback(async () => {
    if (!audioRef.current) return;
    
    try {
      updateState({ isLoading: true, error: null });
      await audioRef.current.play();
      updateState({ isPlaying: true, isLoading: false });
    } catch (error) {
      updateState({ 
        error: 'Failed to play audio', 
        isLoading: false, 
        isPlaying: false 
      });
    }
  }, [updateState]);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    updateState({ isPlaying: false });
  }, [updateState]);

  const togglePlay = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [state.isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    updateState({ currentTime: time });
  }, [updateState]);

  const setVolume = useCallback((volume: number) => {
    if (!audioRef.current) return;
    const clampedVolume = Math.max(0, Math.min(1, volume));
    audioRef.current.volume = clampedVolume;
    updateState({ volume: clampedVolume });
  }, [updateState]);

  const load = useCallback((src: string) => {
    if (!audioRef.current) return;
    
    updateState({ isLoading: true, error: null, isPlaying: false });
    audioRef.current.src = src;
    audioRef.current.load();
  }, [updateState]);

  const formatTime = useCallback((time: number): string => {
    if (isNaN(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      updateState({ currentTime: audio.currentTime });
    };

    const handleDurationChange = () => {
      updateState({ duration: audio.duration || 0 });
    };

    const handleLoadStart = () => {
      updateState({ isLoading: true });
    };

    const handleCanPlay = () => {
      updateState({ isLoading: false, error: null });
    };

    const handleError = () => {
      updateState({ 
        error: 'Failed to load audio', 
        isLoading: false, 
        isPlaying: false 
      });
    };

    const handleEnded = () => {
      updateState({ isPlaying: false, currentTime: 0 });
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [updateState]);

  return {
    audioRef,
    state,
    actions: {
      play,
      pause,
      togglePlay,
      seek,
      setVolume,
      load,
      formatTime
    }
  };
};