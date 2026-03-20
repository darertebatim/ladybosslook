import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { ChevronRight, Play, RotateCw } from 'lucide-react';
import { startOfDay, endOfDay } from 'date-fns';

interface RoutineTaskPreviewProps {
  routineId: string;
}

/**
 * Mini preview row showing routine task emojis + completion percentage.
 * Used inside TaskCard for pro-tasks linked to a routine.
 */
export const RoutineTaskPreview = memo(function RoutineTaskPreview({ routineId }: RoutineTaskPreviewProps) {
  const { user } = useAuth();

  // Fetch routine's tasks (emojis)
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
        .order('order_index', { ascending: true });
      console.log('[RoutineTaskPreview] routineId:', routineId, 'tasks found:', data?.length);
      return (data || []).map((t: any) => ({ emoji: t.emoji || '📝', title: t.title }));
    },
    enabled: !!user && !!routineId,
    staleTime: 60_000,
  });

  // Fetch today's session completion
  const { data: completion } = useQuery({
    queryKey: ['routine-preview-completion', routineId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const today = new Date();
      const { data } = await supabase
        .from('routine_sessions')
        .select('tasks_completed, tasks_total')
        .eq('user_id', user.id)
        .eq('routine_id', routineId)
        .gte('started_at', startOfDay(today).toISOString())
        .lte('started_at', endOfDay(today).toISOString())
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!data) return null;
      const pct = data.tasks_total > 0 ? Math.round((data.tasks_completed / data.tasks_total) * 100) : 0;
      return { pct, isComplete: pct >= 100 };
    },
    enabled: !!user && !!routineId,
    staleTime: 30_000,
  });

  if (!tasks || tasks.length === 0) return null;

  const MAX_EMOJIS = 3;
  const visible = tasks.slice(0, MAX_EMOJIS);
  const overflow = tasks.length - MAX_EMOJIS;

  return (
    <div className="flex items-center gap-0.5 mt-0.5">
      {visible.map((task, i) => (
        <span key={i} className="flex items-center">
          <span className="w-5 h-5 rounded-full bg-background/60 flex items-center justify-center">
            <FluentEmoji emoji={task.emoji} size={12} />
          </span>
          {i < visible.length - 1 && (
            <ChevronRight className="w-2 h-2 text-black/40 mx-px" />
          )}
        </span>
      ))}
      {overflow > 0 && (
        <>
          <ChevronRight className="w-2 h-2 text-black/40 mx-px" />
          <span className="w-5 h-5 rounded-full bg-background/60 flex items-center justify-center text-[9px] font-bold text-black/60">
            +{overflow}
          </span>
        </>
      )}
      {completion && (
        <span className="flex items-center gap-0.5 ml-1.5 text-[10px] font-semibold text-black/60">
          {completion.isComplete ? (
            <RotateCw className="w-2.5 h-2.5" />
          ) : (
            <Play className="w-2.5 h-2.5 fill-current" />
          )}
          {completion.pct}%
        </span>
      )}
    </div>
  );
});
