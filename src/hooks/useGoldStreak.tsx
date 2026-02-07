import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays, parseISO, startOfWeek, endOfWeek, isSameDay } from 'date-fns';

export interface GoldStreakData {
  currentGoldStreak: number;
  longestGoldStreak: number;
  lastGoldDate: string | null;
}

/**
 * Get user's gold streak data (consecutive days with 100% completion)
 */
export const useGoldStreak = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['gold-streak', user?.id],
    queryFn: async (): Promise<GoldStreakData | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_streaks')
        .select('current_gold_streak, longest_gold_streak, last_gold_date')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      return data ? {
        currentGoldStreak: data.current_gold_streak || 0,
        longestGoldStreak: data.longest_gold_streak || 0,
        lastGoldDate: data.last_gold_date,
      } : null;
    },
    enabled: !!user?.id,
  });
};

/**
 * Get dates this week that earned gold badges
 * Used for the week view in gold streak celebration
 */
export const useGoldDatesThisWeek = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['gold-dates-week', user?.id],
    queryFn: async (): Promise<Date[]> => {
      if (!user?.id) return [];

      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 0 });

      // Get all tasks for the week
      const { data: completions, error } = await supabase
        .from('task_completions')
        .select('completed_date, task_id')
        .eq('user_id', user.id)
        .gte('completed_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('completed_date', format(weekEnd, 'yyyy-MM-dd'));

      if (error) throw error;

      // Get user's recurring tasks to calculate total tasks per day
      const { data: tasks } = await supabase
        .from('user_tasks')
        .select('id, repeat_pattern, repeat_days, scheduled_date')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (!tasks) return [];

      // For each day, calculate if it was a gold day (100% completion)
      const goldDates: Date[] = [];
      
      // Group completions by date
      const completionsByDate = new Map<string, Set<string>>();
      completions?.forEach(c => {
        if (!completionsByDate.has(c.completed_date)) {
          completionsByDate.set(c.completed_date, new Set());
        }
        completionsByDate.get(c.completed_date)!.add(c.task_id);
      });

      // Check each day
      completionsByDate.forEach((taskIds, dateStr) => {
        const date = parseISO(dateStr);
        const dayOfWeek = date.getDay();
        
        // Count tasks that apply to this day
        const tasksForDay = tasks.filter(task => {
          if (task.repeat_pattern === 'none') {
            return task.scheduled_date === dateStr;
          }
          if (task.repeat_pattern === 'daily') return true;
          if (task.repeat_pattern === 'weekend') {
            return dayOfWeek === 0 || dayOfWeek === 6;
          }
          if (task.repeat_pattern === 'weekly' && task.scheduled_date) {
            const originalDay = parseISO(task.scheduled_date).getDay();
            return dayOfWeek === originalDay;
          }
          if (task.repeat_pattern === 'custom' && task.repeat_days) {
            return task.repeat_days.includes(dayOfWeek);
          }
          return false;
        });

        // Gold = completed all tasks for that day
        if (tasksForDay.length > 0 && taskIds.size >= tasksForDay.length) {
          goldDates.push(date);
        }
      });

      return goldDates;
    },
    enabled: !!user?.id,
  });
};

/**
 * Update gold streak when user earns a gold badge
 * Called when all tasks for a day are completed
 */
export const useUpdateGoldStreak = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const today = format(new Date(), 'yyyy-MM-dd');
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

      // Get current streak data
      const { data: current } = await supabase
        .from('user_streaks')
        .select('current_gold_streak, longest_gold_streak, last_gold_date')
        .eq('user_id', user.id)
        .maybeSingle();

      let newStreak = 1;
      let newLongest = current?.longest_gold_streak || 0;

      // If last gold was yesterday, increment streak
      if (current?.last_gold_date === yesterday) {
        newStreak = (current.current_gold_streak || 0) + 1;
      }
      // If last gold was today, don't update
      else if (current?.last_gold_date === today) {
        return { currentGoldStreak: current.current_gold_streak || 0, isNewStreak: false };
      }

      // Update longest if needed
      if (newStreak > newLongest) {
        newLongest = newStreak;
      }

      const { error } = await supabase
        .from('user_streaks')
        .update({
          current_gold_streak: newStreak,
          longest_gold_streak: newLongest,
          last_gold_date: today,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      return { currentGoldStreak: newStreak, isNewStreak: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gold-streak'] });
      queryClient.invalidateQueries({ queryKey: ['gold-dates-week'] });
    },
  });
};
