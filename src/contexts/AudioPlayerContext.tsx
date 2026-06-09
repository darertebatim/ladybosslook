import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Capacitor } from "@capacitor/core";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useAutoCompleteProTask } from "@/hooks/useAutoCompleteProTask";
import {
  isNativeAudioAvailable,
  setNativeAudioCallbacks,
  nativeAudioPrepare,
  nativeAudioPlay,
  nativeAudioPause,
  nativeAudioStop,
  nativeAudioSeek,
  nativeAudioSetRate,
  nativeAudioGetCurrentTime,
  nativeAudioGetDuration,
  nativeAudioDestroy,
} from "@/lib/nativeAudioControls";


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
  isBuffering: boolean;
  nextTrack: TrackInfo | null;
  hasNextTrack: boolean;

  // Sleep timer
  sleepMode: SleepMode;
  sleepRemainingSeconds: number | null; // null when not a timed mode
  
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
  setSleepMode: (mode: SleepMode) => void;
}

export type SleepMode =
  | { kind: 'off' }
  | { kind: 'end-of-track' }
  | { kind: 'timer'; minutes: number; endsAt: number /* epoch ms */ };

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { autoComplete: autoCompleteProTask, autoCompletePlaylist } = useAutoCompleteProTask();
  const saveProgressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimeUpdateRef = useRef<number>(0);
  const onTrackCompleteRef = useRef<(() => void) | null>(null);
  const currentTrackRef = useRef<TrackInfo | null>(null);
  const useNative = useRef(isNativeAudioAvailable());
  const nativeTimePollerRef = useRef<NodeJS.Timeout | null>(null);
  // Active audio_listen_events row id for the current play session.
  // We insert one row each time a new track starts and update its
  // seconds_listened as the user listens, so admin analytics can
  // count plays + total time per user reliably.
  const listenEventIdRef = useRef<string | null>(null);
  const listenEventTrackIdRef = useRef<string | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [playlistContext, setPlaylistContextState] = useState<PlaylistContext | null>(null);

  // ===== Sleep timer state =====
  const [sleepMode, setSleepModeState] = useState<SleepMode>({ kind: 'off' });
  const [sleepRemainingSeconds, setSleepRemainingSeconds] = useState<number | null>(null);
  const sleepTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sleepTickRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate next available track
  const getNextAvailableTrack = useCallback((): TrackInfo | null => {
    if (!playlistContext || playlistContext.currentIndex < 0) return null;
    
    const { tracks, currentIndex, roundStartDate, roundDripOffset } = playlistContext;
    
    for (let i = currentIndex + 1; i < tracks.length; i++) {
      const track = tracks[i];
      const dripDays = track.dripDelayDays || 0;
      
      if (dripDays > 0 && roundStartDate) {
        const effectiveDripDays = dripDays - (roundDripOffset || 0);
        const startDate = new Date(roundStartDate);
        const availableDate = new Date(startDate);
        availableDate.setDate(availableDate.getDate() + effectiveDripDays);
        
        if (new Date() < availableDate) {
          continue;
        }
      }
      
      return track;
    }
    return null;
  }, [playlistContext]);

  const nextTrack = getNextAvailableTrack();
  const hasNextTrack = !!nextTrack;

  // ===== Track completion handler (shared between web & native) =====
  const handleTrackEnded = useCallback(async () => {
    setIsPlaying(false);

    // End-of-track sleep mode: when track finishes, stay paused & clear mode.
    if (sleepMode.kind === 'end-of-track') {
      setSleepModeState({ kind: 'off' });
      onTrackCompleteRef.current?.();
      return;
    }
    
    const track = currentTrackRef.current;
    
    if (user?.id && track) {
      await supabase.from("audio_progress").upsert({
        user_id: user.id,
        audio_id: track.id,
        current_position_seconds: Math.floor(duration || 0),
        completed: true,
        last_played_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,audio_id",
      });

      // Finalize listen event with full duration
      if (listenEventIdRef.current && listenEventTrackIdRef.current === track.id) {
        try {
          await supabase
            .from('audio_listen_events')
            .update({
              seconds_listened: Math.floor(duration || 0),
              updated_at: new Date().toISOString(),
            })
            .eq('id', listenEventIdRef.current);
        } catch { /* ignore */ }
        listenEventIdRef.current = null;
        listenEventTrackIdRef.current = null;
      }
      
      if (track.playlistId) {
        try {
          const today = format(new Date(), 'yyyy-MM-dd');
          const dayOfWeek = new Date().getDay();
          
          const { data: tasks } = await supabase
            .from('user_tasks')
            .select('id, scheduled_date, repeat_pattern, repeat_days')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .eq('pro_link_type', 'playlist')
            .eq('pro_link_value', track.playlistId);
          
          if (tasks && tasks.length > 0) {
            const applicableTasks = tasks.filter(task => {
              if (task.scheduled_date === today) return true;
              if (task.repeat_pattern === 'daily') return true;
              if (task.repeat_pattern === 'weekly' && task.repeat_days) {
                return (task.repeat_days as number[]).includes(dayOfWeek);
              }
              if (task.repeat_pattern === 'weekdays') {
                return dayOfWeek >= 1 && dayOfWeek <= 5;
              }
              return false;
            });
            
            if (applicableTasks.length > 0) {
              const taskIds = applicableTasks.map(t => t.id);
              
              const { data: existing } = await supabase
                .from('task_completions')
                .select('task_id')
                .eq('user_id', user.id)
                .eq('completed_date', today)
                .in('task_id', taskIds);
              
              const completedIds = new Set(existing?.map(c => c.task_id) || []);
              const toComplete = applicableTasks.filter(t => !completedIds.has(t.id));
              
              if (toComplete.length > 0) {
                await supabase.from('task_completions').insert(
                  toComplete.map(t => ({
                    task_id: t.id,
                    user_id: user.id,
                    completed_date: today,
                  }))
                );
                
                queryClient.invalidateQueries({ queryKey: ['planner-completions'] });
                queryClient.invalidateQueries({ queryKey: ['planner-completed-dates'] });
                queryClient.invalidateQueries({ queryKey: ['planner-streak'] });
                
                console.log(`Auto-completed ${toComplete.length} playlist pro task(s)`);
              }
            }
          }
        } catch (error) {
          console.error('Error auto-completing playlist task:', error);
        }
      }
    }
    
    onTrackCompleteRef.current?.();
  }, [user?.id, duration, queryClient, sleepMode]);

  // ===== Native audio callbacks =====
  useEffect(() => {
    if (!useNative.current) return;

    setNativeAudioCallbacks({
      onStatusChange: (status) => {
        if (status === 'playing') setIsPlaying(true);
        else if (status === 'paused') setIsPlaying(false);
        else if (status === 'stopped') setIsPlaying(false);
      },
      onAudioEnd: () => {
        handleTrackEnded();
      },
      onAudioReady: async () => {
        setIsLoading(false);
        setIsBuffering(false);
        const dur = await nativeAudioGetDuration();
        if (dur > 0) setDuration(dur);
      },
    });
  }, [handleTrackEnded]);

  // ===== Native time poller (since native doesn't fire timeupdate events) =====
  useEffect(() => {
    if (!useNative.current || !isPlaying) {
      if (nativeTimePollerRef.current) {
        clearInterval(nativeTimePollerRef.current);
        nativeTimePollerRef.current = null;
      }
      return;
    }

    nativeTimePollerRef.current = setInterval(async () => {
      const t = await nativeAudioGetCurrentTime();
      setCurrentTime(t);
    }, 500);

    return () => {
      if (nativeTimePollerRef.current) {
        clearInterval(nativeTimePollerRef.current);
        nativeTimePollerRef.current = null;
      }
    };
  }, [isPlaying]);

  // ===== Web HTML5 Audio setup =====
  useEffect(() => {
    if (useNative.current) return; // Skip on native

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "metadata";
    }
    
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => {
      requestAnimationFrame(() => {
        const now = Date.now();
        if (now - lastTimeUpdateRef.current > 500) {
          lastTimeUpdateRef.current = now;
          setCurrentTime(audio.currentTime);
        }
      });
    };
    
    const handleDurationChange = () => {
      setDuration(audio.duration || 0);
    };
    
    const handleEnded = () => handleTrackEnded();
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
    
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [handleTrackEnded]);

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

      // Keep the active listen event's seconds_listened in sync.
      if (listenEventIdRef.current && listenEventTrackIdRef.current === currentTrack.id) {
        try {
          await supabase
            .from('audio_listen_events')
            .update({
              seconds_listened: Math.floor(currentTime),
              updated_at: new Date().toISOString(),
            })
            .eq('id', listenEventIdRef.current);
        } catch { /* ignore */ }
      }

      // Fire 5-star review request when user completes ≥80% of an audio track
      if (duration > 0 && currentTime / duration >= 0.8) {
        const { triggerSoftReview } = await import('@/lib/appReview');
        triggerSoftReview('audio_80_percent');
      }
    };
    
    saveProgressTimeoutRef.current = setInterval(saveProgress, 5000);
    
    return () => {
      if (saveProgressTimeoutRef.current) {
        clearInterval(saveProgressTimeoutRef.current);
      }
    };
  }, [currentTrack, user?.id, isPlaying, currentTime, duration]);

  const playTrack = useCallback(async (track: TrackInfo, startPosition?: number) => {
    // Fire analytics — audio_played (fires once per track switch, not on resume)
    if (currentTrack?.id !== track.id) {
      import('@/lib/firebaseAnalytics').then(({ Analytics }) => {
        Analytics.audioPlayed(track.id, track.playlistName);
      }).catch(() => {});
    }

    // ===== NATIVE PATH =====
    if (useNative.current) {
    // If same track, just resume
      if (currentTrack?.id === track.id) {
        if (startPosition !== undefined) {
          await nativeAudioSeek(startPosition);
        }
        await nativeAudioPlay();
        setIsPlaying(true);
        return;
      }

      setCurrentTrack(track);
      currentTrackRef.current = track;
      setIsLoading(true);
      setIsBuffering(true);

      const prepared = await nativeAudioPrepare({
        source: track.fileUrl,
        title: track.title,
        artist: track.playlistName || 'Rilo',
        album: track.playlistName || '',
        artworkUrl: track.coverImageUrl || '',
      });

      if (prepared) {
        if (startPosition && startPosition > 0) {
          await nativeAudioSeek(startPosition);
        }
        await nativeAudioPlay();
        setIsPlaying(true);
        if (playbackRate !== 1) {
          await nativeAudioSetRate(playbackRate);
        }
      } else {
        setIsLoading(false);
        console.error('[AudioPlayer] Native prepare failed, no fallback');
      }

      autoCompleteProTask('audio', track.id);
      if (track.playlistId) {
        autoCompletePlaylist(track.playlistId);
      }
      return;
    }

    // ===== WEB PATH =====
    if (!audioRef.current) return;
    
    const audio = audioRef.current;
    
    if (currentTrack?.id === track.id && audio.src) {
      if (startPosition !== undefined) {
        audio.currentTime = startPosition;
      }
      try {
        await audio.play();
      } catch (e) {
        console.warn('[AudioPlayer] Resume play failed:', e);
      }
      return;
    }
    
    setCurrentTrack(track);
    currentTrackRef.current = track;
    
    audio.src = track.fileUrl;
    audio.load();
    audio.playbackRate = playbackRate;
    
    if (startPosition !== undefined) {
      audio.currentTime = startPosition;
    }
    
    try {
      await audio.play();
    } catch (e) {
      console.warn('[AudioPlayer] Play failed, waiting for canplaythrough:', e);
      await new Promise<void>((resolve) => {
        const onReady = () => {
          audio.removeEventListener('canplaythrough', onReady);
          resolve();
        };
        audio.addEventListener('canplaythrough', onReady, { once: true });
        setTimeout(() => {
          audio.removeEventListener('canplaythrough', onReady);
          resolve();
        }, 5000);
      });
      try {
        await audio.play();
      } catch (e2) {
        console.error('[AudioPlayer] Play failed after canplaythrough:', e2);
      }
    }

    autoCompleteProTask('audio', track.id);
    if (track.playlistId) {
      autoCompletePlaylist(track.playlistId);
    }
  }, [currentTrack, playbackRate, autoCompleteProTask, autoCompletePlaylist]);

  const pause = useCallback(() => {
    if (useNative.current) {
      nativeAudioPause();
      setIsPlaying(false);
    } else {
      audioRef.current?.pause();
    }
  }, []);

  const resume = useCallback(async () => {
    if (useNative.current) {
      await nativeAudioPlay();
      setIsPlaying(true);
    } else {
      try {
        await audioRef.current?.play();
      } catch (e) {
        console.warn('[AudioPlayer] Resume failed:', e);
      }
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (useNative.current) {
      const normalizedTime = Math.max(0, Math.min(Math.round(time), duration || Infinity));
      nativeAudioSeek(normalizedTime);
      setCurrentTime(normalizedTime);
    } else if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, [duration]);

  const setPlaybackRate = useCallback((rate: number) => {
    if (useNative.current) {
      nativeAudioSetRate(rate);
    } else if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    setPlaybackRateState(rate);
  }, []);

  const skipForward = useCallback(async (seconds = 15) => {
    if (useNative.current) {
      // Read native current time (poller is paused while audio is paused, so React state can be stale).
      const live = await nativeAudioGetCurrentTime();
      const base = live || currentTime || 0;
      const newTime = Math.max(0, Math.min(Math.round(base + seconds), duration || Infinity));
      await nativeAudioSeek(newTime);
      setCurrentTime(newTime);
    } else if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.currentTime + seconds,
        audioRef.current.duration || 0
      );
    }
  }, [duration, currentTime]);

  const skipBack = useCallback(async (seconds = 15) => {
    if (useNative.current) {
      const live = await nativeAudioGetCurrentTime();
      const base = live || currentTime || 0;
      const newTime = Math.max(Math.round(base - seconds), 0);
      await nativeAudioSeek(newTime);
      setCurrentTime(newTime);
    } else if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        audioRef.current.currentTime - seconds,
        0
      );
    }
  }, [currentTime]);

  const stop = useCallback(() => {
    if (useNative.current) {
      nativeAudioDestroy();
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setCurrentTrack(null);
    currentTrackRef.current = null;
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setPlaylistContextState(null);
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

  // ===== Sleep mode controls =====
  const clearSleepTimers = useCallback(() => {
    if (sleepTimeoutRef.current) {
      clearTimeout(sleepTimeoutRef.current);
      sleepTimeoutRef.current = null;
    }
    if (sleepTickRef.current) {
      clearInterval(sleepTickRef.current);
      sleepTickRef.current = null;
    }
  }, []);

  const setSleepMode = useCallback((mode: SleepMode) => {
    clearSleepTimers();
    setSleepModeState(mode);

    if (mode.kind === 'timer') {
      const tick = () => {
        const remaining = Math.max(0, Math.ceil((mode.endsAt - Date.now()) / 1000));
        setSleepRemainingSeconds(remaining);
        if (remaining <= 0) {
          // Pause playback
          if (useNative.current) {
            nativeAudioPause();
          } else {
            audioRef.current?.pause();
          }
          setIsPlaying(false);
          setSleepModeState({ kind: 'off' });
          setSleepRemainingSeconds(null);
          clearSleepTimers();
        }
      };
      tick();
      sleepTickRef.current = setInterval(tick, 1000);
    } else if (mode.kind === 'end-of-track') {
      setSleepRemainingSeconds(null);
    } else {
      setSleepRemainingSeconds(null);
    }
  }, [clearSleepTimers]);

  // Cleanup sleep timers on unmount
  useEffect(() => {
    return () => clearSleepTimers();
  }, [clearSleepTimers]);

  return (
    <AudioPlayerContext.Provider
      value={{
        isPlaying,
        currentTime,
        duration,
        playbackRate,
        currentTrack,
        isLoading,
        isBuffering,
        nextTrack,
        hasNextTrack,
        sleepMode,
        sleepRemainingSeconds,
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
        setSleepMode,
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
