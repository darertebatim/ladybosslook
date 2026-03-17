import { useMemo } from 'react';
import { useAllActiveTasks, UserTask } from '@/hooks/useTaskPlanner';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getLocalDateStr, taskAppliesToDate } from '@/lib/localDate';
import { useRoutineBankCategories } from '@/hooks/useRoutinesBank';
import { subDays, format } from 'date-fns';

export type SmartListType = 'inbox' | 'today' | 'scheduled' | 'flagged' | 'completed' | 'all';

export interface SmartListInfo {
  type: SmartListType;
  label: string;
  emoji: string;
  count: number;
  color: string;
}

export interface CategoryListInfo {
  slug: string;
  name: string;
  icon: string;
  color: string;
  count: number;
}

// Recent completions (last 30 days)
export const useRecentCompletions = () => {
  const { user } = useAuth();
  const since = format(subDays(new Date(), 30), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['task-hub-completions', user?.id, since],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('task_completions')
        .select('task_id, completed_date')
        .eq('user_id', user.id)
        .gte('completed_date', since);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });
};

export const useTaskHub = () => {
  const { data: allTasks = [], isLoading: tasksLoading } = useAllActiveTasks();
  const { data: categories = [] } = useRoutineBankCategories();
  const { data: recentCompletions = [], isLoading: completionsLoading } = useRecentCompletions();
  const todayStr = getLocalDateStr();

  const smartLists = useMemo((): SmartListInfo[] => {
    const inbox = allTasks.filter(
      t => !t.tag && t.repeat_pattern === 'none' && !t.source_routine_id
    );
    const today = allTasks.filter(t => taskAppliesToDate(t, todayStr));
    const scheduled = allTasks.filter(
      t => t.scheduled_date || t.repeat_pattern !== 'none'
    );
    const flagged = allTasks.filter(t => t.is_urgent);
    const completedTaskIds = new Set(recentCompletions.map(c => c.task_id));

    return [
      { type: 'inbox', label: 'Inbox', emoji: '📥', count: inbox.length, color: 'bg-blue-500' },
      { type: 'today', label: 'Today', emoji: '📅', count: today.length, color: 'bg-amber-500' },
      { type: 'scheduled', label: 'Scheduled', emoji: '📆', count: scheduled.length, color: 'bg-emerald-500' },
      { type: 'flagged', label: 'Flagged', emoji: '🚩', count: flagged.length, color: 'bg-orange-500' },
      { type: 'completed', label: 'Completed', emoji: '✅', count: completedTaskIds.size, color: 'bg-slate-400' },
      { type: 'all', label: 'All Tasks', emoji: '📦', count: allTasks.length, color: 'bg-purple-500' },
    ];
  }, [allTasks, recentCompletions, todayStr]);

  const categoryLists = useMemo((): CategoryListInfo[] => {
    return categories
      .filter(c => c.slug !== 'pro')
      .map(cat => ({
        slug: cat.slug,
        name: cat.name,
        icon: cat.icon || '📁',
        color: cat.color || '#E2F9F0',
        count: allTasks.filter(t => t.tag === cat.slug).length,
      }));
  }, [allTasks, categories]);

  return {
    smartLists,
    categoryLists,
    allTasks,
    isLoading: tasksLoading || completionsLoading,
  };
};

// Get filtered tasks for a specific smart list or category
export const useFilteredTasks = (
  listType: SmartListType | null,
  categorySlug: string | null,
  allTasks: UserTask[],
  recentCompletions: { task_id: string; completed_date: string }[] = []
): UserTask[] => {
  const todayStr = getLocalDateStr();

  return useMemo(() => {
    if (categorySlug) {
      return allTasks.filter(t => t.tag === categorySlug);
    }

    switch (listType) {
      case 'inbox':
        return allTasks.filter(
          t => !t.tag && t.repeat_pattern === 'none' && !t.source_routine_id
        );
      case 'today':
        return allTasks.filter(t => taskAppliesToDate(t, todayStr));
      case 'scheduled':
        return allTasks.filter(
          t => t.scheduled_date || t.repeat_pattern !== 'none'
        );
      case 'flagged':
        return allTasks.filter(t => t.is_urgent);
      case 'completed': {
        const completedIds = new Set(recentCompletions.map(c => c.task_id));
        return allTasks.filter(t => completedIds.has(t.id));
      }
      case 'all':
        return allTasks;
      default:
        return [];
    }
  }, [listType, categorySlug, allTasks, recentCompletions, todayStr]);
};
