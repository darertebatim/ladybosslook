import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfWeek, addDays, startOfDay, endOfDay } from 'date-fns';
import { taskAppliesToDate } from '@/lib/localDate';

export type BadgeLevel = 'none' | 'bronze' | 'silver' | 'gold';

export interface DailyTaskCompletion {
  date: string;
  totalTasks: number;
  completedTasks: number;
  badgeLevel: BadgeLevel;
}

type PlannerTaskRow = {
  id: string;
  source_routine_id: string | null;
  scheduled_date: string | null;
  repeat_pattern: string;
  repeat_days: number[] | null;
  created_at: string;
  repeat_end_date: string | null;
  pro_link_type: string | null;
  pro_link_value: string | null;
};

function calculateBadgeLevel(completed: number, total: number): BadgeLevel {
  if (total === 0 || completed === 0) return 'none';
  if (completed >= total) return 'gold';
  if (completed / total >= 0.5) return 'silver';
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

function buildCompletedRoutineSetByDate(
  rows: Array<{
    routine_id: string;
    started_at: string;
    tasks_completed: number | null;
    tasks_total: number | null;
  }>
): Record<string, Set<string>> {
  const map: Record<string, Set<string>> = {};

  rows.forEach((row) => {
    const total = row.tasks_total || 0;
    const completed = row.tasks_completed || 0;
    if (!row.routine_id || total <= 0 || completed < total) return;

    const dateKey = format(new Date(row.started_at), 'yyyy-MM-dd');
    if (!map[dateKey]) {
      map[dateKey] = new Set<string>();
    }
    map[dateKey].add(row.routine_id);
  });

  return map;
}

function buildRoutineTasksByRoutine(tasks: PlannerTaskRow[]): Record<string, PlannerTaskRow[]> {
  const map: Record<string, PlannerTaskRow[]> = {};

  tasks.forEach((task) => {
    if (!task.source_routine_id) return;

    if (!map[task.source_routine_id]) {
      map[task.source_routine_id] = [];
    }

    map[task.source_routine_id].push(task);
  });

  return map;
}

function buildCompletedRoutineSetFromTaskCompletions(
  routineTasksByRoutine: Record<string, PlannerTaskRow[]>,
  dateStr: string,
  dayCompletions: Set<string>,
  skippedTaskIds: Set<string>
): Set<string> {
  const completedRoutineIds = new Set<string>();

  Object.entries(routineTasksByRoutine).forEach(([routineId, routineTasks]) => {
    const applicableTasks = routineTasks.filter((task) =>
      !skippedTaskIds.has(task.id) && taskAppliesToDate(task, dateStr)
    );

    if (applicableTasks.length === 0) return;

    const fullyCompleted = applicableTasks.every((task) => dayCompletions.has(task.id));
    if (fullyCompleted) {
      completedRoutineIds.add(routineId);
    }
  });

  return completedRoutineIds;
}

function mergeStringSets(...sets: Set<string>[]): Set<string> {
  const merged = new Set<string>();
  sets.forEach((set) => set.forEach((value) => merged.add(value)));
  return merged;
}

function countCompletedTasksForDate(
  dayTasks: PlannerTaskRow[],
  dayCompletions: Set<string>,
  completedRoutineIds: Set<string>
): number {
  return dayTasks.filter((task) => {
    if (dayCompletions.has(task.id)) return true;

    const isRoutineLauncher = task.pro_link_type === 'routine' && !!task.pro_link_value;
    if (!isRoutineLauncher) return false;

    return completedRoutineIds.has(task.pro_link_value!);
  }).length;
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
      const windowStartIso = startOfDay(weekStart).toISOString();
      const windowEndIso = endOfDay(addDays(weekStart, 6)).toISOString();

      const [tasksResult, completionsResult, skipsResult, sessionsResult] = await Promise.all([
        supabase
          .from('user_tasks')
          .select('id, source_routine_id, scheduled_date, repeat_pattern, repeat_days, created_at, repeat_end_date, pro_link_type, pro_link_value')
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
        supabase
          .from('routine_sessions')
          .select('routine_id, started_at, tasks_completed, tasks_total')
          .eq('user_id', user.id)
          .gte('started_at', windowStartIso)
          .lte('started_at', windowEndIso),
      ]);

      if (tasksResult.error) throw tasksResult.error;
      if (completionsResult.error) throw completionsResult.error;
      if (skipsResult.error) throw skipsResult.error;
      if (sessionsResult.error) throw sessionsResult.error;

      const tasks = (tasksResult.data || []) as PlannerTaskRow[];
      const completionsByDate = buildTaskIdSetByDate(completionsResult.data || [], 'completed_date');
      const skipsByDate = buildTaskIdSetByDate(skipsResult.data || [], 'skipped_date');
      const completedRoutinesByDate = buildCompletedRoutineSetByDate(sessionsResult.data || []);
      const routineTasksByRoutine = buildRoutineTasksByRoutine(tasks);

      const result: Record<string, DailyTaskCompletion> = {};

      weekDates.forEach((dateStr) => {
        const dayCompletions = completionsByDate[dateStr] || new Set<string>();
        const skippedTaskIds = skipsByDate[dateStr] || new Set<string>();
        const completedRoutineIds = mergeStringSets(
          completedRoutinesByDate[dateStr] || new Set<string>(),
          buildCompletedRoutineSetFromTaskCompletions(
            routineTasksByRoutine,
            dateStr,
            dayCompletions,
            skippedTaskIds
          )
        );

        const dayTasks = tasks.filter((task) =>
          !skippedTaskIds.has(task.id) && taskAppliesToDate(task, dateStr)
        );

        const completedCount = countCompletedTasksForDate(dayTasks, dayCompletions, completedRoutineIds);
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

      const windowStartIso = startOfDay(startDate).toISOString();
      const windowEndIso = endOfDay(endDate).toISOString();

      const [tasksResult, completionsResult, skipsResult, sessionsResult] = await Promise.all([
        supabase
          .from('user_tasks')
          .select('id, source_routine_id, scheduled_date, repeat_pattern, repeat_days, created_at, repeat_end_date, pro_link_type, pro_link_value')
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
        supabase
          .from('routine_sessions')
          .select('routine_id, started_at, tasks_completed, tasks_total')
          .eq('user_id', user.id)
          .gte('started_at', windowStartIso)
          .lte('started_at', windowEndIso),
      ]);

      if (tasksResult.error) throw tasksResult.error;
      if (completionsResult.error) throw completionsResult.error;
      if (skipsResult.error) throw skipsResult.error;
      if (sessionsResult.error) throw sessionsResult.error;

      const tasks = (tasksResult.data || []) as PlannerTaskRow[];
      const completionsByDate = buildTaskIdSetByDate(completionsResult.data || [], 'completed_date');
      const skipsByDate = buildTaskIdSetByDate(skipsResult.data || [], 'skipped_date');
      const completedRoutinesByDate = buildCompletedRoutineSetByDate(sessionsResult.data || []);
      const routineTasksByRoutine = buildRoutineTasksByRoutine(tasks);

      const result: Record<string, DailyTaskCompletion> = {};

      dates.forEach((dateStr) => {
        const dayCompletions = completionsByDate[dateStr] || new Set<string>();
        const skippedTaskIds = skipsByDate[dateStr] || new Set<string>();
        const completedRoutineIds = mergeStringSets(
          completedRoutinesByDate[dateStr] || new Set<string>(),
          buildCompletedRoutineSetFromTaskCompletions(
            routineTasksByRoutine,
            dateStr,
            dayCompletions,
            skippedTaskIds
          )
        );

        const dayTasks = tasks.filter((task) =>
          !skippedTaskIds.has(task.id) && taskAppliesToDate(task, dateStr)
        );

        const completedCount = countCompletedTasksForDate(dayTasks, dayCompletions, completedRoutineIds);
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
