import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

/**
 * Returns a Set of pro_link_type values (optionally with pro_link_value)
 * that the user has completed today.
 * Key format: "type" or "type:value"
 */
export function useTodayProLinkCompletions() {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['today-prolink-completions', user?.id, today],
    queryFn: async () => {
      if (!user) return new Set<string>();

      // Get all active user tasks that have a pro_link_type
      const { data: tasks } = await supabase
        .from('user_tasks')
        .select('id, pro_link_type, pro_link_value')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .not('pro_link_type', 'is', null);

      if (!tasks || tasks.length === 0) return new Set<string>();

      const taskIds = tasks.map(t => t.id);

      // Check which of these tasks have completions for today
      const { data: completions } = await supabase
        .from('task_completions')
        .select('task_id')
        .eq('user_id', user.id)
        .eq('completed_date', today)
        .in('task_id', taskIds);

      const completedTaskIds = new Set((completions || []).map(c => c.task_id));

      // Build a set of completed pro-link keys
      const completedKeys = new Set<string>();
      for (const task of tasks) {
        if (completedTaskIds.has(task.id) && task.pro_link_type) {
          // Add generic key (type only)
          completedKeys.add(task.pro_link_type);
          // Add specific key (type:value)
          if (task.pro_link_value) {
            completedKeys.add(`${task.pro_link_type}:${task.pro_link_value}`);
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
  // Check specific match first (type:value), then generic (type)
  if (value && completedKeys.has(`${type}:${value}`)) return true;
  return completedKeys.has(type);
}
