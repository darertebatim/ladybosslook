import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ContentType = "audio" | "playlist" | "reflection" | "breathing";

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
    },
    onError: (e: any) => toast.error(e?.message || "Failed to save tags"),
  });
}