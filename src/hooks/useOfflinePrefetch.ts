/**
 * useOfflinePrefetch
 *
 * Pre-warms critical queries at app start so they're available offline
 * even if the user hasn't visited that screen yet. Runs once per session,
 * a few seconds after auth so it doesn't compete with first-paint.
 */
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getLocalDateStr } from '@/lib/localDate';

export function useOfflinePrefetch(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const timer = setTimeout(() => {
      void prefetchOfflineCritical(userId, queryClient);
    }, 4000); // wait for first-paint + main data fetches

    return () => clearTimeout(timer);
  }, [userId, queryClient]);
}

async function prefetchOfflineCritical(
  userId: string,
  queryClient: ReturnType<typeof useQueryClient>,
): Promise<void> {
  const today = getLocalDateStr();

  // Run all in parallel — each is independently safe to fail
  await Promise.allSettled([
    // Planner: all tasks
    queryClient.prefetchQuery({
      queryKey: ['planner-all-tasks', userId],
      queryFn: async () => {
        const { data } = await supabase
          .from('user_tasks')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('order_index');
        return data ?? [];
      },
      staleTime: 60_000,
    }),

    // Today's completions
    queryClient.prefetchQuery({
      queryKey: ['planner-completions', userId, today],
      queryFn: async () => {
        const { data } = await supabase
          .from('task_completions')
          .select('*')
          .eq('user_id', userId)
          .eq('completed_date', today);
        return data ?? [];
      },
      staleTime: 60_000,
    }),

    // User routines
    queryClient.prefetchQuery({
      queryKey: ['user-routines-bank', userId],
      queryFn: async () => {
        const { data } = await supabase
          .from('user_routines_bank')
          .select('*')
          .eq('user_id', userId);
        return data ?? [];
      },
      staleTime: 5 * 60_000,
    }),

    // Streak
    queryClient.prefetchQuery({
      queryKey: ['nav-streak', userId],
      queryFn: async () => {
        const { data } = await supabase
          .from('user_streaks')
          .select('current_streak')
          .eq('user_id', userId)
          .single();
        return data?.current_streak ?? 0;
      },
      staleTime: 60_000,
    }),

    // Profile
    queryClient.prefetchQuery({
      queryKey: ['profile', userId],
      queryFn: async () => {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        return data;
      },
      staleTime: 5 * 60_000,
    }),

    // Task bank (admin templates)
    queryClient.prefetchQuery({
      queryKey: ['admin-task-bank'],
      queryFn: async () => {
        const { data } = await supabase
          .from('admin_task_bank')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');
        return data ?? [];
      },
      staleTime: 30 * 60_000,
    }),

    // Breathing exercises (full catalog)
    queryClient.prefetchQuery({
      queryKey: ['breathing-exercises'],
      queryFn: async () => {
        const { data } = await supabase
          .from('breathing_exercises')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');
        return data ?? [];
      },
      staleTime: 30 * 60_000,
    }),
  ]);

  console.log('[OfflinePrefetch] critical queries warmed for offline use');
}