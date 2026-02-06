import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TaskTemplate } from './useTaskPlanner';

/**
 * Get popular actions from admin_task_bank for home page suggestions
 */
export function usePopularActions() {
  return useQuery({
    queryKey: ['popular-actions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_task_bank')
        .select('*')
        .eq('is_active', true)
        .eq('is_popular', true)
        .order('sort_order', { ascending: true })
        .limit(6);

      if (error) throw error;
      return data as TaskTemplate[];
    },
    staleTime: 1000 * 60 * 5,
  });
}
