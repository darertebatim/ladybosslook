import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { updateMusicControls, destroyMusicControls, setupMusicControlsListeners } from "@/lib/musicControls";
import { Capacitor } from "@capacitor/core";

interface TrackInfo {
  id: string;
  title: string;
  coverImageUrl?: string;
  playlistId?: string;
  playlistName?: string;
  trackPosition?: string;
  fileUrl: string;
  duration?: number;
}

interface AudioPlayerContextType {
  // State
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  currentTrack: TrackInfo | null;
  isLoading: boolean;
  
  // Actions
  playTrack: (track: TrackInfo, startPosition?: number) => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  setPlaybackRate: (rate: number) => void;
  skipForward: (seconds?: number) => void;
  skipBack: (seconds?: number) => void;
  stop: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { user } = useAuth();
  const saveProgressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimeUpdateRef = useRef<number>(0);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "metadata";
    }
    
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => {
      // Throttle state updates to every 500ms for better performance
      const now = Date.now();
      if (now - lastTimeUpdateRef.current > 500) {
        lastTimeUpdateRef.current = now;
        setCurrentTime(audio.currentTime);
      }
    };
    
    const handleDurationChange = () => {
      setDuration(audio.duration || 0);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      if (Capacitor.isNativePlatform()) {
        destroyMusicControls();
      }
    };
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    
    // Setup native music control listeners
    if (Capacitor.isNativePlatform()) {
      setupMusicControlsListeners({
        onPlay: () => audio.play(),
        onPause: () => audio.pause(),
        onSeekForward: () => { audio.currentTime = Math.min(audio.currentTime + 15, audio.duration); },
        onSeekBackward: () => { audio.currentTime = Math.max(audio.currentTime - 15, 0); },
      });
    }
    
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, []);

  // Save progress periodically
  useEffect(() => {
    if (!currentTrack || !user?.id || !isPlaying) return;
    
    const saveProgress = async () => {
      const completed = duration > 0 && currentTime >= duration - 5;
      
      await supabase.from("audio_progress").upsert({
        user_id: user.id,
        audio_id: currentTrack.id,
        current_position_seconds: Math.floor(currentTime),
        completed,
        last_played_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,audio_id",
      });
    };
    
    saveProgressTimeoutRef.current = setInterval(saveProgress, 5000);
    
    return () => {
      if (saveProgressTimeoutRef.current) {
        clearInterval(saveProgressTimeoutRef.current);
      }
    };
  }, [currentTrack, user?.id, isPlaying, currentTime, duration]);

  // Update music controls when state changes
  useEffect(() => {
    if (!currentTrack || !Capacitor.isNativePlatform()) return;
    
    updateMusicControls({
      track: currentTrack.title,
      artist: currentTrack.playlistName || "",
      cover: currentTrack.coverImageUrl || "",
      isPlaying,
      duration: Math.floor(duration),
      elapsed: Math.floor(currentTime),
      hasPrev: false,
      hasNext: false,
    });
  }, [currentTrack, isPlaying, duration, currentTime]);

  const playTrack = useCallback(async (track: TrackInfo, startPosition?: number) => {
    if (!audioRef.current) return;
    
    const audio = audioRef.current;
    
    // If same track, just resume
    if (currentTrack?.id === track.id && audio.src) {
      if (startPosition !== undefined) {
        audio.currentTime = startPosition;
      }
      await audio.play();
      return;
    }
    
    // Load new track
    setCurrentTrack(track);
    audio.src = track.fileUrl;
    audio.playbackRate = playbackRate;
    
    if (startPosition !== undefined) {
      audio.currentTime = startPosition;
    }
    
    await audio.play();
  }, [currentTrack, playbackRate]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const resume = useCallback(async () => {
    await audioRef.current?.play();
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    setPlaybackRateState(rate);
  }, []);

  const skipForward = useCallback((seconds = 15) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.currentTime + seconds,
        audioRef.current.duration || 0
      );
    }
  }, []);

  const skipBack = useCallback((seconds = 15) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        audioRef.current.currentTime - seconds,
        0
      );
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setCurrentTrack(null);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    
    if (Capacitor.isNativePlatform()) {
      destroyMusicControls();
    }
  }, []);

  return (
    <AudioPlayerContext.Provider
      value={{
        isPlaying,
        currentTime,
        duration,
        playbackRate,
        currentTrack,
        isLoading,
        playTrack,
        pause,
        resume,
        seek,
        setPlaybackRate,
        skipForward,
        skipBack,
        stop,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error("useAudioPlayer must be used within an AudioPlayerProvider");
  }
  return context;
}
