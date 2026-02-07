import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfWeek, addDays } from 'date-fns';

export type BadgeLevel = 'none' | 'bronze' | 'silver' | 'gold';

export interface DailyTaskCompletion {
  date: string;
  totalTasks: number;
  completedTasks: number;
  badgeLevel: BadgeLevel;
}

function calculateBadgeLevel(completed: number, total: number): BadgeLevel {
  if (total === 0 || completed === 0) return 'none';
  if (completed >= total) return 'gold';
  if (completed >= total * 0.5) return 'silver';
  return 'bronze';
}

export function useWeeklyTaskCompletion() {
  const { user } = useAuth();
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });

  return useQuery({
    queryKey: ['weekly-task-completion', user?.id, format(weekStart, 'yyyy-MM-dd')],
    queryFn: async (): Promise<Record<string, DailyTaskCompletion>> => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get tasks for the week (scheduled_date within week range)
      const weekDates = Array.from({ length: 7 }, (_, i) => 
        format(addDays(weekStart, i), 'yyyy-MM-dd')
      );

      // Fetch user tasks for the week
      const { data: tasks, error: tasksError } = await supabase
        .from('user_tasks')
        .select('id, scheduled_date')
        .eq('user_id', user.id)
        .in('scheduled_date', weekDates);

      if (tasksError) throw tasksError;

      // Fetch completions for these dates
      const { data: completions, error: completionsError } = await supabase
        .from('task_completions')
        .select('task_id, completed_date')
        .eq('user_id', user.id)
        .in('completed_date', weekDates);

      if (completionsError) throw completionsError;

      // Build a map of completions by date
      const completionsByDate: Record<string, Set<string>> = {};
      completions?.forEach(c => {
        if (!completionsByDate[c.completed_date]) {
          completionsByDate[c.completed_date] = new Set();
        }
        completionsByDate[c.completed_date].add(c.task_id);
      });

      // Calculate stats per day
      const result: Record<string, DailyTaskCompletion> = {};

      weekDates.forEach(date => {
        const dayTasks = tasks?.filter(t => t.scheduled_date === date) || [];
        const dayCompletions = completionsByDate[date] || new Set();
        
        // Count completed tasks for this day
        const completedCount = dayTasks.filter(t => dayCompletions.has(t.id)).length;
        const totalCount = dayTasks.length;

        result[date] = {
          date,
          totalTasks: totalCount,
          completedTasks: completedCount,
          badgeLevel: calculateBadgeLevel(completedCount, totalCount),
        };
      });

      return result;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
