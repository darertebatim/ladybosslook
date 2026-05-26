import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TagDimension {
  id: string;
  slug: string;
  label: string;
  emoji: string | null;
  sort_order: number;
  description: string | null;
  is_multi_select: boolean;
  is_active: boolean;
}

export function useTagDimensions() {
  return useQuery({
    queryKey: ["tag-dimensions"],
    queryFn: async (): Promise<TagDimension[]> => {
      const { data, error } = await supabase
        .from("tag_dimensions")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as TagDimension[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveTagDimension() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<TagDimension> & { id?: string }) => {
      if (input.id) {
        const { id, ...rest } = input;
        const { error } = await supabase.from("tag_dimensions").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tag_dimensions").insert(input as any);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tag-dimensions"] }),
    onError: (e: any) => toast.error(e?.message || "Failed to save dimension"),
  });
}

export function useDeleteTagDimension() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tag_dimensions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tag-dimensions"] });
      qc.invalidateQueries({ queryKey: ["tags"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to delete dimension"),
  });
}