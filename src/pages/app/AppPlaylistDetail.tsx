import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Play, CheckCircle2, Circle, Music, Clock, Lock, FileText, Video, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SupplementViewer } from "@/components/app/SupplementViewer";
import { isNativeApp } from "@/lib/platform";
import { getTrackAvailabilityWithCountdown } from "@/lib/dripContent";
import { useEnrollments } from "@/hooks/useAppData";

export default function AppPlaylistDetail() {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const [selectedSupplement, setSelectedSupplement] = useState<{
    title: string;
    type: string;
    url: string;
    description?: string;
  } | null>(null);

  // Fetch playlist details
  const { data: playlist, isLoading: playlistLoading } = useQuery({
    queryKey: ['playlist', playlistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_playlists')
        .select('*')
        .eq('id', playlistId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch tracks in playlist
  const { data: tracks, isLoading: tracksLoading } = useQuery({
    queryKey: ['playlist-tracks', playlistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_playlist_items')
        .select(`
          id,
          sort_order,
          drip_delay_days,
          audio_id,
          audio_content (
            id,
            title,
            description,
            duration_seconds,
            cover_image_url
          )
        `)
        .eq('playlist_id', playlistId)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      // Sort by sort_order, then by title as fallback
      const sorted = (data || []).sort((a, b) => {
        if (a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order;
        }
        // If sort_order is the same, sort by title
        return a.audio_content.title.localeCompare(b.audio_content.title);
      });
      
      return sorted;
    },
    enabled: !!playlistId,
  });

  // Fetch user's progress
  const { data: progressData } = useQuery({
    queryKey: ['playlist-progress', playlistId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const audioIds = tracks?.map(t => t.audio_content.id) || [];
      if (audioIds.length === 0) return [];

      const { data, error } = await supabase
        .from('audio_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('audio_id', audioIds);
      
      if (error) throw error;
      return data;
    },
    enabled: !!tracks && tracks.length > 0,
  });

  // Fetch supplements
  const { data: supplements } = useQuery({
    queryKey: ['playlist-supplements', playlistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('playlist_supplements')
        .select('*')
        .eq('playlist_id', playlistId)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!playlistId,
  });

  // Use centralized enrollments hook - single source of truth
  const { data: enrollments } = useEnrollments();

  // Fetch user's round for this playlist (to get start_date and drip_offset_days for drip content)
  const { data: userRound } = useQuery({
    queryKey: ['user-round-for-playlist', playlistId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Find the user's enrollment that has a round linked to this playlist
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
        .eq('program_rounds.audio_playlist_id', playlistId)
        .eq('status', 'active')
        .maybeSingle();
      
      if (error) throw error;
      return data?.program_rounds;
    },
    enabled: !!playlistId && !playlist?.is_free,
  });

  console.log('Debug - Playlist:', playlist?.name, 'Program Slug:', playlist?.program_slug, 'Is Free:', playlist?.is_free);
  console.log('Debug - User Enrollments:', enrollments);
  console.log('Debug - Has Access Check:', playlist?.is_free || enrollments?.includes(playlist?.program_slug));
  
  const hasAccess = playlist?.is_free || enrollments?.includes(playlist?.program_slug);

  const getTrackProgress = (audioId: string) => {
    const progress = progressData?.find(p => p.audio_id === audioId);
    if (!progress) return { percentage: 0, completed: false };
    
    const track = tracks?.find(t => t.audio_content.id === audioId);
    const duration = track?.audio_content.duration_seconds || 1;
    const percentage = (progress.current_position_seconds / duration) * 100;
    
    return {
      percentage: Math.min(percentage, 100),
      completed: progress.completed || percentage >= 95,
    };
  };

  // Check if a track is available based on drip delay - now with countdown and offset
  const getTrackAvailability = (dripDelayDays: number) => {
    // Free playlists = all tracks available
    if (playlist?.is_free) {
      return { isAvailable: true, availableDate: null, countdownText: null };
    }
    
    return getTrackAvailabilityWithCountdown(
      dripDelayDays, 
      userRound?.start_date,
      userRound?.drip_offset_days || 0
    );
  };

  const completedCount = tracks?.filter(t => getTrackProgress(t.audio_content.id).completed).length || 0;
  const totalTracks = tracks?.length || 0;
  const overallProgress = totalTracks > 0 ? (completedCount / totalTracks) * 100 : 0;

  // Find first incomplete track that is also available
  const firstIncompleteTrack = tracks?.find(t => {
    const { isAvailable } = getTrackAvailability(t.drip_delay_days || 0);
    return isAvailable && !getTrackProgress(t.audio_content.id).completed;
  });

  const handleContinue = () => {
    if (!hasAccess) return;
    const trackToPlay = firstIncompleteTrack || tracks?.find(t => getTrackAvailability(t.drip_delay_days || 0).isAvailable);
    if (trackToPlay) {
      navigate(`/app/player/${trackToPlay.audio_content.id}`);
    }
  };

  const handleTrackClick = (audioId: string, dripDelayDays: number) => {
    if (!hasAccess) return;
    const { isAvailable } = getTrackAvailability(dripDelayDays);
    if (!isAvailable) return;
    navigate(`/app/player/${audioId}`);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryLabel = () => {
    switch (playlist?.category) {
      case 'audiobook': return 'Audiobook';
      case 'course_supplement': return 'Course';
      case 'podcast': return 'Podcast';
      default: return 'Audio';
    }
  };

  const getSupplementIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-5 w-5" />;
      case 'pdf': return <FileText className="h-5 w-5" />;
      case 'link': return <ExternalLink className="h-5 w-5" />;
      default: return null;
    }
  };

  if (playlistLoading || tracksLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4 space-y-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-12 w-full" />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Playlist not found</p>
          <Button onClick={() => navigate('/app/player')}>Back to Library</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Fixed Header with safe area + visual padding */}
      <div 
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="pt-3 pb-2 px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/player')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Library
          </Button>
        </div>
      </div>

      {/* Header spacer */}
      <div style={{ height: 'calc(48px + env(safe-area-inset-top, 0px))' }} />

      {/* Playlist Info */}
      <div className="p-4 space-y-4">
        <div className="flex gap-4">
          <div className="relative h-32 w-32 flex-shrink-0 rounded-lg overflow-hidden">
            {tracks?.[0]?.audio_content.cover_image_url ? (
              <img 
                src={tracks?.[0]?.audio_content.cover_image_url} 
                alt={playlist.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Music className="h-12 w-12 text-primary/40" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex gap-2 flex-wrap">
              {playlist.category && (
                <Badge variant="secondary">{getCategoryLabel()}</Badge>
              )}
              {playlist.is_free && <Badge className="bg-green-500">FREE</Badge>}
              {!hasAccess && <Badge variant="destructive">Locked</Badge>}
            </div>
            <h1 className="text-2xl font-bold">{playlist.name}</h1>
            {playlist.description && (
              <p className="text-sm text-muted-foreground">{playlist.description}</p>
            )}
          </div>
        </div>

        {/* Progress */}
        {hasAccess && totalTracks > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {completedCount}/{totalTracks} tracks completed
              </span>
              <span className="font-medium">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
        )}

        {/* Continue Button */}
        {hasAccess && tracks && tracks.length > 0 && (
          <Button onClick={handleContinue} className="w-full" size="lg">
            <Play className="h-5 w-5 mr-2" />
            {firstIncompleteTrack ? 'Continue Listening' : 'Play from Start'}
          </Button>
        )}

        {!hasAccess && (
          <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isNativeApp() 
                ? 'This content is not available in your subscription'
                : `Enroll in ${playlist.program_slug} to access this content`
              }
            </p>
          </div>
        )}
      </div>

      {/* Course Supplements */}
      {hasAccess && supplements && supplements.length > 0 && (
        <div className="px-4 pb-4">
          <h2 className="text-lg font-semibold mb-3">Course Supplements</h2>
          <div className="space-y-2">
            {supplements.map((supplement) => (
              <button
                key={supplement.id}
                onClick={() => {
                  if (supplement.type === 'link') {
                    window.open(supplement.url, '_blank', 'noopener,noreferrer');
                  } else {
                    setSelectedSupplement({
                      title: supplement.title,
                      type: supplement.type,
                      url: supplement.url,
                      description: supplement.description || undefined,
                    });
                  }
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors text-left"
              >
                <div className="flex-shrink-0">
                  {getSupplementIcon(supplement.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm">{supplement.title}</h3>
                  {supplement.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {supplement.description}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="flex-shrink-0">
                  {supplement.type.toUpperCase()}
                </Badge>
              </button>
            ))}
          </div>
          <Separator className="my-6" />
        </div>
      )}

      {/* Track List */}
      <div className="px-4 pb-4 space-y-2">
        <h2 className="text-lg font-semibold mb-3">Tracks</h2>
        {tracks?.map((item, index) => {
          const track = item.audio_content;
          const progress = getTrackProgress(track.id);
          const { isAvailable, countdownText } = getTrackAvailability(item.drip_delay_days || 0);
          
          return (
            <div
              key={item.id}
              onClick={() => handleTrackClick(track.id, item.drip_delay_days || 0)}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                !isAvailable 
                  ? 'opacity-60 bg-muted/30 cursor-not-allowed' 
                  : hasAccess 
                    ? 'cursor-pointer hover:bg-accent' 
                    : 'opacity-60'
              }`}
            >
              {/* Track number / status icon */}
              <div className="flex-shrink-0 w-8 text-center">
                {!isAvailable ? (
                  <Lock className="h-5 w-5 text-muted-foreground mx-auto" />
                ) : progress.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                ) : progress.percentage > 0 ? (
                  <div className="relative h-5 w-5 mx-auto">
                    <Circle className="h-5 w-5 text-muted-foreground" />
                    <div 
                      className="absolute inset-0 rounded-full border-2 border-primary"
                      style={{
                        clipPath: `polygon(50% 50%, 50% 0%, ${progress.percentage > 50 ? '100%' : '50%'} 0%, ${progress.percentage > 50 ? '100%' : '50%'} ${progress.percentage > 50 ? '100%' : `${(progress.percentage / 50) * 100}%`}, ${progress.percentage > 50 ? `${100 - ((progress.percentage - 50) / 50) * 100}%` : '50%'} ${progress.percentage > 50 ? '100%' : '100%'}, 50% 100%)`
                      }}
                    />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">{index + 1}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{track.title}</h3>
                {!isAvailable && countdownText ? (
                  <p className="text-xs text-muted-foreground">
                    {countdownText}
                  </p>
                ) : track.description ? (
                  <p className="text-xs text-muted-foreground truncate">{track.description}</p>
                ) : null}
                {isAvailable && progress.percentage > 0 && !progress.completed && (
                  <div className="mt-1">
                    <Progress value={progress.percentage} className="h-1" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                <Clock className="h-3 w-3" />
                <span>{formatDuration(track.duration_seconds)}</span>
              </div>

              {isAvailable && hasAccess && (
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <Play className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <SupplementViewer
        isOpen={!!selectedSupplement}
        onClose={() => setSelectedSupplement(null)}
        supplement={selectedSupplement}
      />
    </div>
  );
}
