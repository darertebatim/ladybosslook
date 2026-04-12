import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays, parseISO, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { taskAppliesToDate } from '@/lib/localDate';

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
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

      // Get all task completions, skips, and routine sessions for the week
      const [
        { data: completions, error },
        { data: tasks },
        { data: skips },
        { data: routineSessions },
      ] = await Promise.all([
        supabase
          .from('task_completions')
          .select('completed_date, task_id')
          .eq('user_id', user.id)
          .gte('completed_date', weekStartStr)
          .lte('completed_date', weekEndStr),
        supabase
          .from('user_tasks')
          .select('id, repeat_pattern, repeat_days, scheduled_date, created_at, repeat_end_date, pro_link_type, pro_link_value, source_routine_id')
          .eq('user_id', user.id)
          .eq('is_active', true),
        supabase
          .from('task_skips')
          .select('task_id, skipped_date')
          .eq('user_id', user.id)
          .gte('skipped_date', weekStartStr)
          .lte('skipped_date', weekEndStr),
        supabase
          .from('routine_sessions')
          .select('routine_id, started_at, tasks_completed, tasks_total')
          .eq('user_id', user.id)
          .gte('started_at', weekStart.toISOString())
          .lte('started_at', weekEnd.toISOString()),
      ]);

      if (error) throw error;
      if (!tasks) return [];

      // Group completions by date
      const completionsByDate = new Map<string, Set<string>>();
      completions?.forEach((c) => {
        if (!completionsByDate.has(c.completed_date)) {
          completionsByDate.set(c.completed_date, new Set());
        }
        completionsByDate.get(c.completed_date)!.add(c.task_id);
      });

      // Group skips by date
      const skippedByDate = new Map<string, Set<string>>();
      skips?.forEach((s) => {
        if (!skippedByDate.has(s.skipped_date)) {
          skippedByDate.set(s.skipped_date, new Set());
        }
        skippedByDate.get(s.skipped_date)!.add(s.task_id);
      });

      // Build completed routine IDs by date from sessions
      const completedRoutinesByDate = new Map<string, Set<string>>();
      routineSessions?.forEach((session: any) => {
        const total = session.tasks_total || 0;
        const completed = session.tasks_completed || 0;
        if (session.routine_id && total > 0 && completed >= total) {
          const sessionDate = format(new Date(session.started_at), 'yyyy-MM-dd');
          if (!completedRoutinesByDate.has(sessionDate)) {
            completedRoutinesByDate.set(sessionDate, new Set());
          }
          completedRoutinesByDate.get(sessionDate)!.add(session.routine_id);
        }
      });

      // Group routine sub-tasks by routine
      const routineTasksByRoutine: Record<string, any[]> = {};
      tasks.forEach((task: any) => {
        if (!task.source_routine_id) return;
        if (!routineTasksByRoutine[task.source_routine_id]) {
          routineTasksByRoutine[task.source_routine_id] = [];
        }
        routineTasksByRoutine[task.source_routine_id].push(task);
      });

      // Check each day in the week for gold status
      const goldDates: Date[] = [];
      for (let i = 0; i < 7; i++) {
        const date = addDays(weekStart, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayCompletions = completionsByDate.get(dateStr) || new Set<string>();
        const skippedTaskIds = skippedByDate.get(dateStr) || new Set<string>();

        // Build completed routine IDs: from sessions + from sub-task completions
        const completedRoutineIds = new Set(completedRoutinesByDate.get(dateStr) || []);
        Object.entries(routineTasksByRoutine).forEach(([routineId, routineTasks]) => {
          const applicable = routineTasks.filter((t: any) =>
            !skippedTaskIds.has(t.id) && taskAppliesToDate(t, dateStr)
          );
          if (applicable.length > 0 && applicable.every((t: any) => dayCompletions.has(t.id))) {
            completedRoutineIds.add(routineId);
          }
        });

        const tasksForDay = tasks.filter((task: any) =>
          !skippedTaskIds.has(task.id) && taskAppliesToDate(task, dateStr)
        );

        if (tasksForDay.length === 0) continue;

        // Count completed: explicit + routine launcher via completed routines
        const completedCount = tasksForDay.filter((task: any) => {
          if (dayCompletions.has(task.id)) return true;
          const isRoutineLauncher = task.pro_link_type === 'routine' && !!task.pro_link_value;
          if (isRoutineLauncher) return completedRoutineIds.has(task.pro_link_value);
          return false;
        }).length;

        if (completedCount >= 3) {
          goldDates.push(date);
        }
      }

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

      // Get current streak data (include recovery info)
      const { data: current } = await supabase
        .from('user_streaks')
        .select('current_gold_streak, longest_gold_streak, last_gold_date, streak_recovery_used_at')
        .eq('user_id', user.id)
        .maybeSingle();

      let newStreak = 1;
      let newLongest = current?.longest_gold_streak || 0;

      // If last gold was yesterday, increment streak
      if (current?.last_gold_date === yesterday) {
        newStreak = (current.current_gold_streak || 0) + 1;
      }
      // If last gold was today, don't update (already earned today)
      else if (current?.last_gold_date === today) {
        return { currentGoldStreak: current.current_gold_streak || 0, isNewStreak: false };
      }
      // If recovery was used today, continue from recovered streak instead of resetting to 1
      else if ((current as any)?.streak_recovery_used_at) {
        const recoveryDate = format(parseISO((current as any).streak_recovery_used_at), 'yyyy-MM-dd');
        if (recoveryDate === today) {
          newStreak = (current?.current_gold_streak || 0) + 1;
        }
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
