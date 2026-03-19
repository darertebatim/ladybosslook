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

function buildTaskIdSetByDate(
  rows: Array<{ task_id: string; [key: string]: string }>,
  dateField: string
): Record<string, Set<string>> {
  const map: Record<string, Set<string>> = {};

  rows.forEach((row) => {
    const dateKey = row[dateField];
    if (!dateKey) return;

    if (!map[dateKey]) {
      map[dateKey] = new Set<string>();
    }
    map[dateKey].add(row.task_id);
  });

  return map;
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

      const [tasksResult, completionsResult, skipsResult] = await Promise.all([
        supabase
          .from('user_tasks')
          .select('id, scheduled_date, repeat_pattern, repeat_days, created_at, repeat_end_date')
          .eq('user_id', user.id)
          .eq('is_active', true),
        supabase
          .from('task_completions')
          .select('task_id, completed_date')
          .eq('user_id', user.id)
          .in('completed_date', weekDates),
        supabase
          .from('task_skips')
          .select('task_id, skipped_date')
          .eq('user_id', user.id)
          .in('skipped_date', weekDates),
      ]);

      if (tasksResult.error) throw tasksResult.error;
      if (completionsResult.error) throw completionsResult.error;
      if (skipsResult.error) throw skipsResult.error;

      const tasks = tasksResult.data || [];
      const completionsByDate = buildTaskIdSetByDate(completionsResult.data || [], 'completed_date');
      const skipsByDate = buildTaskIdSetByDate(skipsResult.data || [], 'skipped_date');

      const result: Record<string, DailyTaskCompletion> = {};

      weekDates.forEach((dateStr) => {
        const dayCompletions = completionsByDate[dateStr] || new Set<string>();
        const skippedTaskIds = skipsByDate[dateStr] || new Set<string>();

        const dayTasks = tasks.filter((task) =>
          !skippedTaskIds.has(task.id) && taskAppliesToDate(task, dateStr)
        );

        const completedCount = dayTasks.filter((t) => dayCompletions.has(t.id)).length;
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
    staleTime: 30 * 1000,
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

      const [tasksResult, completionsResult, skipsResult] = await Promise.all([
        supabase
          .from('user_tasks')
          .select('id, scheduled_date, repeat_pattern, repeat_days, created_at, repeat_end_date')
          .eq('user_id', user.id)
          .eq('is_active', true),
        supabase
          .from('task_completions')
          .select('task_id, completed_date')
          .eq('user_id', user.id)
          .gte('completed_date', startStr)
          .lte('completed_date', endStr),
        supabase
          .from('task_skips')
          .select('task_id, skipped_date')
          .eq('user_id', user.id)
          .gte('skipped_date', startStr)
          .lte('skipped_date', endStr),
      ]);

      if (tasksResult.error) throw tasksResult.error;
      if (completionsResult.error) throw completionsResult.error;
      if (skipsResult.error) throw skipsResult.error;

      const tasks = tasksResult.data || [];
      const completionsByDate = buildTaskIdSetByDate(completionsResult.data || [], 'completed_date');
      const skipsByDate = buildTaskIdSetByDate(skipsResult.data || [], 'skipped_date');

      const result: Record<string, DailyTaskCompletion> = {};

      dates.forEach((dateStr) => {
        const dayCompletions = completionsByDate[dateStr] || new Set<string>();
        const skippedTaskIds = skipsByDate[dateStr] || new Set<string>();

        const dayTasks = tasks.filter((task) =>
          !skippedTaskIds.has(task.id) && taskAppliesToDate(task, dateStr)
        );

        const completedCount = dayTasks.filter((t) => dayCompletions.has(t.id)).length;
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
    staleTime: 60 * 1000,
  });
}
