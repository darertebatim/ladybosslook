import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, Loader2, ChevronRight, RotateCw, ChevronLeft } from 'lucide-react';
import { format, addMinutes } from 'date-fns';
import { TASK_COLOR_CLASSES, type TaskColor } from '@/hooks/useTaskPlanner';
import SealCheck from '@/components/app/SealCheck';
import { TaskIcon } from '@/components/app/IconPicker';
import { useFocusPlayer } from '@/components/app/FocusPlayerProvider';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/haptics';
import { startOfDay, endOfDay } from 'date-fns';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { toast } from 'sonner';

export default function AppFocusRoutines() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startRoutine, isActive } = useFocusPlayer();

  // Fetch user's own focus routines from user_routines_bank (user-owned copies)
  const { data: myFocusRoutines, isLoading } = useQuery({
    queryKey: ['user-focus-routines', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_routines_bank')
        .select('id, routine_id, title, emoji, cover_image_url, category, color, is_focus, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('is_focus', true);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!user,
  });

  // Fetch user_tasks grouped by source_routine_id for emoji chains
  const focusRoutineIds = useMemo(() => {
    return (myFocusRoutines || []).map((r: any) => r.routine_id);
  }, [myFocusRoutines]);

  const { data: routineTasksMap } = useQuery({
    queryKey: ['focus-user-tasks-emojis', user?.id, focusRoutineIds],
    queryFn: async () => {
      if (!user || focusRoutineIds.length === 0) return {};
      const { data } = await supabase
        .from('user_tasks')
        .select('source_routine_id, title, emoji, order_index')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .in('source_routine_id', focusRoutineIds)
        .order('order_index', { ascending: true });

      const map: Record<string, { title: string; emoji: string }[]> = {};
      (data || []).forEach((t: any) => {
        const rid = t.source_routine_id;
        if (!rid) return;
        if (!map[rid]) map[rid] = [];
        map[rid].push({ title: t.title, emoji: t.emoji || '📝' });
      });
      return map;
    },
    enabled: !!user && focusRoutineIds.length > 0,
  });

  // Fetch today's session data (for resume logic only)
  const { data: todaySessions } = useQuery({
    queryKey: ['focus-today-sessions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const today = new Date();
      const { data } = await supabase
        .from('routine_sessions')
        .select('id, routine_id, tasks_completed, tasks_total, ended_at')
        .eq('user_id', user.id)
        .gte('started_at', startOfDay(today).toISOString())
        .lte('started_at', endOfDay(today).toISOString());
      return data || [];
    },
    enabled: !!user,
  });

  // Collect all user_task IDs for focus routines (for completion queries)
  const allFocusTaskIds = useMemo(() => {
    if (!routineTasksMap) return [];
    // We need actual IDs, not just titles — fetch separately
    return [];
  }, [routineTasksMap]);

  // Fetch user_task IDs for all focus routines
  const { data: userTasksByRoutine } = useQuery({
    queryKey: ['focus-user-task-ids', user?.id, focusRoutineIds],
    queryFn: async () => {
      if (!user || focusRoutineIds.length === 0) return {};
      const { data } = await supabase
        .from('user_tasks')
        .select('id, source_routine_id, title')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .in('source_routine_id', focusRoutineIds);

      const map: Record<string, string[]> = {};
      (data || []).forEach((t: any) => {
        const rid = t.source_routine_id;
        if (!rid) return;
        if (!map[rid]) map[rid] = [];
        map[rid].push(t.id);
      });
      return map;
    },
    enabled: !!user && focusRoutineIds.length > 0,
  });

  // Fetch today's task_completions for all focus routine tasks (planner-synced progress)
  const allUserTaskIds = useMemo(() => {
    if (!userTasksByRoutine) return [];
    return Object.values(userTasksByRoutine).flat();
  }, [userTasksByRoutine]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const { data: todayCompletions } = useQuery({
    queryKey: ['focus-today-completions', user?.id, todayStr, allUserTaskIds],
    queryFn: async () => {
      if (!user || allUserTaskIds.length === 0) return new Set<string>();
      const { data } = await supabase
        .from('task_completions')
        .select('task_id')
        .eq('user_id', user.id)
        .eq('completed_date', todayStr)
        .in('task_id', allUserTaskIds);
      return new Set((data || []).map(d => d.task_id));
    },
    enabled: !!user && allUserTaskIds.length > 0,
  });

  // Progress based on real planner completions
  const getCompletionInfo = (routineId: string) => {
    const taskIds = userTasksByRoutine?.[routineId];
    if (!taskIds || taskIds.length === 0) return null;
    const completed = taskIds.filter(id => todayCompletions?.has(id)).length;
    if (completed === 0) return null;
    const pct = Math.round((completed / taskIds.length) * 100);
    return { pct, isComplete: pct === 100 };
  };

  // Pre-start state
  const [preStartRoutine, setPreStartRoutine] = useState<any | null>(null);
  const [preStartTasks, setPreStartTasks] = useState<{ id: string; title: string; emoji: string; targetSeconds: number; color?: string; userTaskId?: string; goalType?: string | null; goalTarget?: number | null }[]>([]);
  const [loadingRoutineId, setLoadingRoutineId] = useState<string | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [resumeSessionId, setResumeSessionId] = useState<string | null>(null);
  const [resumeTaskResults, setResumeTaskResults] = useState<import('@/components/app/FocusRoutineSummary').SessionTaskResult[]>([]);

  const remainingPreStartTasks = preStartTasks.filter(t => !completedTaskIds.has(t.id));
  const totalPreStartSeconds = remainingPreStartTasks.reduce((s, t) => s + t.targetSeconds, 0);

  const handlePlay = async (routine: any) => {
    if (isActive) {
      const { toast } = await import('sonner');
      toast('A routine is already running. Finish or cancel it first.');
      return;
    }
    setLoadingRoutineId(routine.routine_id);

    // Fetch user's own tasks for this routine — no bank lookup needed
    const { data: userTasks } = await supabase
      .from('user_tasks')
      .select('id, title, emoji, color, goal_target, goal_type, order_index')
      .eq('user_id', user!.id)
      .eq('source_routine_id', routine.routine_id)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    setLoadingRoutineId(null);

    if (!userTasks || userTasks.length === 0) {
      const { toast } = await import('sonner');
      toast.error('No tasks found in this routine');
      return;
    }

    haptic.light();

    const tasks = userTasks.map((t: any) => ({
      id: t.id,           // This IS the user_task ID
      title: t.title,
      emoji: t.emoji || '📝',
      targetSeconds: t.goal_target || 300,
      color: t.color || undefined,
      userTaskId: t.id,   // Same ID — no mapping needed!
      goalType: t.goal_type || null,
      goalTarget: t.goal_target || null,
    }));

    // Start with planner-completed tasks for today
    const doneSet = new Set<string>(
      tasks.filter(t => todayCompletions?.has(t.id)).map(t => t.id)
    );

    // If there's an incomplete session, merge its completed tasks for resume context
    const incompleteSession = todaySessions?.find(s => s.routine_id === routine.routine_id && !s.ended_at);
    if (incompleteSession) {
      const { data: completedTasks } = await supabase
        .from('routine_session_tasks')
        .select('task_title, task_emoji, target_seconds, actual_seconds, status')
        .eq('session_id', incompleteSession.id)
        .order('task_order', { ascending: true });

      const prevResults: import('@/components/app/FocusRoutineSummary').SessionTaskResult[] = [];
      (completedTasks || []).forEach(ct => {
        const matchingTask = tasks.find(t => t.title === ct.task_title);
        if (matchingTask) doneSet.add(matchingTask.id);
        prevResults.push({
          title: ct.task_title,
          emoji: ct.task_emoji,
          targetSeconds: ct.target_seconds,
          actualSeconds: ct.actual_seconds,
          status: ct.status as 'completed' | 'skipped',
        });
      });

      setResumeSessionId(incompleteSession.id);
      setResumeTaskResults(prevResults);
    } else {
      setResumeSessionId(null);
      setResumeTaskResults([]);
    }

    setCompletedTaskIds(doneSet);

    setPreStartTasks(tasks);
    setPreStartRoutine(routine);
  };

  const handleStartFromPreview = () => {
    if (!preStartRoutine) return;
    haptic.medium();

    const remaining = preStartTasks.filter(t => !completedTaskIds.has(t.id));

    if (remaining.length === 0) {
      toast('All tasks in this routine are already completed for today ✅');
      return;
    }

    if (resumeSessionId && remaining.length < preStartTasks.length) {
      startRoutine(
        {
          routineId: preStartRoutine.routine_id,
          routineTitle: preStartRoutine.title,
          routineEmoji: preStartRoutine.emoji || '✨',
          tasks: remaining,
        },
        {
          startFromIndex: 0,
          previousResults: resumeTaskResults,
          existingSessionId: resumeSessionId,
        }
      );
    } else {
      startRoutine({
        routineId: preStartRoutine.routine_id,
        routineTitle: preStartRoutine.title,
        routineEmoji: preStartRoutine.emoji || '✨',
        tasks: remaining,
      });
    }

    setPreStartRoutine(null);
    setPreStartTasks([]);
    setCompletedTaskIds(new Set());
    setResumeSessionId(null);
    setResumeTaskResults([]);
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border/50"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-3">
          <button onClick={() => navigate(-1)} className="p-1 active:opacity-70">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <h1 className="text-base font-bold text-foreground">Focus Routines</h1>
          </div>
          <div className="w-7" />
        </div>
      </header>

      <div style={{ height: 'calc(48px + env(safe-area-inset-top, 0px))' }} />

      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {/* Activated routines — reading from user-owned data */}
            {(() => {
              const activeRoutines = (myFocusRoutines || []).filter((r: any) => {
                const tasks = routineTasksMap?.[r.routine_id] || [];
                return tasks.length > 0;
              });
              return activeRoutines.length > 0 ? (
              <section>
                <p className="text-base font-bold text-foreground mb-3">My Routines</p>
                <div className="space-y-3">
                  {activeRoutines.map((routine: any) => {
                    const completion = getCompletionInfo(routine.routine_id);
                    const allTasks = routineTasksMap?.[routine.routine_id] || [];
                    // Use planner completions to determine which tasks are done
                    const completedIds = todayCompletions || new Set<string>();
                    const taskIdsForRoutine = userTasksByRoutine?.[routine.routine_id] || [];
                    const remainingTasks = allTasks.filter((t, idx) => {
                      const taskId = taskIdsForRoutine[idx];
                      return !taskId || !completedIds.has(taskId);
                    });

                    return (
                      <div key={routine.id} className="bg-card rounded-2xl border border-border p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-foreground text-lg">{routine.title}</h3>
                              {completion && (
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                  completion.isComplete
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {completion.pct}%
                                </span>
                              )}
                            </div>
                            {routine.category && (
                              <p className="text-xs text-muted-foreground mt-0.5">{routine.category}</p>
                            )}
                            {remainingTasks.length > 0 && (
                              <div className="flex items-center gap-1 mt-2.5 flex-wrap">
                                {remainingTasks.map((task, i) => (
                                  <span key={i} className="flex items-center">
                                    <FluentEmoji emoji={task.emoji} size={24} />
                                    {i < remainingTasks.length - 1 && (
                                      <ChevronRight className="w-3 h-3 text-muted-foreground/30 mx-0.5" />
                                    )}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handlePlay(routine)}
                            disabled={loadingRoutineId === routine.routine_id}
                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-muted active:scale-95 transition-transform shrink-0 ml-3"
                          >
                            {loadingRoutineId === routine.routine_id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-foreground" />
                            ) : completion ? (
                              <>
                                {completion.isComplete ? (
                                  <RotateCw className="w-4 h-4 text-foreground" />
                                ) : (
                                  <Play className="w-4 h-4 text-foreground fill-foreground" />
                                )}
                                <span className="text-sm font-semibold text-foreground">{completion.pct}%</span>
                              </>
                            ) : (
                              <Play className="w-4 h-4 text-foreground fill-foreground" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
              ) : null;
            })()}

            {/* Empty state */}
            {(myFocusRoutines || []).filter((r: any) => (routineTasksMap?.[r.routine_id] || []).length > 0).length === 0 && (
              <div className="text-center py-12">
                <FluentEmoji emoji="🎯" size={48} className="mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">No focus routines yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Browse and add focus routines to start your timed sessions
                </p>
              </div>
            )}

            <button
              onClick={() => navigate('/app/routines')}
              className="w-full flex items-center justify-center gap-1 text-sm text-primary font-medium py-3"
            >
              Browse all routines <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Pre-start overlay */}
      {preStartRoutine && (
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
          <header
            className="flex items-center justify-between px-4 pt-3 pb-3"
            style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
          >
            <button onClick={() => setPreStartRoutine(null)} className="p-1 active:opacity-70">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="w-7" />
          </header>

          <div className="flex-1 overflow-y-auto px-5 pb-32">
            <h1 className="text-2xl font-bold text-foreground mt-2">{preStartRoutine.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(), 'h:mma')} – {format(addMinutes(new Date(), Math.ceil(totalPreStartSeconds / 60)), 'h:mma')} ({Math.ceil(totalPreStartSeconds / 60)}m)
            </p>

            <div className="space-y-2.5 mt-6">
              {(() => {
                // Calculate cumulative start times for each task
                let cumulativeSeconds = 0;
                const now = new Date();
                // Skip already-done tasks for time calculation
                const taskTimings = preStartTasks.map((task) => {
                  const isDone = completedTaskIds.has(task.id);
                  const startTime = isDone ? null : new Date(now.getTime() + cumulativeSeconds * 1000);
                  const endTime = isDone ? null : new Date(now.getTime() + (cumulativeSeconds + task.targetSeconds) * 1000);
                  if (!isDone) cumulativeSeconds += task.targetSeconds;
                  return { task, isDone, startTime, endTime };
                });

                return taskTimings.map(({ task, isDone, startTime, endTime }) => {
                  const colorKey = (task.color || 'yellow') as TaskColor;
                  const colorClass = TASK_COLOR_CLASSES[colorKey] || TASK_COLOR_CLASSES.yellow;
                  const mins = Math.ceil(task.targetSeconds / 60);
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        'rounded-3xl pl-3 pr-4 py-3 transition-all duration-200 cursor-pointer active:scale-[0.98]',
                        colorClass,
                        isDone && 'opacity-60'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 flex items-center justify-center shrink-0">
                          <TaskIcon iconName={task.emoji} size={32} className="text-black/80" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-black/60">⏱️ {mins}m</span>
                            {startTime && endTime && (
                              <>
                                <span className="text-[11px] text-black/40">•</span>
                                <span className="text-[11px] text-black/60">
                                  {format(startTime, 'h:mm')}–{format(endTime, 'h:mma')}
                                </span>
                              </>
                            )}
                          </div>
                          <p className={cn(
                            'text-black text-[15px] font-semibold leading-tight transition-all',
                            isDone && 'line-through'
                          )}>
                            {task.title}
                          </p>
                        </div>
                        <div className="w-9 h-9 flex items-center justify-center shrink-0">
                          {isDone ? (
                            <SealCheck className="w-9 h-9 text-teal-400" />
                          ) : (
                            <span className="w-9 h-9 rounded-full border-2 border-black bg-white flex items-center justify-center" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Start / Resume button */}
          <div
            className="fixed bottom-0 left-0 right-0 px-5 pb-4 pt-2 bg-background"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
          >
            <button
              onClick={handleStartFromPreview}
              className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-amber-400 text-black font-bold text-base active:scale-[0.98] transition-transform"
            >
              <Play className="w-5 h-5 fill-current" />
              {completedTaskIds.size > 0 ? `Resume (${remainingPreStartTasks.length} remaining)` : 'Start'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
