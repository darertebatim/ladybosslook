import { useState, useRef, useEffect, useCallback } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { X, Loader2, ExternalLink, Gauge, SkipForward, Play } from 'lucide-react';
import { detectVideoType, extractYouTubeId, extractVimeoId, getVideoPlatformLabel, isVerticalVideo } from '@/lib/videoUtils';
import { useNavigate } from 'react-router-dom';
import { smartOpenUrl } from '@/lib/navigation-utils';
import { AddedToRoutineButton } from '@/components/app/AddedToRoutineButton';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { useExistingVideoTask } from '@/hooks/useVideoRoutine';
import { useAddRoutinePlan, RoutinePlanTask } from '@/hooks/useRoutinePlans';
import { haptic } from '@/lib/haptics';
import { toast } from 'sonner';
import { PromoBanner } from '@/components/app/PromoBanner';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';

interface VideoItem {
  url: string;
  title?: string;
  description?: string;
  isVertical?: boolean;
}

interface AppVideoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
  description?: string;
  isVertical?: boolean;
  /** Video ID for routine linking */
  videoId?: string;
  /** Playlist of all videos for auto-play next */
  playlist?: VideoItem[];
  /** Index of the current video in the playlist */
  currentIndex?: number;
  /** Called when auto-play advances to next video */
  onVideoChange?: (index: number) => void;
}

const SPEEDS = [1, 1.5, 2] as const;

