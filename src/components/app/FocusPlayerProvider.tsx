import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useFocusRoutinePlayer, type FocusRoutineConfig } from '@/hooks/useFocusRoutinePlayer';
import { FocusRoutinePlayer } from '@/components/app/FocusRoutinePlayer';
import { OverlayPortal } from '@/components/app/OverlayPortal';
import { getProTaskNavigationPath, type ProLinkType } from '@/lib/proTaskTypes';

type ResumeOptions = {
  startFromIndex: number;
  previousResults: import('@/components/app/FocusRoutineSummary').SessionTaskResult[];
  existingSessionId: string;
};

type FocusPlayerContextType = {
  startRoutine: (config: FocusRoutineConfig, resumeOptions?: ResumeOptions) => void;
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

const FocusPlayerContext = createContext<FocusPlayerContextType>({
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

export const useFocusPlayer = () => useContext(FocusPlayerContext);

export function FocusPlayerProvider({ children }: { children: ReactNode }) {
  const player = useFocusRoutinePlayer();
  const [minimized, setMinimized] = useState(false);
  const navigate = useNavigate();

  const handleMinimize = () => setMinimized(true);
  const handleMaximize = () => setMinimized(false);

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

  return (
    <FocusPlayerContext.Provider value={{
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
          <FocusRoutinePlayer
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
