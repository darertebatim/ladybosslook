import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Headphones, List, Lock, CheckCircle, Play } from "lucide-react";
import { AudioControls } from "@/components/audio/AudioControls";
import { ProgressBar } from "@/components/audio/ProgressBar";
import { BookmarkButton } from "@/components/audio/BookmarkButton";
import { BookmarksList } from "@/components/audio/BookmarksList";
import { TrackCompletionCelebration } from "@/components/audio/TrackCompletionCelebration";
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
import { useAudioPlayer, TrackInfo } from "@/contexts/AudioPlayerContext";
import { useBookmarks } from "@/hooks/useBookmarks";
import { cn } from "@/lib/utils";

export default function AppAudioPlayer() {
  const { audioId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Check if we're in module mode (navigated from modules list)
  const isModuleMode = searchParams.get('moduleMode') === 'true';
  const contextPlaylistId = searchParams.get('playlistId');
  const moduleIndex = parseInt(searchParams.get('moduleIndex') || '0', 10);
  
  // Use global audio player context
  const {
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    currentTrack,
    isLoading: audioLoading,
    nextTrack,
    hasNextTrack,
    playTrack,
    pause,
    resume,
    seek,
    setPlaybackRate,
    skipForward,
    skipBack,
    setPlaylistContext,
    setOnTrackComplete,
    playNextTrack,
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
          drip_delay_days,
          audio_playlists (
            id,
            name,
            category,
            cover_image_url
          )
        `)
        .eq('audio_id', audioId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!audioId,
  });

  // Fetch all tracks in the same playlist (traditional track mode)
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
            duration_seconds,
            cover_image_url,
            file_url
          )
        `)
        .eq('playlist_id', playlistInfo!.playlist_id)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!playlistInfo?.playlist_id && !isModuleMode,
  });

  // Fetch audio modules from playlist_supplements (module mode)
  const { data: modulePlaylist } = useQuery({
    queryKey: ['module-playlist-audio', contextPlaylistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('playlist_supplements')
        .select(`
          id,
          sort_order,
          drip_delay_days,
          audio_id,
          audio_content (
            id,
            title,
            duration_seconds,
            cover_image_url,
            file_url
          )
        `)
        .eq('playlist_id', contextPlaylistId!)
        .eq('type', 'audio')
        .not('audio_id', 'is', null)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: isModuleMode && !!contextPlaylistId,
  });

  // Fetch playlist info for module mode
  const { data: modulePlaylistInfo } = useQuery({
    queryKey: ['playlist-info-for-modules', contextPlaylistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_playlists')
        .select('id, name, category, cover_image_url')
        .eq('id', contextPlaylistId!)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: isModuleMode && !!contextPlaylistId,
  });

  // Fetch user's round for drip content calculation (including first_session_date and drip_offset_days)
  const effectivePlaylistId = isModuleMode ? contextPlaylistId : playlistInfo?.playlist_id;
  
  const { data: userRound } = useQuery({
    queryKey: ['user-round-for-playlist', effectivePlaylistId],
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
            first_session_date,
            drip_offset_days,
            audio_playlist_id
          )
        `)
        .eq('user_id', user.id)
        .eq('program_rounds.audio_playlist_id', effectivePlaylistId!)
        .eq('status', 'active')
        .maybeSingle();
      
      if (error) throw error;
      return data?.program_rounds;
    },
    enabled: !!effectivePlaylistId,
  });

  // Fetch saved progress
  const { data: savedProgress, refetch: refetchProgress } = useQuery({
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

  // Check if a track is available based on drip delay - uses first_session_date
  // drip_delay_days=0 = immediate, 1 = at first session, 2 = 1 day after first session, etc.
  const getTrackAvailability = (dripDelayDays: number) => {
    return getTrackAvailabilityWithCountdown(
      dripDelayDays, 
      userRound?.first_session_date || userRound?.start_date, // Prefer first_session_date
      userRound?.drip_offset_days || 0
    );
  };

  // Calculate current track index - works for both module mode and track mode
  const currentTrackIndex = useMemo(() => {
    if (isModuleMode && modulePlaylist) {
      return modulePlaylist.findIndex(m => m.audio_id === audioId);
    }
    return playlistTracks?.findIndex(t => t.audio_id === audioId) ?? -1;
  }, [isModuleMode, modulePlaylist, playlistTracks, audioId]);

  // Build playlist context for auto-play - supports both module and track mode
  const playlistContextTracks: TrackInfo[] = useMemo(() => {
    // Module mode: use playlist_supplements
    if (isModuleMode && modulePlaylist && modulePlaylistInfo) {
      return modulePlaylist
        .filter(m => m.audio_content) // Only include modules with audio content
        .map((module, index) => ({
          id: module.audio_content!.id,
          title: module.audio_content!.title,
          coverImageUrl: module.audio_content!.cover_image_url || modulePlaylistInfo.cover_image_url || undefined,
          playlistId: contextPlaylistId || undefined,
          playlistName: modulePlaylistInfo.name,
          trackPosition: `${index + 1}/${modulePlaylist.length}`,
          fileUrl: module.audio_content!.file_url,
          duration: module.audio_content!.duration_seconds,
          dripDelayDays: module.drip_delay_days || 0,
        }));
    }
    
    // Track mode: use audio_playlist_items
    if (!playlistTracks || !playlistInfo) return [];
    
    return playlistTracks.map((track, index) => ({
      id: track.audio_content.id,
      title: track.audio_content.title,
      coverImageUrl: track.audio_content.cover_image_url || playlistInfo.audio_playlists?.cover_image_url || undefined,
      playlistId: playlistInfo.playlist_id,
      playlistName: playlistInfo.audio_playlists?.name,
      trackPosition: `${index + 1}/${playlistTracks.length}`,
      fileUrl: track.audio_content.file_url,
      duration: track.audio_content.duration_seconds,
      dripDelayDays: track.drip_delay_days || 0,
    }));
  }, [isModuleMode, modulePlaylist, modulePlaylistInfo, contextPlaylistId, playlistTracks, playlistInfo]);

  // Set playlist context whenever it changes
  useEffect(() => {
    if (playlistContextTracks.length > 0 && currentTrackIndex >= 0) {
      setPlaylistContext({
        tracks: playlistContextTracks,
        currentIndex: currentTrackIndex,
        roundStartDate: userRound?.first_session_date || userRound?.start_date, // Use first_session_date for drip
        roundDripOffset: userRound?.drip_offset_days || 0,
      });
    }
  }, [playlistContextTracks, currentTrackIndex, userRound, setPlaylistContext]);

  // Setup completion callback
  useEffect(() => {
    setOnTrackComplete(() => {
      setShowCelebration(true);
      refetchProgress();
    });
    
    return () => setOnTrackComplete(null);
  }, [setOnTrackComplete, refetchProgress]);

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [audioId]);

  // Start playing when audio data is loaded
  useEffect(() => {
    if (audio && audioId && (!currentTrack || currentTrack.id !== audioId)) {
      // Get appropriate playlist info based on mode
      const effectiveCoverUrl = isModuleMode 
        ? (audio.cover_image_url || modulePlaylistInfo?.cover_image_url)
        : (audio.cover_image_url || playlistInfo?.audio_playlists?.cover_image_url);
      const effectivePlaylistIdForTrack = isModuleMode ? contextPlaylistId : playlistInfo?.playlist_id;
      const effectivePlaylistName = isModuleMode ? modulePlaylistInfo?.name : playlistInfo?.audio_playlists?.name;
      const trackCount = isModuleMode ? modulePlaylist?.length : playlistTracks?.length;
      
      playTrack({
        id: audio.id,
        title: audio.title,
        coverImageUrl: effectiveCoverUrl || undefined,
        playlistId: effectivePlaylistIdForTrack || undefined,
        playlistName: effectivePlaylistName || undefined,
        trackPosition: trackCount && currentTrackIndex >= 0 
          ? `${currentTrackIndex + 1}/${trackCount}` 
          : undefined,
        fileUrl: audio.file_url,
        duration: audio.duration_seconds,
      }, savedProgress?.current_position_seconds || 0);
    }
  }, [audio, audioId, playlistInfo, playlistTracks, savedProgress, isModuleMode, modulePlaylist, modulePlaylistInfo, contextPlaylistId, currentTrackIndex]);

  // Handle celebration close - in module mode, return to course page
  const handleCelebrationClose = () => {
    setShowCelebration(false);
    
    // In module mode, return to course page so user can see the actual next module
    if (isModuleMode && contextPlaylistId) {
      navigate(`/app/player/playlist/${contextPlaylistId}?completedIndex=${moduleIndex}`, { replace: true });
    }
  };

  const handlePlayNext = () => {
    // In module mode, navigate back to course page to auto-open next module
    if (isModuleMode && contextPlaylistId) {
      setShowCelebration(false);
      navigate(`/app/player/playlist/${contextPlaylistId}?completedIndex=${moduleIndex}`, { replace: true });
      return;
    }
    
    // Traditional track mode: play next audio directly
    playNextTrack();
    if (nextTrack) {
      navigate(`/app/player/${nextTrack.id}`);
    }
  };

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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if current track is completed
  const isTrackCompleted = savedProgress?.completed === true;

  // Check if this is the last track in playlist
  const isPlaylistComplete = !hasNextTrack && playlistTracks && currentTrackIndex === playlistTracks.length - 1;

  // Get cover image with playlist fallback
  const coverImageUrl = audio?.cover_image_url || playlistInfo?.audio_playlists?.cover_image_url;

  if (isLoading) {
    return (
      <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
        {/* Fixed Header Skeleton */}
        <div 
          className="fixed top-0 left-0 right-0 z-50 bg-[#F4ECFE]/80 dark:bg-violet-950/80 backdrop-blur-xl rounded-b-3xl shadow-sm"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="pt-3 pb-2 px-4 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        
        {/* Header Spacer */}
        <div style={{ height: 'calc(48px + env(safe-area-inset-top, 0px))' }} className="shrink-0" />
        
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <Skeleton className="aspect-square w-full max-w-[220px] rounded-2xl mb-6" />
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-8" />
        </div>
        
        <div className="pb-safe" />
      </div>
    );
  }

  if (!audio) {
    return (
      <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div 
          className="fixed top-0 left-0 right-0 z-50 bg-[#F4ECFE]/80 dark:bg-violet-950/80 backdrop-blur-xl rounded-b-3xl shadow-sm"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="pt-3 pb-2 px-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/app/player')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Library
            </Button>
          </div>
        </div>
        
        {/* Header Spacer */}
        <div style={{ height: 'calc(48px + env(safe-area-inset-top, 0px))' }} className="shrink-0" />
        
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Audio not found</p>
            <Button onClick={() => navigate('/app/player')}>
              Back to Library
            </Button>
          </div>
        </div>
        
        <div className="pb-safe" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-background relative overflow-hidden flex flex-col">
      {/* Track Completion Celebration */}
      <TrackCompletionCelebration
        isOpen={showCelebration}
        onClose={handleCelebrationClose}
        trackTitle={audio.title}
        nextTrack={nextTrack ? {
          title: nextTrack.title,
          coverImageUrl: nextTrack.coverImageUrl,
        } : null}
        onPlayNext={handlePlayNext}
        isPlaylistComplete={isPlaylistComplete}
      />

      {/* Blurred Background with Cover Art */}
      {coverImageUrl && (
        <div className="fixed inset-0 z-0">
          <img
            src={coverImageUrl}
            alt=""
            className="w-full h-full object-cover scale-110 blur-3xl opacity-30 dark:opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>
      )}

      {/* Fixed Header */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 bg-[#F4ECFE]/80 dark:bg-violet-950/80 backdrop-blur-xl rounded-b-3xl shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="pt-3 pb-2 px-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const backPlaylistId = isModuleMode ? contextPlaylistId : playlistInfo?.playlist_id;
              if (backPlaylistId) {
                navigate(`/app/player/playlist/${backPlaylistId}`);
              } else {
                navigate('/app/player');
              }
            }}
            className="rounded-full shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {(isModuleMode ? modulePlaylistInfo : playlistInfo) ? (
              <button
                onClick={() => {
                  const navPlaylistId = isModuleMode ? contextPlaylistId : playlistInfo?.playlist_id;
                  if (navPlaylistId) navigate(`/app/player/playlist/${navPlaylistId}`);
                }}
                className="text-sm font-medium hover:text-primary transition-colors truncate"
              >
                {isModuleMode ? modulePlaylistInfo?.name : playlistInfo?.audio_playlists.name}
              </button>
            ) : (
              <span className="text-sm font-medium">Now Playing</span>
            )}
            {currentTrackIndex >= 0 && (
              <span className="text-xs text-muted-foreground shrink-0">
                • {currentTrackIndex + 1}/{isModuleMode ? modulePlaylist?.length : playlistTracks?.length}
              </span>
            )}
          </div>

          {/* Bookmark Button */}
          <BookmarkButton
            currentTime={currentTime}
            onAddBookmark={addBookmark}
            isAdding={isAddingBookmark}
          />

          {/* Track List Sheet - supports both module mode and track mode */}
          {((isModuleMode && modulePlaylist && modulePlaylist.length > 1) || 
            (!isModuleMode && playlistTracks && playlistTracks.length > 1)) && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full shrink-0">
                  <List className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[70vh]">
                <SheetHeader>
                  <SheetTitle>{isModuleMode ? 'Course Modules' : 'Playlist Tracks'}</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-2 overflow-y-auto h-[calc(70vh-80px)]">
                  {isModuleMode && modulePlaylist ? (
                    // Module mode track list
                    modulePlaylist.map((module, index) => {
                      const { isAvailable, countdownText } = getTrackAvailability(module.drip_delay_days || 0);
                      
                      return (
                        <button
                          key={module.id}
                          onClick={() => {
                            if (isAvailable && module.audio_id) {
                              navigate(`/app/player/${module.audio_id}?moduleMode=true&playlistId=${contextPlaylistId}&moduleIndex=${index}`);
                            }
                          }}
                          disabled={!isAvailable}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${
                            !isAvailable
                              ? 'opacity-60 bg-muted/30 cursor-not-allowed'
                              : module.audio_id === audioId 
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
                                module.audio_id === audioId ? 'text-primary' : ''
                              }`}>
                                {module.audio_content?.title}
                              </p>
                              {!isAvailable && countdownText && (
                                <p className="text-xs text-muted-foreground">
                                  {countdownText}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {module.audio_content?.duration_seconds ? formatDuration(module.audio_content.duration_seconds) : '--:--'}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    // Traditional track mode
                    playlistTracks?.map((track, index) => {
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
                    })
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>

      {/* Header Spacer */}
      <div style={{ height: 'calc(48px + env(safe-area-inset-top, 0px))' }} className="shrink-0" />

      {/* Main Content - Centered vertically */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-3 overflow-hidden">
        <div className="max-w-md w-full flex flex-col gap-3">
          {/* Cover Art - Constrained size */}
          <div className="w-full max-w-[220px] mx-auto rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] shrink-0">
            {coverImageUrl ? (
              <img
                src={coverImageUrl}
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
            {/* Completed Badge */}
            {isTrackCompleted && (
              <Badge variant="secondary" className="mt-2 gap-1 bg-green-500/10 text-green-600 border-green-500/20">
                <CheckCircle className="h-3 w-3" />
                Completed
              </Badge>
            )}
          </div>

          {/* Progress Bar */}
          <div className="shrink-0">
            <ProgressBar
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
              variant="default"
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
              variant="default"
            />
          </div>

          {/* Up Next Preview */}
          {nextTrack && (
            <button
              onClick={() => navigate(`/app/player/${nextTrack.id}`)}
              className={cn(
                "w-full mt-2 p-3 rounded-xl",
                "bg-muted/30 hover:bg-muted/50 transition-colors",
                "border border-border/30"
              )}
            >
              <p className="text-xs text-muted-foreground mb-2 text-left">Up Next</p>
              <div className="flex items-center gap-3">
                {nextTrack.coverImageUrl ? (
                  <img
                    src={nextTrack.coverImageUrl}
                    alt={nextTrack.title}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Play className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate">{nextTrack.title}</p>
                  {nextTrack.duration && (
                    <p className="text-xs text-muted-foreground">
                      {formatDuration(nextTrack.duration)}
                    </p>
                  )}
                </div>
                <Play className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          )}
          
          {/* Bottom safe area padding */}
          <div className="pb-safe" />
        </div>
      </div>
    </div>
  );
}
