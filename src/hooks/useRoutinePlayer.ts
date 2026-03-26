import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { updatePresence } from '@/hooks/useUserPresence';
import { updateStreak } from '@/hooks/useTaskPlanner';
import type { SessionTaskResult } from '@/components/app/RoutinePlayerSummary';
import { getLocalDateStr, taskAppliesToDate } from '@/lib/localDate';

export interface RoutineTask {
  id: string;
  title: string;
  emoji: string;
  targetSeconds: number;
  color?: string;
  userTaskId?: string; // maps to user_tasks.id for planner completion sync
  goalEnabled?: boolean;
  goalType?: string | null;
  goalTarget?: number | null;
  hasTimerGoal?: boolean; // true = firm countdown, false = estimated duration
  isEstimate?: boolean; // true = smart estimate (countdown with overtime), not a firm goal
  proLinkType?: string | null;
  proLinkValue?: string | null;
}

export interface RoutinePlayerConfig {
  routineId: string;
  routineTitle: string;
  routineEmoji: string;
  tasks: RoutineTask[];
}

type PlayerPhase = 'idle' | 'breathe' | 'countdown' | 'running' | 'paused' | 'completing' | 'summary';

export function useRoutinePlayer() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<PlayerPhase>('idle');
  const [config, setConfig] = useState<RoutinePlayerConfig | null>(null);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [taskResults, setTaskResults] = useState<SessionTaskResult[]>([]);
  const [startedAt, setStartedAt] = useState<Date>(new Date());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [taskStartedAt, setTaskStartedAt] = useState<Date>(new Date());
  const [pauseStartedAt, setPauseStartedAt] = useState<Date | null>(null);
  const [pauseElapsed, setPauseElapsed] = useState(0);

  const elapsedRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const originalTargetRef = useRef(0);
  // Wall-clock anchor: tracks when the current running phase started
  const runningStartWallRef = useRef<number>(0);
  // How many seconds had already elapsed when the running phase (re)started
  const elapsedAtRunStartRef = useRef<number>(0);
  // Total seconds spent paused during this task
  const totalPausedSecondsRef = useRef<number>(0);

  // Fetch session stats for this routine
  const { data: sessionStats } = useQuery({
    queryKey: ['routine-sessions-stats', config?.routineId, user?.id],
    queryFn: async () => {
      if (!user || !config) return { total: 0, streak: 0 };
      
      const { data, error } = await supabase
        .from('routine_sessions')
        .select('started_at')
        .eq('user_id', user.id)
        .eq('routine_id', config.routineId)
        .not('ended_at', 'is', null)
        .order('started_at', { ascending: false });

      if (error || !data) return { total: 0, streak: 0 };

      const total = data.length;
      let streak = 0;
      if (data.length > 0) {
        streak = 1;
        const dates = data.map(d => new Date(d.started_at).toDateString());
        const uniqueDates = [...new Set(dates)];
        for (let i = 1; i < uniqueDates.length; i++) {
          const prev = new Date(uniqueDates[i - 1]);
          const curr = new Date(uniqueDates[i]);
          const diffDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays <= 1.5) streak++;
          else break;
        }
      }

      return { total: total + 1, streak: streak + 1 };
    },
    enabled: !!user && !!config && phase === 'summary',
  });

  const currentTask = config?.tasks[currentTaskIndex] || null;
  const isOvertime = timeLeft < 0;
  const overtimeSeconds = isOvertime ? Math.abs(timeLeft) : 0;

  // Wall-clock timer: survives iOS background suspension
  useEffect(() => {
    if (phase !== 'running') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    // Anchor the wall clock when entering running phase
    runningStartWallRef.current = Date.now();
    elapsedAtRunStartRef.current = elapsedRef.current;

    const sync = () => {
      const wallElapsed = Math.round((Date.now() - runningStartWallRef.current) / 1000);
      const totalElapsed = elapsedAtRunStartRef.current + wallElapsed;
      elapsedRef.current = totalElapsed;
      setTimeLeft(originalTargetRef.current - totalElapsed);
    };

    intervalRef.current = setInterval(sync, 1000);

    // Also sync on visibility change (iOS resume)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') sync();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [phase]);

  // Pause duration tracker
  useEffect(() => {
    if (phase !== 'paused') {
      setPauseElapsed(0);
      return;
    }

    const timer = setInterval(() => {
      setPauseElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  const startRoutine = useCallback(async (cfg: RoutinePlayerConfig, resumeOptions?: {
    startFromIndex: number;
    previousResults: SessionTaskResult[];
    existingSessionId: string;
  }) => {
    setConfig(cfg);
    const startIdx = resumeOptions?.startFromIndex ?? 0;
    setCurrentTaskIndex(startIdx);
    setTaskResults(resumeOptions?.previousResults ?? []);
    setStartedAt(new Date());
    setTaskStartedAt(new Date());
    elapsedRef.current = 0;
    const target = cfg.tasks[startIdx]?.targetSeconds || 0;
    setTimeLeft(target);
    originalTargetRef.current = target;
    setPhase(resumeOptions ? 'running' : 'countdown');

    if (resumeOptions?.existingSessionId) {
      setSessionId(resumeOptions.existingSessionId);
    } else if (user) {
      const { data } = await supabase
        .from('routine_sessions')
        .insert({
          user_id: user.id,
          routine_id: cfg.routineId,
          routine_title: cfg.routineTitle,
          routine_emoji: cfg.routineEmoji,
          tasks_total: cfg.tasks.length,
        })
        .select('id')
        .single();
      
      if (data) setSessionId(data.id);
    }
  }, [user]);

  /** @deprecated Breathing intro removed */
  const onBreathComplete = useCallback(() => {
    setPhase('running');
    setTaskStartedAt(new Date());
    elapsedRef.current = 0;
  }, []);

  const onCountdownComplete = useCallback(() => {
    setPhase('running');
    setTaskStartedAt(new Date());
    elapsedRef.current = 0;
  }, []);

  const onCompletionCelebrationDone = useCallback(() => {
    setPhase('summary');
  }, []);

  const saveTaskResult = useCallback((status: 'completed' | 'skipped') => {
    if (!config || !currentTask) return null;

    const result: SessionTaskResult = {
      title: currentTask.title,
      emoji: currentTask.emoji,
      targetSeconds: currentTask.targetSeconds,
      actualSeconds: elapsedRef.current,
      status,
    };

    if (sessionId) {
      supabase.from('routine_session_tasks').insert({
        session_id: sessionId,
        task_title: currentTask.title,
        task_emoji: currentTask.emoji,
        task_order: currentTaskIndex,
        target_seconds: currentTask.targetSeconds,
        actual_seconds: elapsedRef.current,
        status,
        user_task_id: currentTask.userTaskId || null,
      } as any).then(() => {});
    }

    // Sync with planner: create task_completion when task is completed
    if (status === 'completed' && currentTask.userTaskId && user) {
      const dateStr = getLocalDateStr(new Date());
      const targetProgress = currentTask.goalType === 'timer'
        ? (currentTask.goalTarget ?? currentTask.targetSeconds)
        : currentTask.goalType === 'count'
          ? (currentTask.goalTarget ?? 1)
          : 1; // no-goal tasks: mark as done with progress=1

      const invalidatePlanner = () => {
        // Specific + broad invalidation for reliability
        queryClient.invalidateQueries({ queryKey: ['planner-completions', user.id, dateStr] });
        queryClient.invalidateQueries({ queryKey: ['planner-completions'] });
        queryClient.invalidateQueries({ queryKey: ['planner-completed-dates'] });
        queryClient.invalidateQueries({ queryKey: ['planner-streak'] });
        queryClient.invalidateQueries({ queryKey: ['new-home-data', user.id] });
        queryClient.invalidateQueries({ queryKey: ['weekly-task-completion'] });
        queryClient.invalidateQueries({ queryKey: ['user-presence'] });
        queryClient.invalidateQueries({ queryKey: ['presence-stats'] });
        queryClient.invalidateQueries({ queryKey: ['focus-today-sessions'] });
        queryClient.invalidateQueries({ queryKey: ['focus-today-completions'] });
      };

      supabase.from('task_completions').insert({
        task_id: currentTask.userTaskId,
        user_id: user.id,
        completed_date: dateStr,
        goal_progress: targetProgress,
      }).then(async ({ error }) => {
        if (error) {
          // Duplicate row for same day: upgrade goal_progress so timer goals show as completed
          if ((error as any).code === '23505' && targetProgress > 0) {
            await supabase
              .from('task_completions')
              .update({ goal_progress: targetProgress })
              .eq('task_id', currentTask.userTaskId)
              .eq('user_id', user.id)
              .eq('completed_date', dateStr);
            invalidatePlanner();
          }
          return;
        }

        // Update streak & presence in background
        updateStreak(user.id, dateStr).catch(() => {});
        updatePresence(user.id, dateStr).catch(() => {});
        invalidatePlanner();
      });
    }

    return result;
  }, [config, currentTask, currentTaskIndex, sessionId, user, queryClient]);

  const finishSession = useCallback((results: SessionTaskResult[]) => {
    if (!sessionId) return;
    const endTime = new Date();
    const totalSeconds = results.reduce((s, r) => s + r.actualSeconds, 0);
    const completed = results.filter(r => r.status === 'completed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;

    supabase.from('routine_sessions').update({
      ended_at: endTime.toISOString(),
      total_seconds: totalSeconds,
      tasks_completed: completed,
      tasks_skipped: skipped,
    }).eq('id', sessionId).then(() => {});

    const fullyCompleted = !!config && config.tasks.length > 0 && completed === config.tasks.length;
    if (!fullyCompleted || !config || !user) return;

    const syncRoutineProTaskCompletion = async () => {
      const todayStr = getLocalDateStr(new Date());
      const { data: routineProTasks } = await supabase
        .from('user_tasks')
        .select('id, scheduled_date, repeat_pattern, repeat_days, created_at, repeat_end_date, goal_enabled, goal_target')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('pro_link_type', 'routine')
        .eq('pro_link_value', config.routineId);

      const applicableTasks = (routineProTasks || []).filter((task) =>
        taskAppliesToDate(task, todayStr)
      );
      if (applicableTasks.length === 0) return;

      const taskIds = applicableTasks.map((task) => task.id);
      const { data: existingCompletions } = await supabase
        .from('task_completions')
        .select('task_id, goal_progress')
        .eq('user_id', user.id)
        .eq('completed_date', todayStr)
        .in('task_id', taskIds);

      const existingMap = new Map(
        (existingCompletions || []).map((completion) => [completion.task_id, completion.goal_progress || 0])
      );

      const inserts: Array<{ task_id: string; user_id: string; completed_date: string; goal_progress: number }> = [];
      const updates: any[] = [];

      for (const task of applicableTasks) {
        const targetProgress = task.goal_enabled && (task.goal_target || 0) > 0
          ? (task.goal_target || 1)
          : 1;
        const currentProgress = existingMap.get(task.id);

        if (currentProgress === undefined) {
          inserts.push({
            task_id: task.id,
            user_id: user.id,
            completed_date: todayStr,
            goal_progress: targetProgress,
          });
          continue;
        }

        if (currentProgress < targetProgress) {
          updates.push(
            supabase
              .from('task_completions')
              .update({ goal_progress: targetProgress })
              .eq('task_id', task.id)
              .eq('user_id', user.id)
              .eq('completed_date', todayStr)
          );
        }
      }

      await Promise.all([
        inserts.length > 0 ? supabase.from('task_completions').insert(inserts) : Promise.resolve(),
        ...updates,
      ]);

      queryClient.invalidateQueries({ queryKey: ['planner-completions', user.id, todayStr] });
      queryClient.invalidateQueries({ queryKey: ['planner-completions'] });
      queryClient.invalidateQueries({ queryKey: ['planner-completed-dates'] });
      queryClient.invalidateQueries({ queryKey: ['new-home-data', user.id] });
    };

    syncRoutineProTaskCompletion().catch(() => {});
  }, [sessionId, config, user, queryClient]);

  const moveToNext = useCallback((results: SessionTaskResult[]) => {
    if (!config) return;

    const nextIndex = currentTaskIndex + 1;
    if (nextIndex >= config.tasks.length) {
      finishSession(results);
      setPhase('completing');
    } else {
      setCurrentTaskIndex(nextIndex);
      const target = config.tasks[nextIndex].targetSeconds;
      setTimeLeft(target);
      originalTargetRef.current = target;
      elapsedRef.current = 0;
      setTaskStartedAt(new Date());
      setPhase('running');
    }
  }, [config, currentTaskIndex, finishSession]);

  const completeTask = useCallback(() => {
    const result = saveTaskResult('completed');
    if (!result) return;
    const newResults = [...taskResults, result];
    setTaskResults(newResults);
    moveToNext(newResults);
  }, [saveTaskResult, taskResults, moveToNext]);

  const skipTask = useCallback(() => {
    const result = saveTaskResult('skipped');
    if (!result) return;
    const newResults = [...taskResults, result];
    setTaskResults(newResults);
    moveToNext(newResults);
  }, [saveTaskResult, taskResults, moveToNext]);

  const moveTaskToEnd = useCallback(() => {
    if (!config || !currentTask) return;
    const newTasks = [...config.tasks];
    const [movedTask] = newTasks.splice(currentTaskIndex, 1);
    newTasks.push(movedTask);
    setConfig({ ...config, tasks: newTasks });
    const nextTask = newTasks[currentTaskIndex];
    if (nextTask) {
      const target = nextTask.targetSeconds;
      setTimeLeft(target);
      originalTargetRef.current = target;
      elapsedRef.current = 0;
      setTaskStartedAt(new Date());
      setPhase('running');
    }
  }, [config, currentTask, currentTaskIndex]);

  const reorderTasks = useCallback((newTasks: RoutineTask[]) => {
    if (!config) return;
    setConfig({ ...config, tasks: newTasks });
  }, [config]);

  const endRoutineEarly = useCallback(() => {
    if (!config) return;
    // Mark remaining tasks as skipped
    const remainingResults: SessionTaskResult[] = [];
    for (let i = currentTaskIndex; i < config.tasks.length; i++) {
      const t = config.tasks[i];
      remainingResults.push({
        title: t.title,
        emoji: t.emoji,
        targetSeconds: t.targetSeconds,
        actualSeconds: i === currentTaskIndex ? elapsedRef.current : 0,
        status: 'skipped',
      });
    }

    // Save current task to DB
    if (sessionId && currentTask) {
      supabase.from('routine_session_tasks').insert({
        session_id: sessionId,
        task_title: currentTask.title,
        task_emoji: currentTask.emoji,
        task_order: currentTaskIndex,
        target_seconds: currentTask.targetSeconds,
        actual_seconds: elapsedRef.current,
        status: 'skipped',
        user_task_id: currentTask.userTaskId || null,
      } as any).then(() => {});
    }

    const allResults = [...taskResults, ...remainingResults];
    setTaskResults(allResults);
    finishSession(allResults);
    const hasCompletedTasks = allResults.some(r => r.status === 'completed');
    setPhase(hasCompletedTasks ? 'completing' : 'summary');
  }, [config, currentTask, currentTaskIndex, taskResults, sessionId, finishSession]);

  const togglePause = useCallback(() => {
    setPhase(prev => {
      if (prev === 'running') {
        setPauseStartedAt(new Date());
        setPauseElapsed(0);
        return 'paused';
      }
      setPauseStartedAt(null);
      return 'running';
    });
  }, []);

  const adjustTime = useCallback((deltaMinutes: number) => {
    const deltaSec = deltaMinutes * 60;
    originalTargetRef.current += deltaSec;
    // Re-anchor wall clock so the sync loop uses updated target
    runningStartWallRef.current = Date.now();
    elapsedAtRunStartRef.current = elapsedRef.current;
    setTimeLeft(originalTargetRef.current - elapsedRef.current);
  }, []);

  const resetTaskTime = useCallback(() => {
    elapsedRef.current = 0;
    runningStartWallRef.current = Date.now();
    elapsedAtRunStartRef.current = 0;
    setTimeLeft(originalTargetRef.current);
  }, []);

  const closePlayer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase('idle');
    setConfig(null);
    setSessionId(null);
    // Refresh progress data on the focus routines page
    queryClient.invalidateQueries({ queryKey: ['focus-today-sessions'] });
  }, [queryClient]);

  const cancelPlayer = useCallback(() => {
    if (sessionId) {
      supabase.from('routine_sessions').delete().eq('id', sessionId).then(() => {});
    }
    closePlayer();
  }, [sessionId, closePlayer]);

  const endTime = config ? (() => {
    const remaining = config.tasks
      .slice(currentTaskIndex)
      .reduce((s, t) => s + t.targetSeconds, 0);
    const adjustedRemaining = remaining - (config.tasks[currentTaskIndex]?.targetSeconds || 0) + Math.max(0, timeLeft);
    return new Date(Date.now() + adjustedRemaining * 1000);
  })() : null;

  return {
    phase,
    config,
    currentTask,
    currentTaskIndex,
    timeLeft,
    isOvertime,
    overtimeSeconds,
    taskResults,
    startedAt,
    endTime,
    sessionStats,
    taskStartedAt,
    pauseElapsed,
    startRoutine,
    onBreathComplete,
    onCountdownComplete,
    onCompletionCelebrationDone,
    completeTask,
    skipTask,
    moveTaskToEnd,
    reorderTasks,
    endRoutineEarly,
    togglePause,
    adjustTime,
    resetTaskTime,
    closePlayer,
    cancelPlayer,
  };
}
