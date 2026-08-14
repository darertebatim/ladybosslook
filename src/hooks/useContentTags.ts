import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ContentType = "audio" | "playlist" | "reflection" | "breathing" | "program";

export interface ContentTagLink {
  content_type: ContentType;
  content_id: string;
  tag_id: string;
}

/** All tag links for a given content type — used to render chips and "untagged" filter. */
export function useContentTagsByType(contentType: ContentType) {
  return useQuery({
    queryKey: ["content-tags", contentType],
    queryFn: async (): Promise<ContentTagLink[]> => {
      const { data, error } = await supabase
        .from("content_tags")
        .select("content_type, content_id, tag_id")
        .eq("content_type", contentType);
      if (error) throw error;
      return (data || []) as ContentTagLink[];
    },
    staleTime: 60 * 1000,
  });
}

/** Replace all tags for a single piece of content. */
export function useSaveContentTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contentType,
      contentId,
      tagIds,
    }: {
      contentType: ContentType;
      contentId: string;
      tagIds: string[];
    }) => {
      const { error: delErr } = await supabase
        .from("content_tags")
        .delete()
        .eq("content_type", contentType)
        .eq("content_id", contentId);
      if (delErr) throw delErr;
      if (tagIds.length > 0) {
        const rows = tagIds.map((tag_id) => ({
          content_type: contentType,
          content_id: contentId,
          tag_id,
        }));
        const { error: insErr } = await supabase.from("content_tags").insert(rows);
        if (insErr) throw insErr;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["content-tags", vars.contentType] });
      qc.invalidateQueries({ queryKey: ["admin-pending-untagged"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to save tags"),
  });
}

/**
 * Apply a playlist's tags onto every track inside that playlist.
 * Existing track tags are preserved — playlist tags are merged in (union).
 */
export function useApplyPlaylistTagsToTracks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      playlistId,
      trackIds,
      tagIds,
    }: {
      playlistId: string;
      trackIds: string[];
      tagIds: string[];
    }) => {
      if (tagIds.length === 0) {
        return { inserted: 0, tracks: trackIds.length };
      }
      if (trackIds.length === 0) {
        return { inserted: 0, tracks: 0 };
      }
      const rows = trackIds.flatMap((tid) =>
        tagIds.map((tagId) => ({
          content_type: "audio" as const,
          content_id: tid,
          tag_id: tagId,
        })),
      );
      const { error } = await supabase
        .from("content_tags")
        .upsert(rows, {
          onConflict: "content_type,content_id,tag_id",
          ignoreDuplicates: true,
        });
      if (error) throw error;
      return { inserted: rows.length, tracks: trackIds.length };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["content-tags", "audio"] });
      qc.invalidateQueries({ queryKey: ["admin-pending-untagged"] });
      toast.success(
        `Applied tags to ${res.tracks} track${res.tracks === 1 ? "" : "s"}.`,
      );
    },
    onError: (e: any) => toast.error(e?.message || "Failed to apply tags"),
  });
}