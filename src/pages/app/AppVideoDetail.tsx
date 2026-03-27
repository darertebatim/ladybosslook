import { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppVideoPlayer } from "@/components/app/AppVideoPlayer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

export default function AppVideoDetail() {
  const { videoId } = useParams();
  const navigate = useNavigate();

  const { data: video, isLoading } = useQuery({
    queryKey: ["app-video-detail", videoId],
    queryFn: async () => {
      if (!videoId) return null;

      const { data, error } = await supabase
        .from("video_content")
        .select("id, title, description, file_url, is_vertical")
        .eq("id", videoId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!videoId,
  });

  const handleClose = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/app/watch");
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="h-full bg-background p-4 space-y-3">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-[60vh] w-full rounded-xl" />
      </div>
    );
  }

  if (!video?.file_url) {
    return (
      <div className="h-full bg-background flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">Video not found.</p>
        <Button onClick={() => navigate("/app/watch")} variant="outline">
          Back to Watch
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full bg-background">
      <AppVideoPlayer
        isOpen={true}
        onClose={handleClose}
        url={video.file_url}
        title={video.title ?? undefined}
        description={video.description ?? undefined}
        isVertical={video.is_vertical ?? undefined}
        videoId={video.id}
      />
    </div>
  );
}
