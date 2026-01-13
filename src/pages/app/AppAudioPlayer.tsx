import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Headphones, List, Lock } from "lucide-react";
import { AudioControls } from "@/components/audio/AudioControls";
import { ProgressBar } from "@/components/audio/ProgressBar";
import { BookmarkButton } from "@/components/audio/BookmarkButton";
import { BookmarksList } from "@/components/audio/BookmarksList";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
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

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [audioId]);

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
    <div className="h-[100dvh] bg-background relative overflow-hidden flex flex-col">
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

      {/* Fixed Header with safe area - matching AppHeader padding */}
      <div 
        className="relative z-50 bg-background/60 backdrop-blur-xl border-b border-border/50 shrink-0"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="pt-3 pb-2 px-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => playlistInfo?.playlist_id ? navigate(`/app/player/playlist/${playlistInfo.playlist_id}`) : navigate('/app/player')}
            className="rounded-full shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {playlistInfo ? (
              <button
                onClick={() => navigate(`/app/player/playlist/${playlistInfo.playlist_id}`)}
                className="text-sm font-medium hover:text-primary transition-colors truncate"
              >
                {playlistInfo.audio_playlists.name}
              </button>
            ) : (
              <span className="text-sm font-medium">Now Playing</span>
            )}
            {playlistTracks && currentTrackIndex >= 0 && (
              <span className="text-xs text-muted-foreground shrink-0">
                • {currentTrackIndex + 1}/{playlistTracks.length}
              </span>
            )}
          </div>

          {/* Bookmark Button */}
          <BookmarkButton
            currentTime={currentTime}
            onAddBookmark={addBookmark}
            isAdding={isAddingBookmark}
          />

          {playlistTracks && playlistTracks.length > 1 && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full shrink-0">
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

      {/* Main Content - Centered vertically */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-3 overflow-hidden">
        <div className="max-w-md w-full flex flex-col gap-3">
          {/* Cover Art - Constrained size */}
          <div className="w-full max-w-[220px] mx-auto rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] shrink-0">
            {audio.cover_image_url ? (
              <img
                src={audio.cover_image_url}
                alt={audio.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center backdrop-blur-xl">
                <Headphones className="h-16 w-16 text-primary/40" />
              </div>
            )}
          </div>

          {/* Title & Description - Compact */}
          <div className="text-center shrink-0">
            <h1 className="text-lg font-bold leading-tight line-clamp-2">{audio.title}</h1>
            {audio.description && (
              <p className="text-muted-foreground text-sm line-clamp-1 mt-1">{audio.description}</p>
            )}
          </div>

          {/* Progress Bar */}
          <div className="shrink-0">
            <ProgressBar
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
              variant={audio.cover_image_url ? "glass" : "default"}
            />
          </div>

          {/* Controls */}
          <div className="shrink-0">
            <AudioControls
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onSkipBack={handleSkipBack}
              onSkipForward={handleSkipForward}
              playbackRate={playbackRate}
              onPlaybackRateChange={handlePlaybackRateChange}
              variant={audio.cover_image_url ? "glass" : "default"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
