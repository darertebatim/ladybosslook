import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Headphones, ChevronLeft, ChevronRight, List, Lock } from "lucide-react";
import { AudioControls } from "@/components/audio/AudioControls";
import { ProgressBar } from "@/components/audio/ProgressBar";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getTrackAvailabilityWithCountdown } from "@/lib/dripContent";

export default function AppAudioPlayer() {
  const { audioId } = useParams();
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);
  const queryClient = useQueryClient();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Fetch audio content
  const { data: audio, isLoading } = useQuery({
    queryKey: ['audio-content', audioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_content')
        .select('*')
        .eq('id', audioId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!audioId,
  });

  // Fetch playlist info for current audio
  const { data: playlistInfo } = useQuery({
    queryKey: ['audio-playlist-info', audioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_playlist_items')
        .select(`
          playlist_id,
          sort_order,
          audio_playlists (
            id,
            name,
            category
          )
        `)
        .eq('audio_id', audioId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!audioId,
  });

  // Fetch all tracks in the same playlist
  const { data: playlistTracks } = useQuery({
    queryKey: ['playlist-all-tracks', playlistInfo?.playlist_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_playlist_items')
        .select(`
          audio_id,
          sort_order,
          drip_delay_days,
          audio_content (
            id,
            title,
            duration_seconds
          )
        `)
        .eq('playlist_id', playlistInfo!.playlist_id)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!playlistInfo?.playlist_id,
  });

  // Fetch user's round for drip content calculation
  const { data: userRound } = useQuery({
    queryKey: ['user-round-for-playlist', playlistInfo?.playlist_id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          round_id,
          program_rounds!inner (
            id,
            start_date,
            audio_playlist_id
          )
        `)
        .eq('user_id', user.id)
        .eq('program_rounds.audio_playlist_id', playlistInfo!.playlist_id)
        .eq('status', 'active')
        .maybeSingle();
      
      if (error) throw error;
      return data?.program_rounds;
    },
    enabled: !!playlistInfo?.playlist_id,
  });

  // Check if a track is available based on drip delay - now with countdown
  const getTrackAvailability = (dripDelayDays: number) => {
    return getTrackAvailabilityWithCountdown(dripDelayDays, userRound?.start_date);
  };

  // Fetch progress
  const { data: progress } = useQuery({
    queryKey: ['audio-progress', audioId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('audio_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('audio_id', audioId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!audioId,
  });

  // Save progress mutation
  const saveProgressMutation = useMutation({
    mutationFn: async (position: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('audio_progress')
        .upsert({
          user_id: user.id,
          audio_id: audioId!,
          current_position_seconds: Math.floor(position),
          completed: duration > 0 && position >= duration * 0.95,
          last_played_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audio-progress'] });
    },
  });

  // Load initial progress
  useEffect(() => {
    if (progress && audioRef.current) {
      audioRef.current.currentTime = progress.current_position_seconds;
      setCurrentTime(progress.current_position_seconds);
    }
  }, [progress]);

  // Audio element event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      saveProgressMutation.mutate(audio.duration);
      
      // Auto-advance to next track if available and not locked
      const currentIndex = playlistTracks?.findIndex(t => t.audio_id === audioId);
      if (currentIndex !== undefined && currentIndex >= 0 && playlistTracks && currentIndex < playlistTracks.length - 1) {
        const nextTrack = playlistTracks[currentIndex + 1];
        const { isAvailable } = getTrackAvailability(nextTrack.drip_delay_days || 0);
        if (isAvailable) {
          navigate(`/app/player/${nextTrack.audio_id}`);
        }
      }
    };
    const handleError = (e: Event) => {
      const target = e.target as HTMLAudioElement;
      console.error('Audio error:', {
        error: target.error,
        networkState: target.networkState,
        readyState: target.readyState,
        src: target.src
      });
      
      let errorMessage = 'Failed to load audio file';
      if (target.error) {
        switch (target.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Audio loading aborted';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error loading audio';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'Audio file corrupted';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Audio format not supported or file not accessible';
            break;
        }
      }
      
      toast.error(errorMessage);
      setIsPlaying(false);
    };
    const handleLoadedMetadata = () => {
      console.log('Audio loaded successfully, duration:', audio.duration);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [audio?.file_url, playlistTracks, audioId]);

  // Save progress every 5 seconds
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (audioRef.current) {
        saveProgressMutation.mutate(audioRef.current.currentTime);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Playback controls
  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        toast.error('Failed to play audio');
        console.error(err);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSkipBack = () => {
    handleSeek(Math.max(0, currentTime - 10));
  };

  const handleSkipForward = () => {
    handleSeek(Math.min(duration, currentTime + 10));
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  // Track navigation - check availability for drip content
  const currentTrackIndex = playlistTracks?.findIndex(t => t.audio_id === audioId) ?? -1;
  
  // Find available previous track
  const previousAvailableIndex = (() => {
    if (currentTrackIndex <= 0 || !playlistTracks) return -1;
    for (let i = currentTrackIndex - 1; i >= 0; i--) {
      const { isAvailable } = getTrackAvailability(playlistTracks[i].drip_delay_days || 0);
      if (isAvailable) return i;
    }
    return -1;
  })();
  
  // Find available next track
  const nextAvailableIndex = (() => {
    if (!playlistTracks || currentTrackIndex < 0 || currentTrackIndex >= playlistTracks.length - 1) return -1;
    for (let i = currentTrackIndex + 1; i < playlistTracks.length; i++) {
      const { isAvailable } = getTrackAvailability(playlistTracks[i].drip_delay_days || 0);
      if (isAvailable) return i;
    }
    return -1;
  })();
  
  const hasPrevious = previousAvailableIndex >= 0;
  const hasNext = nextAvailableIndex >= 0;

  const handlePreviousTrack = () => {
    if (hasPrevious && playlistTracks) {
      const prevTrack = playlistTracks[previousAvailableIndex];
      navigate(`/app/player/${prevTrack.audio_id}`);
    }
  };

  const handleNextTrack = () => {
    if (hasNext && playlistTracks) {
      const nextTrack = playlistTracks[nextAvailableIndex];
      navigate(`/app/player/${nextTrack.audio_id}`);
    }
  };

  const upNextTracks = playlistTracks?.slice(currentTrackIndex + 1, currentTrackIndex + 4) || [];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Skeleton className="h-8 w-8 mb-6" />
        <Skeleton className="aspect-square w-full max-w-md mx-auto mb-6" />
        <Skeleton className="h-8 w-3/4 mx-auto mb-2" />
        <Skeleton className="h-4 w-1/2 mx-auto mb-8" />
      </div>
    );
  }

  if (!audio) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Audio not found</p>
          <Button onClick={() => navigate('/app/player')}>
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Fixed Header with safe area */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="pt-6 pb-3 px-4 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => playlistInfo?.playlist_id ? navigate(`/app/player/playlist/${playlistInfo.playlist_id}`) : navigate('/app/player')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          {playlistInfo && (
            <div className="flex-1 min-w-0">
              <button
                onClick={() => navigate(`/app/player/playlist/${playlistInfo.playlist_id}`)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors truncate block"
              >
                {playlistInfo.audio_playlists.name}
              </button>
              {playlistTracks && currentTrackIndex >= 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    Track {currentTrackIndex + 1} of {playlistTracks.length}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {!playlistInfo && (
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-lg truncate">Now Playing</h1>
            </div>
          )}

          {playlistTracks && playlistTracks.length > 1 && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <List className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[70vh]">
                <SheetHeader>
                  <SheetTitle>Playlist Tracks</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-2 overflow-y-auto h-[calc(70vh-80px)]">
                  {playlistTracks.map((track, index) => {
                    const { isAvailable, countdownText } = getTrackAvailability(track.drip_delay_days || 0);
                    
                    return (
                      <button
                        key={track.audio_id}
                        onClick={() => isAvailable && navigate(`/app/player/${track.audio_id}`)}
                        disabled={!isAvailable}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          !isAvailable
                            ? 'opacity-60 bg-muted/30 cursor-not-allowed'
                            : track.audio_id === audioId 
                              ? 'bg-primary/10 border-primary' 
                              : 'hover:bg-accent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {!isAvailable ? (
                            <Lock className="h-4 w-4 text-muted-foreground w-6" />
                          ) : (
                            <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              track.audio_id === audioId ? 'text-primary' : ''
                            }`}>
                              {track.audio_content.title}
                            </p>
                            {!isAvailable && countdownText && (
                              <p className="text-xs text-muted-foreground">
                                {countdownText}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDuration(track.audio_content.duration_seconds)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>

      {/* Header spacer */}
      <div style={{ height: 'calc(76px + env(safe-area-inset-top, 0px))' }} />

      <div className="p-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* Cover Art */}
          <div className="aspect-square rounded-lg overflow-hidden shadow-2xl">
            {audio.cover_image_url ? (
              <img
                src={audio.cover_image_url}
                alt={audio.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Headphones className="h-24 w-24 text-primary/40" />
              </div>
            )}
          </div>

          {/* Title & Description */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">{audio.title}</h1>
            {audio.description && (
              <p className="text-muted-foreground text-sm">{audio.description}</p>
            )}
          </div>

          {/* Progress Bar */}
          <ProgressBar
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
          />

          {/* Track Navigation */}
          {(hasPrevious || hasNext) && (
            <div className="flex justify-center items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousTrack}
                disabled={!hasPrevious}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentTrackIndex + 1} / {playlistTracks?.length}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextTrack}
                disabled={!hasNext}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Controls */}
          <AudioControls
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onSkipBack={handleSkipBack}
            onSkipForward={handleSkipForward}
            playbackRate={playbackRate}
            onPlaybackRateChange={handlePlaybackRateChange}
          />

          {/* Up Next Section - only show available tracks */}
          {upNextTracks.filter(t => getTrackAvailability(t.drip_delay_days || 0).isAvailable).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Up Next</h3>
              <div className="space-y-2">
                {upNextTracks
                  .filter(t => getTrackAvailability(t.drip_delay_days || 0).isAvailable)
                  .map((track, index) => (
                    <button
                      key={track.audio_id}
                      onClick={() => navigate(`/app/player/${track.audio_id}`)}
                      className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-6">
                          {currentTrackIndex + index + 2}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {track.audio_content.title}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(track.audio_content.duration_seconds)}
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Hidden Audio Element */}
          <audio
            ref={audioRef}
            src={audio.file_url}
            preload="metadata"
            crossOrigin="anonymous"
          />
        </div>
      </div>
    </div>
  );
}
