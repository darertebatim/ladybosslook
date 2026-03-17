import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import type { SessionTaskResult } from '@/components/app/FocusRoutineSummary';

export interface FocusTask {
  id: string;
  title: string;
  emoji: string;
  targetSeconds: number;
  color?: string;
}

export interface FocusRoutineConfig {
  routineId: string;
  routineTitle: string;
  routineEmoji: string;
  tasks: FocusTask[];
}

type PlayerPhase = 'idle' | 'breathe' | 'running' | 'paused' | 'summary';

export function useFocusRoutinePlayer() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<PlayerPhase>('idle');
  const [config, setConfig] = useState<FocusRoutineConfig | null>(null);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [taskResults, setTaskResults] = useState<SessionTaskResult[]>([]);
  const [startedAt, setStartedAt] = useState<Date>(new Date());
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const elapsedRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      
      // Calculate streak (consecutive days)
      let streak = 0;
      if (data.length > 0) {
        streak = 1;
        const dates = data.map(d => new Date(d.started_at).toDateString());
        const uniqueDates = [...new Set(dates)];
        
        for (let i = 1; i < uniqueDates.length; i++) {
          const prev = new Date(uniqueDates[i - 1]);
          const curr = new Date(uniqueDates[i]);
          const diffDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays <= 1.5) {
            streak++;
          } else {
            break;
          }
        }
      }

      return { total: total + 1, streak: streak + 1 }; // +1 for current session
    },
    enabled: !!user && !!config && phase === 'summary',
  });

  const currentTask = config?.tasks[currentTaskIndex] || null;

  // Timer logic
  useEffect(() => {
    if (phase !== 'running') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase]);

  const startRoutine = useCallback(async (cfg: FocusRoutineConfig) => {
    setConfig(cfg);
    setCurrentTaskIndex(0);
    setTaskResults([]);
    setStartedAt(new Date());
    elapsedRef.current = 0;
    setTimeLeft(cfg.tasks[0]?.targetSeconds || 0);
    setPhase('breathe');

    // Create session in DB
    if (user) {
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

  const onBreathComplete = useCallback(() => {
    setPhase('running');
    elapsedRef.current = 0;
  }, []);

  const completeTask = useCallback(() => {
    if (!config || !currentTask) return;

    const result: SessionTaskResult = {
      title: currentTask.title,
      emoji: currentTask.emoji,
      targetSeconds: currentTask.targetSeconds,
      actualSeconds: elapsedRef.current,
      status: 'completed',
    };

    const newResults = [...taskResults, result];
    setTaskResults(newResults);

    // Save to DB
    if (sessionId) {
      supabase.from('routine_session_tasks').insert({
        session_id: sessionId,
        task_title: currentTask.title,
        task_emoji: currentTask.emoji,
        task_order: currentTaskIndex,
        target_seconds: currentTask.targetSeconds,
        actual_seconds: elapsedRef.current,
        status: 'completed',
      }).then(() => {});
    }

    moveToNext(newResults);
  }, [config, currentTask, taskResults, currentTaskIndex, sessionId]);

  const skipTask = useCallback(() => {
    if (!config || !currentTask) return;

    const result: SessionTaskResult = {
      title: currentTask.title,
      emoji: currentTask.emoji,
      targetSeconds: currentTask.targetSeconds,
      actualSeconds: elapsedRef.current,
      status: 'skipped',
    };

    const newResults = [...taskResults, result];
    setTaskResults(newResults);

    if (sessionId) {
      supabase.from('routine_session_tasks').insert({
        session_id: sessionId,
        task_title: currentTask.title,
        task_emoji: currentTask.emoji,
        task_order: currentTaskIndex,
        target_seconds: currentTask.targetSeconds,
        actual_seconds: elapsedRef.current,
        status: 'skipped',
      }).then(() => {});
    }

    moveToNext(newResults);
  }, [config, currentTask, taskResults, currentTaskIndex, sessionId]);

  const moveToNext = useCallback((results: SessionTaskResult[]) => {
    if (!config) return;

    const nextIndex = currentTaskIndex + 1;
    if (nextIndex >= config.tasks.length) {
      // Routine complete
      const endTime = new Date();
      const totalSeconds = results.reduce((s, r) => s + r.actualSeconds, 0);
      const completed = results.filter(r => r.status === 'completed').length;
      const skipped = results.filter(r => r.status === 'skipped').length;

      if (sessionId) {
        supabase.from('routine_sessions').update({
          ended_at: endTime.toISOString(),
          total_seconds: totalSeconds,
          tasks_completed: completed,
          tasks_skipped: skipped,
        }).eq('id', sessionId).then(() => {});
      }

      setPhase('summary');
    } else {
      setCurrentTaskIndex(nextIndex);
      setTimeLeft(config.tasks[nextIndex].targetSeconds);
      elapsedRef.current = 0;
      setPhase('running');
    }
  }, [config, currentTaskIndex, sessionId]);

  const togglePause = useCallback(() => {
    setPhase(prev => prev === 'running' ? 'paused' : 'running');
  }, []);

  const adjustTime = useCallback((deltaMinutes: number) => {
    setTimeLeft(prev => Math.max(0, prev + deltaMinutes * 60));
  }, []);

  const closePlayer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase('idle');
    setConfig(null);
    setSessionId(null);
  }, []);

  const cancelPlayer = useCallback(() => {
    // Delete incomplete session
    if (sessionId) {
      supabase.from('routine_sessions').delete().eq('id', sessionId).then(() => {});
    }
    closePlayer();
  }, [sessionId, closePlayer]);

  const endTime = config ? (() => {
    const remaining = config.tasks
      .slice(currentTaskIndex)
      .reduce((s, t) => s + t.targetSeconds, 0);
    const adjustedRemaining = remaining - (config.tasks[currentTaskIndex]?.targetSeconds || 0) + timeLeft;
    return new Date(Date.now() + adjustedRemaining * 1000);
  })() : null;

  return {
    phase,
    config,
    currentTask,
    currentTaskIndex,
    timeLeft,
    taskResults,
    startedAt,
    endTime,
    sessionStats,
    startRoutine,
    onBreathComplete,
    completeTask,
    skipTask,
    togglePause,
    adjustTime,
    closePlayer,
    cancelPlayer,
  };
}
