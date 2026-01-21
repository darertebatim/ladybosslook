import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { updateMusicControls, destroyMusicControls, setupMusicControlsListeners } from "@/lib/musicControls";
import { Capacitor } from "@capacitor/core";

export interface TrackInfo {
  id: string;
  title: string;
  coverImageUrl?: string;
  playlistId?: string;
  playlistName?: string;
  trackPosition?: string;
  fileUrl: string;
  duration?: number;
  dripDelayDays?: number;
}

interface PlaylistContext {
  tracks: TrackInfo[];
  currentIndex: number;
  roundStartDate?: string | null;
  roundDripOffset?: number;
}

interface AudioPlayerContextType {
  // State
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  currentTrack: TrackInfo | null;
  isLoading: boolean;
  nextTrack: TrackInfo | null;
  hasNextTrack: boolean;
  
  // Actions
  playTrack: (track: TrackInfo, startPosition?: number) => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  setPlaybackRate: (rate: number) => void;
  skipForward: (seconds?: number) => void;
  skipBack: (seconds?: number) => void;
  stop: () => void;
  setPlaylistContext: (context: PlaylistContext) => void;
  setOnTrackComplete: (callback: (() => void) | null) => void;
  playNextTrack: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const saveProgressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimeUpdateRef = useRef<number>(0);
  const onTrackCompleteRef = useRef<(() => void) | null>(null);
  const currentTrackRef = useRef<TrackInfo | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [playlistContext, setPlaylistContextState] = useState<PlaylistContext | null>(null);

  // Calculate next available track
  const getNextAvailableTrack = useCallback((): TrackInfo | null => {
    if (!playlistContext || playlistContext.currentIndex < 0) return null;
    
    const { tracks, currentIndex, roundStartDate, roundDripOffset } = playlistContext;
    
    for (let i = currentIndex + 1; i < tracks.length; i++) {
      const track = tracks[i];
      const dripDays = track.dripDelayDays || 0;
      
      // Check availability if there's drip content
      if (dripDays > 0 && roundStartDate) {
        const effectiveDripDays = dripDays - (roundDripOffset || 0);
        const startDate = new Date(roundStartDate);
        const availableDate = new Date(startDate);
        availableDate.setDate(availableDate.getDate() + effectiveDripDays);
        
        if (new Date() < availableDate) {
          continue; // Skip locked tracks
        }
      }
      
      return track;
    }
    return null;
  }, [playlistContext]);

  const nextTrack = getNextAvailableTrack();
  const hasNextTrack = !!nextTrack;

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
    
    const handleEnded = async () => {
      setIsPlaying(false);
      
      // Save final completion state
      if (user?.id && currentTrack) {
        await supabase.from("audio_progress").upsert({
          user_id: user.id,
          audio_id: currentTrack.id,
          current_position_seconds: Math.floor(audio.duration || 0),
          completed: true,
          last_played_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,audio_id",
        });
      }
      
      // Trigger completion callback (for celebration)
      onTrackCompleteRef.current?.();
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
        onTap: () => {
          // Navigate to the audio player when user taps Now Playing widget
          const track = currentTrackRef.current;
          if (track) {
            navigate(`/app/player/${track.id}`);
          }
        },
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
  }, [user?.id, currentTrack]);

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
      trackId: currentTrack.id,
      track: currentTrack.title,
      artist: currentTrack.playlistName || "LadyBoss Academy",
      cover: currentTrack.coverImageUrl || "",
      isPlaying,
      duration: Math.floor(duration),
      elapsed: Math.floor(currentTime),
      hasPrev: false,
      hasNext: hasNextTrack,
    });
  }, [currentTrack, isPlaying, duration, currentTime, hasNextTrack]);

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
    currentTrackRef.current = track;
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
    currentTrackRef.current = null;
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setPlaylistContextState(null);
    
    if (Capacitor.isNativePlatform()) {
      destroyMusicControls();
    }
  }, []);

  const setPlaylistContext = useCallback((context: PlaylistContext) => {
    setPlaylistContextState(context);
  }, []);

  const setOnTrackComplete = useCallback((callback: (() => void) | null) => {
    onTrackCompleteRef.current = callback;
  }, []);

  const playNextTrack = useCallback(() => {
    if (nextTrack) {
      playTrack(nextTrack, 0);
      
      // Update playlist context index
      if (playlistContext) {
        const newIndex = playlistContext.tracks.findIndex(t => t.id === nextTrack.id);
        if (newIndex >= 0) {
          setPlaylistContextState({
            ...playlistContext,
            currentIndex: newIndex,
          });
        }
      }
    }
  }, [nextTrack, playTrack, playlistContext]);

  return (
    <AudioPlayerContext.Provider
      value={{
        isPlaying,
        currentTime,
        duration,
        playbackRate,
        currentTrack,
        isLoading,
        nextTrack,
        hasNextTrack,
        playTrack,
        pause,
        resume,
        seek,
        setPlaybackRate,
        skipForward,
        skipBack,
        stop,
        setPlaylistContext,
        setOnTrackComplete,
        playNextTrack,
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
