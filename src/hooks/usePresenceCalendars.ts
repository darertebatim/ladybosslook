import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Fetch distinct dates with task completions for a given month (streak/active days)
 */
export function useStreakCalendar(month: Date) {
  const { user } = useAuth();
  const start = format(startOfMonth(month), 'yyyy-MM-dd');
  const end = format(endOfMonth(month), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['streak-calendar', user?.id, start],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_completions')
        .select('completed_date')
        .eq('user_id', user!.id)
        .gte('completed_date', start)
        .lte('completed_date', end);
      if (error) throw error;
      // Return unique dates
      const dates = new Set((data || []).map(d => d.completed_date));
      return [...dates];
    },
  });
}

/**
 * Fetch mood/emotion logs per day for a given month
 */
export function useMoodCalendar(month: Date) {
  const { user } = useAuth();
  const start = startOfMonth(month).toISOString();
  const end = endOfMonth(month).toISOString();

  return useQuery({
    queryKey: ['mood-calendar', user?.id, format(month, 'yyyy-MM')],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emotion_logs')
        .select('created_at, emotion, valence')
        .eq('user_id', user!.id)
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      // Group by date, keep first (latest) emotion per day
      const byDate: Record<string, { emotion: string; valence: string }> = {};
      (data || []).forEach(row => {
        const dateStr = format(new Date(row.created_at), 'yyyy-MM-dd');
        if (!byDate[dateStr]) {
          byDate[dateStr] = { emotion: row.emotion, valence: row.valence };
        }
      });
      return byDate;
    },
  });
}

/**
 * Fetch action/task completion counts per day for a given month
 */
export function useActionCalendar(month: Date) {
  const { user } = useAuth();
  const start = format(startOfMonth(month), 'yyyy-MM-dd');
  const end = format(endOfMonth(month), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['action-calendar', user?.id, start],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_completions')
        .select('completed_date, task_id')
        .eq('user_id', user!.id)
        .gte('completed_date', start)
        .lte('completed_date', end);
      if (error) throw error;
      
      // Count completions per date
      const counts: Record<string, number> = {};
      (data || []).forEach(row => {
        counts[row.completed_date] = (counts[row.completed_date] || 0) + 1;
      });
      return counts;
    },
  });
}
