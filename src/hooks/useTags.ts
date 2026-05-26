import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Tag {
  id: string;
  dimension_id: string;
  slug: string;
  label: string;
  emoji: string | null;
  sort_order: number;
  description: string | null;
  parent_tag_id: string | null;
  is_active: boolean;
}

export function useAllTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async (): Promise<Tag[]> => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("label", { ascending: true });
      if (error) throw error;
      return (data || []) as Tag[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Tag> & { id?: string; dimension_id: string }) => {
      if (input.id) {
        const { id, ...rest } = input;
        const { error } = await supabase.from("tags").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tags").insert(input as any);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
    onError: (e: any) => toast.error(e?.message || "Failed to save tag"),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
    onError: (e: any) => toast.error(e?.message || "Failed to delete tag"),
  });
}