import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfDay, endOfDay } from 'date-fns';

/**
 * Checks actual activity completion for today across different pro-link types.
 * Returns a Set of pro_link_type strings that were completed today.
 * This checks the activity tables directly, independent of planner tasks.
 */
export function useTodayProLinkCompletions() {
  const { user } = useAuth();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayStart = startOfDay(new Date()).toISOString();
  const todayEnd = endOfDay(new Date()).toISOString();

  return useQuery({
    queryKey: ['today-prolink-completions', user?.id, todayStr],
    queryFn: async () => {
      if (!user) return new Set<string>();

      const completedKeys = new Set<string>();

      // Run all checks in parallel
      const [
        breatheResult,
        reflectionResult,
        freeFormResult,
        fastingResult,
        presenceResult,
        returnEventsResult,
        taskCompletionResult,
      ] = await Promise.all([
        // Breathe: check breathing_sessions for today
        supabase
          .from('breathing_sessions')
          .select('id')
          .eq('user_id', user.id)
          .gte('completed_at', todayStart)
          .lte('completed_at', todayEnd)
          .limit(1),

        // Reflection (guided): check user_reflection_responses for today
        supabase
          .from('user_reflection_responses' as any)
          .select('id')
          .eq('user_id', user.id)
          .gte('completed_at', todayStart)
          .lte('completed_at', todayEnd)
          .limit(1),

        // Free-form reflection/journal: check free_form_reflections for today
        supabase
          .from('free_form_reflections')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd)
          .limit(1),

        // Fasting: check fasting_sessions that ended today
        supabase
          .from('fasting_sessions' as any)
          .select('id')
          .eq('user_id', user.id)
          .gte('ended_at', todayStart)
          .lte('ended_at', todayEnd)
          .limit(1),

        // Presence: check if last_active_date is today
        supabase
          .from('profiles')
          .select('last_active_date')
          .eq('id', user.id)
          .maybeSingle(),

        // App return events for today
        supabase
          .from('app_return_events')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd)
          .limit(1),

        // Pro-link task completions for today (covers all types)
        supabase
          .from('task_completions')
          .select('task_id')
          .eq('user_id', user.id)
          .eq('completed_date', todayStr),
      ]);

      if (breatheResult.data && breatheResult.data.length > 0) {
        completedKeys.add('breathe');
      }

      if (
        (reflectionResult.data && (reflectionResult.data as any[]).length > 0) ||
        (freeFormResult.data && freeFormResult.data.length > 0)
      ) {
        completedKeys.add('reflection');
        completedKeys.add('journal');
      }

      if (fastingResult.data && (fastingResult.data as any[]).length > 0) {
        completedKeys.add('fasting');
      }

      // Presence: user showed up today (last_active_date matches or return event exists)
      if (
        (presenceResult.data && (presenceResult.data as any)?.last_active_date === todayStr) ||
        (returnEventsResult.data && returnEventsResult.data.length > 0)
      ) {
        completedKeys.add('presence');
      }

      // Check task_completions for pro-link types AND routine completions
      if (taskCompletionResult.data && taskCompletionResult.data.length > 0) {
        const taskIds = taskCompletionResult.data.map(c => c.task_id);
        const { data: tasks } = await supabase
          .from('user_tasks')
          .select('pro_link_type, pro_link_value, source_routine_id')
          .eq('user_id', user.id)
          .in('id', taskIds);

        if (tasks) {
          for (const task of tasks) {
            if (task.pro_link_type) {
              completedKeys.add(task.pro_link_type);
              if (task.pro_link_value) {
                completedKeys.add(`${task.pro_link_type}:${task.pro_link_value}`);
              }
            }
            // If any routine-linked task was completed, mark routines as done
            if (task.source_routine_id) {
              completedKeys.add('myroutines');
              completedKeys.add('routine');
              completedKeys.add(`routine:${task.source_routine_id}`);
            }
          }
        }
      }

      return completedKeys;
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

/**
 * Check if a specific shortcut's pro-link has been completed today
 */
export function isShortcutCompletedToday(
  completedKeys: Set<string> | undefined,
  type: string,
  value: string | null
): boolean {
  if (!completedKeys) return false;
  if (value && completedKeys.has(`${type}:${value}`)) return true;
  return completedKeys.has(type);
}
