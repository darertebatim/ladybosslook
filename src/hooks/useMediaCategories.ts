import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMediaCategories(type: 'audio' | 'video') {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: [`media-categories-${type}`],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media_categories')
        .select('*')
        .eq('type', type)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  return { categories, isLoading };
}
