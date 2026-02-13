import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface AudioInfo {
  id: string;
  title: string;
  cover_image_url: string | null;
}

/**
 * Check if user already has a routine task for this specific audio track
 */
export function useExistingAudioTask(audioId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["audio-routine-task", audioId, user?.id],
    queryFn: async () => {
      if (!audioId || !user?.id) return null;

      const { data, error } = await supabase
        .from("user_tasks")
        .select("id, title, is_active")
        .eq("user_id", user.id)
        .eq("pro_link_type", "audio")
        .eq("pro_link_value", audioId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!audioId && !!user?.id,
  });
}

/**
 * Mutation hook to quickly add an audio track to user's routine
 */
export function useQuickAddAudioTask() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (audio: AudioInfo) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Get next order_index
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
          title: audio.title,
          emoji: "🎧",
          color: "sky",
          repeat_pattern: "daily",
          pro_link_type: "audio",
          pro_link_value: audio.id,
          is_active: true,
          order_index: nextOrderIndex,
          tag: "pro",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, audio) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["audio-routine-task", audio.id] });
      queryClient.invalidateQueries({ queryKey: ["planner-all-tasks"] });
      toast.success("Added to your rituals! 🎧");
    },
    onError: () => {
      toast.error("Failed to add to ritual");
    },
  });
}
