import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { ChevronRight, Play, RotateCw } from 'lucide-react';
import { startOfDay, endOfDay } from 'date-fns';
import { getLocalDateStr, taskAppliesToDate } from '@/lib/localDate';

interface RoutineTaskPreviewProps {
  routineId: string;
}

/** Hook to fetch routine preview data (tasks + completion) */
export function useRoutinePreviewData(routineId: string) {
  const { user } = useAuth();

  const { data: tasks } = useQuery({
    queryKey: ['routine-preview-tasks', routineId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('user_tasks')
        .select('emoji, title, order_index')
        .eq('user_id', user.id)
        .eq('source_routine_id', routineId)
        .eq('is_active', true)
        .or('pro_link_type.is.null,pro_link_type.neq.routine') // include member pro-tasks, exclude launcher
        .order('order_index', { ascending: true });
      return (data || []).map((t: any) => ({ emoji: t.emoji || '📝', title: t.title }));
    },
    enabled: !!user && !!routineId,
    staleTime: 60_000,
  });

  const { data: completion } = useQuery({
    queryKey: ['routine-preview-completion', routineId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const today = new Date();
      const todayStr = getLocalDateStr(today);

      // 1) Check routine_sessions first (from Routine Player)
      const { data: session } = await supabase
        .from('routine_sessions')
        .select('tasks_completed, tasks_total')
        .eq('user_id', user.id)
        .eq('routine_id', routineId)
        .gte('started_at', startOfDay(today).toISOString())
        .lte('started_at', endOfDay(today).toISOString())
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // 2) Check routine tasks, but only those that apply today
      const { data: routineTasks } = await supabase
        .from('user_tasks')
        .select('id, scheduled_date, repeat_pattern, repeat_days, created_at, repeat_end_date')
        .eq('user_id', user.id)
        .eq('source_routine_id', routineId)
        .eq('is_active', true)
        .or('pro_link_type.is.null,pro_link_type.neq.routine'); // include member pro-tasks, exclude launcher

      const todayTasks = (routineTasks || []).filter((task: any) => taskAppliesToDate(task, todayStr));

      // No applicable tasks today: only show session fallback if a session exists
      if (todayTasks.length === 0) {
        if (!session || !session.tasks_total || session.tasks_total <= 0) return null;
        const sessionTotal = Math.max(session.tasks_total, 1);
        const sessionCompleted = Math.min(Math.max(session.tasks_completed, 0), sessionTotal);
        const pct = Math.round((sessionCompleted / sessionTotal) * 100);
        return { pct, isComplete: pct >= 100 };
      }

      const todayTaskIds = todayTasks.map(t => t.id);
      const { data: skippedRows } = await supabase
        .from('task_skips')
        .select('task_id')
        .eq('user_id', user.id)
        .eq('skipped_date', todayStr)
        .in('task_id', todayTaskIds);

      const skippedTaskIds = new Set((skippedRows || []).map((row: any) => row.task_id));
      const activeTodayTasks = todayTasks.filter(t => !skippedTaskIds.has(t.id));

      // All today's tasks skipped = fully done for today
      if (activeTodayTasks.length === 0) {
        return { pct: 100, isComplete: true };
      }

      const activeTaskIds = activeTodayTasks.map(t => t.id);
      const { count: completedCount } = await supabase
        .from('task_completions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed_date', todayStr)
        .in('task_id', activeTaskIds);

      const manualCompleted = completedCount || 0;
      const sessionCompleted = session
        ? Math.min(Math.max(session.tasks_completed, 0), activeTodayTasks.length)
        : 0;

      const resolvedCompletedCount = Math.max(manualCompleted, sessionCompleted);
      const pct = Math.round((resolvedCompletedCount / activeTodayTasks.length) * 100);

      return { pct, isComplete: pct >= 100 };
    },
    enabled: !!user && !!routineId,
    staleTime: 30_000,
  });

  return { tasks, completion };
}

/**
 * Emoji chain row shown below the task title.
 */
export const RoutineTaskPreview = memo(function RoutineTaskPreview({ routineId }: RoutineTaskPreviewProps) {
  const { tasks } = useRoutinePreviewData(routineId);

  if (!tasks || tasks.length === 0) return null;

  const MAX_EMOJIS = 3;
  const visible = tasks.slice(0, MAX_EMOJIS);
  const overflow = tasks.length - MAX_EMOJIS;

  return (
    <div className="flex items-center gap-1.5 mt-0.5">
      {visible.map((task, i) => (
        <span key={i} className="flex items-center">
          <span className="w-7 h-7 rounded-full bg-background/60 flex items-center justify-center">
            <FluentEmoji emoji={task.emoji} size={18} />
          </span>
          {i < visible.length - 1 && (
            <ChevronRight className="w-3 h-3 text-black mx-0.5" />
          )}
        </span>
      ))}
      {overflow > 0 && (
        <>
          <ChevronRight className="w-3 h-3 text-black mx-0.5" />
          <span className="w-7 h-7 rounded-full bg-background/60 flex items-center justify-center text-[11px] font-bold text-black">
            +{overflow}
          </span>
        </>
      )}
    </div>
  );
});

/**
 * Play button + percentage badge shown under the circle button.
 */
export const RoutinePlayBadge = memo(function RoutinePlayBadge({ routineId }: RoutineTaskPreviewProps) {
  const { completion } = useRoutinePreviewData(routineId);

  return (
    <span className="flex items-center justify-center gap-0.5 mt-1 text-[11px] font-semibold text-black">
      {completion?.isComplete ? (
        <RotateCw className="w-3 h-3" />
      ) : (
        <Play className="w-3 h-3 fill-current" />
      )}
      {completion ? `${completion.pct}%` : ''}
    </span>
  );
});
