import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Headphones, ChevronLeft, ChevronRight, List, Lock } from "lucide-react";
import { AudioControls } from "@/components/audio/AudioControls";
import { ProgressBar } from "@/components/audio/ProgressBar";
import { BookmarkButton } from "@/components/audio/BookmarkButton";
import { BookmarksList } from "@/components/audio/BookmarksList";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
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
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useBookmarks } from "@/hooks/useBookmarks";

export default function AppAudioPlayer() {
  const { audioId } = useParams();
  const navigate = useNavigate();
  
  // Use global audio player context
  const {
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    currentTrack,
    isLoading: audioLoading,
    playTrack,
    pause,
    resume,
    seek,
    setPlaybackRate,
    skipForward,
    skipBack,
  } = useAudioPlayer();

  // Bookmarks
  const { 
    bookmarks, 
    addBookmark, 
    deleteBookmark, 
    isAdding: isAddingBookmark,
    isDeleting: isDeletingBookmark 
  } = useBookmarks(audioId);

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

  // Fetch user's round for drip content calculation (including drip_offset_days)
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
            drip_offset_days,
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

  // Fetch saved progress
  const { data: savedProgress } = useQuery({
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

  // Check if a track is available based on drip delay - now with countdown and offset
  const getTrackAvailability = (dripDelayDays: number) => {
    return getTrackAvailabilityWithCountdown(
      dripDelayDays, 
      userRound?.start_date,
      userRound?.drip_offset_days || 0
    );
  };

  // Start playing when audio data is loaded
  useEffect(() => {
    if (audio && audioId && (!currentTrack || currentTrack.id !== audioId)) {
      const currentTrackIndex = playlistTracks?.findIndex(t => t.audio_id === audioId) ?? -1;
      
      playTrack({
        id: audio.id,
        title: audio.title,
        coverImageUrl: audio.cover_image_url || undefined,
        playlistId: playlistInfo?.playlist_id,
        playlistName: playlistInfo?.audio_playlists?.name,
        trackPosition: playlistTracks && currentTrackIndex >= 0 
          ? `${currentTrackIndex + 1}/${playlistTracks.length}` 
          : undefined,
        fileUrl: audio.file_url,
        duration: audio.duration_seconds,
      }, savedProgress?.current_position_seconds || 0);
    }
  }, [audio, audioId, playlistInfo, playlistTracks, savedProgress]);

  // Playback controls
  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const handleSeek = (time: number) => {
    seek(time);
  };

  const handleSkipBack = () => {
    skipBack(10);
  };

  const handleSkipForward = () => {
    skipForward(10);
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Blurred Background with Cover Art */}
      {audio.cover_image_url && (
        <div className="fixed inset-0 z-0">
          <img
            src={audio.cover_image_url}
            alt=""
            className="w-full h-full object-cover scale-110 blur-3xl opacity-30 dark:opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>
      )}

      {/* Fixed Header with safe area */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/50"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="pt-6 pb-3 px-4 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => playlistInfo?.playlist_id ? navigate(`/app/player/playlist/${playlistInfo.playlist_id}`) : navigate('/app/player')}
            className="rounded-full"
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

          {/* Bookmark Button */}
          <BookmarkButton
            currentTime={currentTime}
            onAddBookmark={addBookmark}
            isAdding={isAddingBookmark}
          />

          {playlistTracks && playlistTracks.length > 1 && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
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
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          !isAvailable
                            ? 'opacity-60 bg-muted/30 cursor-not-allowed'
                            : track.audio_id === audioId 
                              ? 'bg-primary/10 border-primary shadow-sm' 
                              : 'hover:bg-accent hover:shadow-sm'
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

      <div className="relative z-10 p-4 pb-24">
        <div className="max-w-md mx-auto space-y-8">
          {/* Cover Art with enhanced shadow */}
          <div className="aspect-square rounded-3xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] animate-scale-in">
            {audio.cover_image_url ? (
              <img
                src={audio.cover_image_url}
                alt={audio.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center backdrop-blur-xl">
                <Headphones className="h-24 w-24 text-primary/40" />
              </div>
            )}
          </div>

          {/* Title & Description - Glass Card */}
          <div className="text-center space-y-3 p-4 rounded-2xl bg-card/50 backdrop-blur-md border border-border/30">
            <h1 className="text-2xl font-bold leading-tight">{audio.title}</h1>
            {audio.description && (
              <p className="text-muted-foreground text-sm line-clamp-2">{audio.description}</p>
            )}
          </div>

          {/* Progress Bar */}
          <ProgressBar
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
          />

          {/* Bookmarks List */}
          {bookmarks.length > 0 && (
            <div className="flex justify-center">
              <BookmarksList
                bookmarks={bookmarks}
                onSeek={handleSeek}
                onDelete={deleteBookmark}
                isDeleting={isDeletingBookmark}
              />
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

          {/* Track Navigation */}
          {(hasPrevious || hasNext) && (
            <div className="flex justify-center items-center gap-6">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousTrack}
                disabled={!hasPrevious}
                className="rounded-full h-12 w-12"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <span className="text-sm text-muted-foreground font-medium">
                {currentTrackIndex + 1} / {playlistTracks?.length}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextTrack}
                disabled={!hasNext}
                className="rounded-full h-12 w-12"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          )}

          {/* Up Next Section - only show available tracks */}
          {upNextTracks.filter(t => getTrackAvailability(t.drip_delay_days || 0).isAvailable).length > 0 && (
            <div className="space-y-3 p-4 rounded-2xl bg-card/50 backdrop-blur-md border border-border/30">
              <h3 className="text-sm font-semibold text-muted-foreground">Up Next</h3>
              <div className="space-y-2">
                {upNextTracks
                  .filter(t => getTrackAvailability(t.drip_delay_days || 0).isAvailable)
                  .map((track, index) => (
                    <button
                      key={track.audio_id}
                      onClick={() => navigate(`/app/player/${track.audio_id}`)}
                      className="w-full text-left p-3 rounded-xl hover:bg-accent/50 transition-all active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-6 font-medium">
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
        </div>
      </div>
    </div>
  );
}
