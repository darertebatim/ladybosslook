import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfWeek, addDays } from 'date-fns';
import { taskAppliesToDate } from '@/lib/localDate';

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

      const weekDates = Array.from({ length: 7 }, (_, i) => 
        format(addDays(weekStart, i), 'yyyy-MM-dd')
      );

      // Fetch ALL active user tasks (including repeating ones and their creation date)
      const { data: tasks, error: tasksError } = await supabase
        .from('user_tasks')
        .select('id, scheduled_date, repeat_pattern, repeat_days, created_at')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (tasksError) throw tasksError;

      // Fetch completions for the week
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

      weekDates.forEach(dateStr => {
        // Filter tasks that apply to this specific date
        const dayTasks = (tasks || []).filter(task => 
          taskAppliesToDate(task, dateStr)
        );
        
        const dayCompletions = completionsByDate[dateStr] || new Set();
        
        // Count completed tasks for this day
        const completedCount = dayTasks.filter(t => dayCompletions.has(t.id)).length;
        const totalCount = dayTasks.length;

        result[dateStr] = {
          date: dateStr,
          totalTasks: totalCount,
          completedTasks: completedCount,
          badgeLevel: calculateBadgeLevel(completedCount, totalCount),
        };
      });

      return result;
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds - refresh more often for live updates
  });
}

/**
 * Hook to fetch badge data for a custom date range (for month calendar)
 */
export function useDateRangeTaskCompletion(startDate: Date, endDate: Date) {
  const { user } = useAuth();
  const startStr = format(startDate, 'yyyy-MM-dd');
  const endStr = format(endDate, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['date-range-task-completion', user?.id, startStr, endStr],
    queryFn: async (): Promise<Record<string, DailyTaskCompletion>> => {
      if (!user?.id) throw new Error('User not authenticated');

      // Generate all dates in range
      const dates: string[] = [];
      let current = startDate;
      while (current <= endDate) {
        dates.push(format(current, 'yyyy-MM-dd'));
        current = addDays(current, 1);
      }

      // Fetch ALL active user tasks (including repeating ones and their creation date)
      const { data: tasks, error: tasksError } = await supabase
        .from('user_tasks')
        .select('id, scheduled_date, repeat_pattern, repeat_days, created_at')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (tasksError) throw tasksError;

      // Fetch completions for the date range
      const { data: completions, error: completionsError } = await supabase
        .from('task_completions')
        .select('task_id, completed_date')
        .eq('user_id', user.id)
        .gte('completed_date', startStr)
        .lte('completed_date', endStr);

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

      dates.forEach(dateStr => {
        // Filter tasks that apply to this specific date
        const dayTasks = (tasks || []).filter(task => 
          taskAppliesToDate(task, dateStr)
        );
        
        const dayCompletions = completionsByDate[dateStr] || new Set();
        
        // Count completed tasks for this day
        const completedCount = dayTasks.filter(t => dayCompletions.has(t.id)).length;
        const totalCount = dayTasks.length;

        result[dateStr] = {
          date: dateStr,
          totalTasks: totalCount,
          completedTasks: completedCount,
          badgeLevel: calculateBadgeLevel(completedCount, totalCount),
        };
      });

      return result;
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 minute for expanded calendar
  });
}
