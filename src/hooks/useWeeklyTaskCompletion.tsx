import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfWeek, addDays, parseISO } from 'date-fns';

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

// Helper to check if a task applies to a given date (same logic as useTasksForDate)
function taskAppliesToDate(task: {
  scheduled_date: string | null;
  repeat_pattern: string;
  repeat_days: number[] | null;
}, dateStr: string): boolean {
  const date = parseISO(dateStr);
  const dayOfWeek = date.getDay();

  // Non-repeating tasks - only show on scheduled date
  if (task.repeat_pattern === 'none') {
    return task.scheduled_date === dateStr;
  }

  // Daily tasks - always show
  if (task.repeat_pattern === 'daily') return true;

  // Weekend tasks - only Sat/Sun
  if (task.repeat_pattern === 'weekend') {
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  // Weekly tasks - show on same day of week as original
  if (task.repeat_pattern === 'weekly' && task.scheduled_date) {
    const originalDay = parseISO(task.scheduled_date).getDay();
    return dayOfWeek === originalDay;
  }

  // Monthly tasks - show on same day of month
  if (task.repeat_pattern === 'monthly' && task.scheduled_date) {
    const originalDate = parseISO(task.scheduled_date).getDate();
    return date.getDate() === originalDate;
  }

  // Custom - check repeat_days array
  if (task.repeat_pattern === 'custom' && task.repeat_days) {
    return task.repeat_days.includes(dayOfWeek);
  }

  return false;
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

      // Fetch ALL active user tasks (including repeating ones)
      const { data: tasks, error: tasksError } = await supabase
        .from('user_tasks')
        .select('id, scheduled_date, repeat_pattern, repeat_days')
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
