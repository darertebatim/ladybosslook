import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface VideoInfo {
  id: string;
  title: string;
  thumbnail_url?: string | null;
}

interface VideoPlaylistInfo {
  id: string;
  name: string;
  cover_image_url?: string | null;
}

/**
 * Check if user already has a routine task for a specific video
 */
export function useExistingVideoTask(videoId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["video-routine-task", videoId, user?.id],
    queryFn: async () => {
      if (!videoId || !user?.id) return null;

      const { data, error } = await supabase
        .from("user_tasks")
        .select("id, title, is_active")
        .eq("user_id", user.id)
        .eq("pro_link_type", "video")
        .eq("pro_link_value", videoId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!videoId && !!user?.id,
  });
}

/**
 * Check if user already has a routine task for a specific video playlist
 */
export function useExistingVideoPlaylistTask(playlistId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["video-playlist-routine-task", playlistId, user?.id],
    queryFn: async () => {
      if (!playlistId || !user?.id) return null;

      const { data, error } = await supabase
        .from("user_tasks")
        .select("id, title, is_active")
        .eq("user_id", user.id)
        .eq("pro_link_type", "video_playlist")
        .eq("pro_link_value", playlistId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!playlistId && !!user?.id,
  });
}

/**
 * Mutation hook to quickly add a video playlist to user's routine
 */
export function useQuickAddVideoPlaylistTask() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (playlist: VideoPlaylistInfo) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data: tasks } = await supabase
        .from("user_tasks")
        .select("order_index")
        .eq("user_id", user.id)
        .order("order_index", { ascending: false })
        .limit(1);

      const nextOrderIndex = (tasks?.[0]?.order_index ?? -1) + 1;

      const { data, error } = await supabase
        .from("user_tasks")
        .insert({
          user_id: user.id,
          title: `Watch ${playlist.name}`,
          emoji: "📺",
          color: "sky",
          repeat_pattern: "daily",
          pro_link_type: "video_playlist",
          pro_link_value: playlist.id,
          is_active: true,
          order_index: nextOrderIndex,
          tag: "pro",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, playlist) => {
      queryClient.invalidateQueries({ queryKey: ["video-playlist-routine-task", playlist.id] });
      queryClient.invalidateQueries({ queryKey: ["planner-all-tasks"] });
      toast.success("Added to your routines! 📺");
    },
    onError: () => {
      toast.error("Failed to add to routine");
    },
  });
}

/**
 * Mutation hook to quickly add a specific video to user's routine
 */
export function useQuickAddVideoTask() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (video: VideoInfo) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data: tasks } = await supabase
        .from("user_tasks")
        .select("order_index")
        .eq("user_id", user.id)
        .order("order_index", { ascending: false })
        .limit(1);

      const nextOrderIndex = (tasks?.[0]?.order_index ?? -1) + 1;

      const { data, error } = await supabase
        .from("user_tasks")
        .insert({
          user_id: user.id,
          title: video.title,
          emoji: "🎬",
          color: "sky",
          repeat_pattern: "daily",
          pro_link_type: "video",
          pro_link_value: video.id,
          is_active: true,
          order_index: nextOrderIndex,
          tag: "pro",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, video) => {
      queryClient.invalidateQueries({ queryKey: ["video-routine-task", video.id] });
      queryClient.invalidateQueries({ queryKey: ["planner-all-tasks"] });
      toast.success("Added to your routines! 🎬");
    },
    onError: () => {
      toast.error("Failed to add to routine");
    },
  });
}
