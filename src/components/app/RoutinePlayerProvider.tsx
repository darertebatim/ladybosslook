import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useRoutinePlayer, type RoutinePlayerConfig } from '@/hooks/useRoutinePlayer';
import { RoutinePlayer } from '@/components/app/RoutinePlayer';
import { OverlayPortal } from '@/components/app/OverlayPortal';
import { getProTaskNavigationPath, type ProLinkType } from '@/lib/proTaskTypes';

type ResumeOptions = {
  startFromIndex: number;
  previousResults: import('@/components/app/RoutinePlayerSummary').SessionTaskResult[];
  existingSessionId: string;
};

type RoutinePlayerContextType = {
  startRoutine: (config: RoutinePlayerConfig, resumeOptions?: ResumeOptions) => void;
  isActive: boolean;
  isMinimized: boolean;
  maximize: () => void;
  currentTask: { emoji: string; title: string; color?: string } | null;
  timeLeft: number;
  isOvertime: boolean;
  phase: string;
  togglePause: () => void;
  completeTask: () => void;
  openProTask: () => void;
};

const RoutinePlayerContext = createContext<RoutinePlayerContextType>({
  startRoutine: () => {},
  isActive: false,
  isMinimized: false,
  maximize: () => {},
  currentTask: null,
  timeLeft: 0,
  isOvertime: false,
  phase: 'idle',
  togglePause: () => {},
  completeTask: () => {},
  openProTask: () => {},
});

export const useRoutinePlayerContext = () => useContext(RoutinePlayerContext);

export function RoutinePlayerProvider({ children }: { children: ReactNode }) {
  const player = useRoutinePlayer();
  const { user } = useAuth();
  const [minimized, setMinimized] = useState(false);
  const navigate = useNavigate();
  const syncingRef = useRef(false);

  const handleMinimize = () => setMinimized(true);

  // When maximizing, check if the current task was already completed
  // by autoComplete (e.g. breathing/mood/journal wrote to task_completions).
  // If so, auto-advance the player — single source of truth.
  const handleMaximize = useCallback(async () => {
    setMinimized(false);

    const task = player.currentTask;
    if (!task?.userTaskId || !user?.id || syncingRef.current) return;

    syncingRef.current = true;
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data } = await supabase
        .from('task_completions')
        .select('id')
        .eq('task_id', task.userTaskId)
        .eq('user_id', user.id)
        .eq('completed_date', today)
        .maybeSingle();

      if (data) {
        // Task was already completed by the tool — advance the player
        player.completeTask();
      }
    } catch {
      // ignore — player will still show, user can manually complete
    } finally {
      syncingRef.current = false;
    }
  }, [player, user?.id]);

  const openProTask = useCallback(() => {
    const task = player.currentTask;
    if (!task?.proLinkType) return;
    const path = getProTaskNavigationPath(task.proLinkType as ProLinkType, task.proLinkValue || null);
    setMinimized(true);
    navigate(path);
  }, [player.currentTask, navigate]);

  // Auto-expand on summary so user sees results
  const isActive = player.phase !== 'idle';
  const isSummary = player.phase === 'summary';
  const showFullPlayer = isActive && player.config && (!minimized || isSummary);

  // Auto-navigate to pro-task tool when a pro-task becomes current
  const autoOpenedTaskRef = useRef<string | null>(null);
  useEffect(() => {
    const task = player.currentTask;
    if (!task?.proLinkType || !isActive || minimized) return;
    const taskKey = `${task.userTaskId || task.title}-${player.currentTaskIndex}`;
    if (autoOpenedTaskRef.current === taskKey) return;
    autoOpenedTaskRef.current = taskKey;
    const timer = setTimeout(() => {
      openProTask();
    }, 800);
    return () => clearTimeout(timer);
  }, [player.currentTask, player.currentTaskIndex, isActive, minimized, openProTask]);

  // Reset auto-open ref when routine ends
  useEffect(() => {
    if (!isActive) {
      autoOpenedTaskRef.current = null;
    }
  }, [isActive]);

  return (
    <RoutinePlayerContext.Provider value={{
      startRoutine: (cfg, resumeOpts) => { setMinimized(false); player.startRoutine(cfg, resumeOpts); },
      isActive,
      isMinimized: isActive && minimized,
      maximize: handleMaximize,
      currentTask: player.currentTask,
      timeLeft: player.timeLeft,
      isOvertime: player.isOvertime,
      phase: player.phase,
      togglePause: player.togglePause,
      completeTask: player.completeTask,
      openProTask,
    }}>
      {children}
      {showFullPlayer && (
        <OverlayPortal>
          <RoutinePlayer
            phase={player.phase as 'breathe' | 'running' | 'paused' | 'summary'}
            config={player.config!}
            currentTask={player.currentTask}
            currentTaskIndex={player.currentTaskIndex}
            timeLeft={player.timeLeft}
            isOvertime={player.isOvertime}
            overtimeSeconds={player.overtimeSeconds}
            taskResults={player.taskResults}
            startedAt={player.startedAt}
            endTime={player.endTime}
            sessionStats={player.sessionStats}
            taskStartedAt={player.taskStartedAt}
            pauseElapsed={player.pauseElapsed}
            onBreathComplete={player.onBreathComplete}
            onCompleteTask={player.completeTask}
            onSkipTask={player.skipTask}
            onTogglePause={player.togglePause}
            onAdjustTime={player.adjustTime}
            onResetTime={player.resetTaskTime}
            onMoveTaskToEnd={player.moveTaskToEnd}
            onReorderTasks={player.reorderTasks}
            onEndRoutineEarly={player.endRoutineEarly}
            onClose={player.closePlayer}
            onCancel={player.cancelPlayer}
            onMinimize={handleMinimize}
            onOpenProTask={openProTask}
          />
        </OverlayPortal>
      )}
    </FocusPlayerContext.Provider>
  );
}
