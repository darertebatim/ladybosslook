import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, CheckCircle2, Circle, Lock } from "lucide-react";
import { BackButton } from "@/components/app/BackButton";
import { AppVideoPlayer } from "@/components/app/AppVideoPlayer";
import { useEnrollments } from "@/hooks/useAppData";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

export default function AppVideoPlaylistDetail() {
  const { playlistId } = useParams();
  const { user } = useAuth();
  const [playerOpen, setPlayerOpen] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  const { data: playlist, isLoading: plLoading } = useQuery({
    queryKey: ['video-playlist', playlistId],
    queryFn: async () => {
      const { data, error } = await supabase.from('video_playlists').select('*').eq('id', playlistId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: tracks, isLoading: trLoading } = useQuery({
    queryKey: ['video-playlist-tracks', playlistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_playlist_items')
        .select('id, sort_order, drip_delay_days, video_id, video_content(id, title, description, duration_seconds, thumbnail_url, file_url, video_type, is_vertical)')
        .eq('playlist_id', playlistId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!playlistId,
  });

  const { data: progressData } = useQuery({
    queryKey: ['video-playlist-progress', playlistId],
    queryFn: async () => {
      if (!user) return [];
      const videoIds = tracks?.map(t => t.video_content?.id).filter(Boolean) || [];
      if (!videoIds.length) return [];
      const { data, error } = await supabase.from('video_progress').select('*').eq('user_id', user.id).in('video_id', videoIds);
      if (error) throw error;
      return data;
    },
    enabled: !!tracks && tracks.length > 0 && !!user,
  });

  const { data: enrollments } = useEnrollments();
  const { hasAccessToProgram } = useSubscription();

  const hasAccess = playlist?.is_free
    ? true
    : playlist?.requires_subscription
      ? hasAccessToProgram('simora-plus')
      : enrollments?.includes(playlist?.program_slug);

  const getProgress = (videoId: string) => {
    const p = progressData?.find(pr => pr.video_id === videoId);
    if (!p) return { pct: 0, completed: false };
    const track = tracks?.find(t => t.video_content?.id === videoId);
    const dur = track?.video_content?.duration_seconds || 1;
    return { pct: Math.min((p.current_position_seconds / dur) * 100, 100), completed: p.completed || false };
  };

  const totalTracks = tracks?.length || 0;
  const completedCount = tracks?.filter(t => getProgress(t.video_content?.id || '').completed).length || 0;
  const overallProgress = totalTracks > 0 ? (completedCount / totalTracks) * 100 : 0;

  const playlistItems = tracks?.map(t => ({
    url: t.video_content?.file_url || '',
    title: t.video_content?.title,
    description: t.video_content?.description || undefined,
    isVertical: t.video_content?.is_vertical || false,
  })) || [];

  const currentVideo = playlistItems[currentVideoIndex];

  const handlePlay = (index: number) => {
    if (!hasAccess) return;
    setCurrentVideoIndex(index);
    setPlayerOpen(true);
  };

  const handleVideoChange = useCallback((newIndex: number) => {
    setCurrentVideoIndex(newIndex);
  }, []);

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (plLoading || trLoading) {
    return (
      <div className="flex flex-col h-full bg-background overflow-hidden">
        <div className="p-4 space-y-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="aspect-[3/4] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Fixed header with back button */}
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center px-4 h-12"
        style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(48px + env(safe-area-inset-top))' }}
      >
        <BackButton />
      </div>

      {/* Spacer for fixed header */}
      <div style={{ height: 'calc(48px + env(safe-area-inset-top, 0px))' }} className="shrink-0" />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {/* Cover - portrait aspect for vertical video content */}
        {playlist?.cover_image_url ? (
          <div className="relative aspect-[3/4] w-full overflow-hidden mx-4 rounded-2xl" style={{ maxHeight: '50vh' }}>
            <img src={playlist.cover_image_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>
        ) : (
          <div className="mx-4 aspect-[3/4] rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5" style={{ maxHeight: '40vh' }} />
        )}

        <div className="px-4 mt-4 space-y-4 pb-safe">
          <div>
            <h1 className="text-2xl font-bold">{playlist?.name}</h1>
            {playlist?.description && <p className="text-sm text-muted-foreground mt-1">{playlist.description}</p>}
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{completedCount} of {totalTracks} completed</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          {/* Video List - portrait thumbnails */}
          <div className="space-y-2 pb-4">
            {tracks?.map((track, i) => {
              const vc = track.video_content;
              if (!vc) return null;
              const { pct, completed } = getProgress(vc.id);
              const locked = !hasAccess;

              return (
                <button
                  key={track.id}
                  onClick={() => handlePlay(i)}
                  disabled={locked}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left",
                    locked ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/50 active:scale-[0.99]",
                    completed && "bg-primary/5 border-primary/20"
                  )}
                >
                  {/* Portrait thumbnail */}
                  <div className="relative w-14 h-[4.5rem] rounded-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                    {vc.thumbnail_url ? (
                      <img src={vc.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-muted-foreground">{i + 1}</span>
                    )}
                    {locked && <div className="absolute inset-0 bg-background/60 flex items-center justify-center"><Lock className="h-4 w-4" /></div>}
                    {!locked && !completed && <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><Play className="h-4 w-4 text-white fill-white" /></div>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{vc.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      {vc.duration_seconds > 0 && <span>{formatDuration(vc.duration_seconds)}</span>}
                      <Badge variant="outline" className="text-[9px] px-1 py-0">{vc.video_type}</Badge>
                    </div>
                    {pct > 0 && !completed && (
                      <Progress value={pct} className="h-1 mt-1.5" />
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {completed ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground/30" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Video Player with auto-play */}
      {currentVideo && (
        <AppVideoPlayer
          isOpen={playerOpen}
          onClose={() => setPlayerOpen(false)}
          url={currentVideo.url}
          title={currentVideo.title}
          description={currentVideo.description}
          isVertical={currentVideo.isVertical}
          playlist={playlistItems}
          currentIndex={currentVideoIndex}
          onVideoChange={handleVideoChange}
        />
      )}
    </div>
  );
}
