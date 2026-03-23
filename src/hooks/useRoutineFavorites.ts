import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const QUERY_KEY = 'routine-favorites';

export function useRoutineFavorites() {
  const { user } = useAuth();

  const { data: favoriteIds = [], ...rest } = useQuery({
    queryKey: [QUERY_KEY, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('routine_favorites' as any)
        .select('routine_id')
        .eq('user_id', user.id);
      if (error) throw error;
      return (data as any[]).map((r: any) => r.routine_id as string);
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  return { favoriteIds, ...rest };
}

export function useToggleRoutineFavorite() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ routineId, isFavorited }: { routineId: string; isFavorited: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');

      if (isFavorited) {
        // Remove
        const { error } = await supabase
          .from('routine_favorites' as any)
          .delete()
          .eq('user_id', user.id)
          .eq('routine_id', routineId);
        if (error) throw error;
      } else {
        // Add
        const { error } = await supabase
          .from('routine_favorites' as any)
          .insert({ user_id: user.id, routine_id: routineId } as any);
        if (error) throw error;
      }
    },
    onMutate: async ({ routineId, isFavorited }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, user?.id] });
      const prev = queryClient.getQueryData<string[]>([QUERY_KEY, user?.id]) || [];
      const next = isFavorited ? prev.filter(id => id !== routineId) : [...prev, routineId];
      queryClient.setQueryData([QUERY_KEY, user?.id], next);
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData([QUERY_KEY, user?.id], context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, user?.id] });
    },
  });
}
