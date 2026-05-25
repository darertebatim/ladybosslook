import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PlaylistTag {
  id: string;
  slug: string;
  label: string;
  emoji: string | null;
  sort_order: number;
}

export interface PlaylistTagLink {
  playlist_id: string;
  tag_id: string;
}

export function usePlaylistTags() {
  return useQuery({
    queryKey: ["playlist-tags"],
    queryFn: async (): Promise<PlaylistTag[]> => {
      const { data, error } = await supabase
        .from("playlist_tags")
        .select("id, slug, label, emoji, sort_order")
        .order("sort_order", { ascending: true })
        .order("label", { ascending: true });
      if (error) throw error;
      return (data || []) as PlaylistTag[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePlaylistTagLinks() {
  return useQuery({
    queryKey: ["playlist-tag-links"],
    queryFn: async (): Promise<PlaylistTagLink[]> => {
      const { data, error } = await supabase
        .from("audio_playlist_tag_links")
        .select("playlist_id, tag_id");
      if (error) throw error;
      return (data || []) as PlaylistTagLink[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Replaces all tags for a single playlist with the provided list. Admin-only. */
export function useSavePlaylistTagLinks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ playlistId, tagIds }: { playlistId: string; tagIds: string[] }) => {
      const { error: delErr } = await supabase
        .from("audio_playlist_tag_links")
        .delete()
        .eq("playlist_id", playlistId);
      if (delErr) throw delErr;
      if (tagIds.length > 0) {
        const rows = tagIds.map((tag_id) => ({ playlist_id: playlistId, tag_id }));
        const { error: insErr } = await supabase
          .from("audio_playlist_tag_links")
          .insert(rows);
        if (insErr) throw insErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["playlist-tag-links"] });
    },
    onError: (e: any) => {
      toast.error(e?.message || "Failed to save tags");
    },
  });
}