export function AppVideoPlayer({ isOpen, onClose, url, title, description, isVertical: isVerticalOverride, videoId, playlist, currentIndex, onVideoChange }: AppVideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [videoPlaybackSeconds, setVideoPlaybackSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoType = detectVideoType(url);
  const vertical = isVerticalOverride ?? isVerticalVideo(url);

  // Add to routines for individual video
  const [showRoutineSheet, setShowRoutineSheet] = useState(false);
  const { data: existingTask } = useExistingVideoTask(videoId);
  const addRoutinePlan = useAddRoutinePlan();
  const syntheticTaskId = videoId ? `synthetic-video-${videoId}` : null;

  const hasNext = playlist && currentIndex !== undefined && currentIndex < playlist.length - 1;

  const { pause: pauseAudio } = useAudioPlayer();

  useEffect(() => {
    if (isOpen) {
      pauseAudio();
    }
  }, [isOpen, pauseAudio]);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setSpeedIndex(0);
  }, [url]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = SPEEDS[speedIndex];
    }
  }, [speedIndex]);

  const playNext = useCallback(() => {
    if (hasNext && onVideoChange) {
      onVideoChange(currentIndex! + 1);
    }
  }, [hasNext, onVideoChange, currentIndex]);

  const handleVideoEnded = useCallback(() => {
    if (hasNext) {
      playNext();
    }
  }, [hasNext, playNext]);

  const navigate = useNavigate();

  const handleOpenExternal = async () => {
    smartOpenUrl(url, navigate);
  };

  const cycleSpeed = () => {
    setSpeedIndex((prev) => (prev + 1) % SPEEDS.length);
  };

  const getEmbedUrl = (): string | null => {
    if (videoType === 'youtube') {
      const id = extractYouTubeId(url);
      if (!id) return null;
      const params = new URLSearchParams({
        autoplay: '1',
        playsinline: '1',
        rel: '0',
        modestbranding: '1',
      });
      return `https://www.youtube.com/embed/${id}?${params.toString()}`;
    }
    if (videoType === 'vimeo') {
      const id = extractVimeoId(url);
      if (!id) return null;
      return `https://player.vimeo.com/video/${id}?autoplay=1&playsinline=1`;
    }
    return null;
  };

  const renderPlayer = () => {
    if (videoType === 'direct') {
      if (hasError) {
        return (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <p className="text-white/60 text-sm">Failed to load video</p>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={() => setHasError(false)} className="rounded-full border-white/20 text-white bg-white/10">
                Retry
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenExternal} className="rounded-full border-white/20 text-white bg-white/10 gap-1">
                <ExternalLink className="h-3 w-3" /> Open in Browser
              </Button>
            </div>
          </div>
        );
      }

      const togglePlayPause = () => {
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) { v.play(); } else { v.pause(); }
      };

      return (
        <div className="relative w-full flex items-center justify-center">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 className="h-8 w-8 animate-spin text-white/70" />
            </div>
          )}
          <video
            ref={videoRef}
            src={url}
            controls
            playsInline
            // @ts-ignore webkit attribute
            webkit-playsinline="true"
            autoPlay
            onLoadedData={() => setIsLoading(false)}
            onError={() => setHasError(true)}
            onEnded={handleVideoEnded}
            onPlay={() => setIsPaused(false)}
            onPause={() => setIsPaused(true)}
            onTimeUpdate={(e) => setVideoPlaybackSeconds(Math.floor(e.currentTarget.currentTime))}
            className={vertical
              ? "aspect-[9/16] max-h-[75vh] w-auto mx-auto rounded-xl"
              : "aspect-video w-full rounded-xl"
            }
            style={{ touchAction: 'none' }}
          />
          {/* Big centered play button when paused */}
          {isPaused && !isLoading && (
            <button
              onClick={togglePlayPause}
              className="absolute inset-0 flex items-center justify-center z-10"
            >
              <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform">
                <Play className="h-8 w-8 text-white fill-white ml-1" />
              </div>
            </button>
          )}
          {/* Speed toggle */}
          {!isLoading && (
            <button
              onClick={cycleSpeed}
              className="absolute top-3 right-3 z-20 flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium active:scale-95 transition-transform"
            >
              <Gauge className="h-3.5 w-3.5" />
              {SPEEDS[speedIndex]}x
            </button>
          )}
        </div>
      );
    }

    if (videoType === 'youtube' || videoType === 'vimeo') {
      const embedUrl = getEmbedUrl();

      if (!embedUrl || hasError) {
        return (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <p className="text-white/60 text-sm">Couldn't load video embed</p>
            <Button variant="outline" size="sm" onClick={handleOpenExternal} className="rounded-full border-white/20 text-white bg-white/10 gap-1">
              <ExternalLink className="h-3 w-3" /> Watch on {getVideoPlatformLabel(videoType)}
            </Button>
          </div>
        );
      }

      return (
        <div className="relative w-full">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 className="h-8 w-8 animate-spin text-white/70" />
            </div>
          )}
          <div className={vertical
            ? "aspect-[9/16] max-h-[75vh] w-auto mx-auto rounded-xl overflow-hidden"
            : "aspect-video w-full rounded-xl overflow-hidden"
          }>
            <iframe
              src={embedUrl}
              title={title || 'Video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
              onLoad={() => setIsLoading(false)}
              onError={() => setHasError(true)}
            />
          </div>
        </div>
      );
    }

    if (videoType === 'instagram') {
      const match = url.match(/instagram\.com\/(?:reel|p|reels)\/([^/?#]+)/i);
      const embedUrl = match ? `https://www.instagram.com/p/${match[1]}/embed/` : null;
      
      if (embedUrl) {
        return (
          <div className="relative w-full">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <Loader2 className="h-8 w-8 animate-spin text-white/70" />
              </div>
            )}
            <div className="aspect-[9/16] max-h-[75vh] w-auto mx-auto rounded-xl overflow-hidden bg-black">
              <iframe
                src={embedUrl}
                title={title || 'Instagram'}
                allowFullScreen
                className="w-full h-full border-0"
                onLoad={() => setIsLoading(false)}
                onError={() => setHasError(true)}
              />
            </div>
          </div>
        );
      }

      // Fallback to external link
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <p className="text-white/60 text-sm">This video is hosted externally</p>
          <Button variant="outline" size="sm" onClick={handleOpenExternal} className="rounded-full border-white/20 text-white bg-white/10 gap-1">
            <ExternalLink className="h-3 w-3" /> Watch on Instagram
          </Button>
        </div>
      );
    }

    if (videoType === 'tiktok') {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <p className="text-white/60 text-sm">This video is hosted externally</p>
          <Button variant="outline" size="sm" onClick={handleOpenExternal} className="rounded-full border-white/20 text-white bg-white/10 gap-1">
            <ExternalLink className="h-3 w-3" /> Watch on TikTok
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <>
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="h-[100dvh] rounded-none p-0 bg-black border-none flex flex-col"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 left-3 z-30 p-2 rounded-full bg-white/10 backdrop-blur-sm active:scale-95 transition-transform"
          style={{ marginTop: 'env(safe-area-inset-top)' }}
          aria-label="Close video player"
        >
          <X className="h-5 w-5 text-white" />
        </button>

        {/* Video area - centered with banner overlay */}
        <div className="flex-1 flex items-center justify-center px-4 overflow-hidden overscroll-contain relative">
          {renderPlayer()}
          {/* Promo Banner - overlaid on top of the video */}
          <div className="absolute bottom-24 left-4 right-4 z-20">
            <PromoBanner 
              location="video_player" 
              currentVideoId={videoId}
              playbackSeconds={videoPlaybackSeconds}
              forceShowClose
            />
          </div>
        </div>

        {/* Title bar + Next button */}
        <div className="px-4 pb-4 pt-2" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {title && <h3 className="text-white font-semibold text-base">{title}</h3>}
              {description && <p className="text-white/60 text-sm mt-0.5 line-clamp-2">{description}</p>}
              {playlist && currentIndex !== undefined && (
                <p className="text-white/40 text-xs mt-1">{currentIndex + 1} / {playlist.length}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {videoId && (
                <AddedToRoutineButton
                  isAdded={!!existingTask}
                  onAddClick={() => {
                    haptic.medium();
                    setShowRoutineSheet(true);
                  }}
                  iconOnly
                  className="text-white hover:text-white"
                />
              )}
              {hasNext && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={playNext}
                  className="text-white/80 hover:text-white hover:bg-white/10 gap-1"
                >
                  Next <SkipForward className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom safe area fallback if no title */}
        {!title && !description && !playlist && (
          <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
        )}
      </SheetContent>
    </Sheet>

    {/* Routine Preview Sheet - rendered outside video player Sheet to avoid nesting issues */}
    {videoId && title && syntheticTaskId && (
      <RoutinePreviewSheet
        key={syntheticTaskId}
        open={showRoutineSheet}
        onOpenChange={setShowRoutineSheet}
        tasks={[{
          id: syntheticTaskId,
          plan_id: syntheticTaskId,
          title: title,
          icon: '🎬',
          color: 'sky',
          task_order: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          linked_playlist_id: null,
          pro_link_type: 'video',
          pro_link_value: videoId,
          linked_playlist: null,
          tag: 'pro',
        } as RoutinePlanTask]}
        routineTitle={title}
        onSave={async (selectedTaskIds, editedTasks) => {
          const effectiveSelectedTaskIds = selectedTaskIds.includes(syntheticTaskId)
            ? selectedTaskIds
            : [syntheticTaskId];

          try {
            await addRoutinePlan.mutateAsync({
              planId: syntheticTaskId,
              selectedTaskIds: effectiveSelectedTaskIds,
              editedTasks,
              syntheticTasks: [{
                id: syntheticTaskId,
                plan_id: syntheticTaskId,
                title: title,
                icon: '🎬',
                color: 'sky',
                task_order: 0,
                is_active: true,
                created_at: new Date().toISOString(),
                linked_playlist_id: null,
                pro_link_type: 'video',
                pro_link_value: videoId,
                linked_playlist: null,
                tag: 'pro',
              } as RoutinePlanTask],
            });
            toast.success('Added to your routines! 🎬');
            setShowRoutineSheet(false);
          } catch (error) {
            console.error('Failed to add routine:', error);
            toast.error('Failed to add to routine');
          }
        }}
        isSaving={addRoutinePlan.isPending}
      />
    )}
    </>
  );
}
