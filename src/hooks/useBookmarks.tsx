import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface Bookmark {
  id: string;
  user_id: string;
  audio_id: string;
  timestamp_seconds: number;
  note: string | null;
  created_at: string;
}

export function useBookmarks(audioId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ["audio-bookmarks", audioId],
    queryFn: async () => {
      if (!audioId || !user?.id) return [];
      
      const { data, error } = await supabase
        .from("audio_bookmarks")
        .select("*")
        .eq("audio_id", audioId)
        .eq("user_id", user.id)
        .order("timestamp_seconds", { ascending: true });

      if (error) throw error;
      return data as Bookmark[];
    },
    enabled: !!audioId && !!user?.id,
  });

  const addBookmarkMutation = useMutation({
    mutationFn: async ({ 
      timestampSeconds, 
      note 
    }: { 
      timestampSeconds: number; 
      note?: string;
    }) => {
      if (!audioId || !user?.id) throw new Error("Missing audio or user");

      const { data, error } = await supabase
        .from("audio_bookmarks")
        .insert({
          audio_id: audioId,
          user_id: user.id,
          timestamp_seconds: timestampSeconds,
          note: note || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audio-bookmarks", audioId] });
      toast.success("Bookmark saved");
    },
    onError: () => {
      toast.error("Failed to save bookmark");
    },
  });

  const deleteBookmarkMutation = useMutation({
    mutationFn: async (bookmarkId: string) => {
      const { error } = await supabase
        .from("audio_bookmarks")
        .delete()
        .eq("id", bookmarkId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audio-bookmarks", audioId] });
      toast.success("Bookmark deleted");
    },
    onError: () => {
      toast.error("Failed to delete bookmark");
    },
  });

  const addBookmark = (timestampSeconds: number, note?: string) => {
    addBookmarkMutation.mutate({ timestampSeconds, note });
  };

  const deleteBookmark = (bookmarkId: string) => {
    deleteBookmarkMutation.mutate(bookmarkId);
  };

  return {
    bookmarks,
    isLoading,
    addBookmark,
    deleteBookmark,
    isAdding: addBookmarkMutation.isPending,
    isDeleting: deleteBookmarkMutation.isPending,
  };
}
