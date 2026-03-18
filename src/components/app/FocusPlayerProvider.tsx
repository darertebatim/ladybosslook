import { createContext, useContext, useState, type ReactNode } from 'react';
import { useFocusRoutinePlayer, type FocusRoutineConfig } from '@/hooks/useFocusRoutinePlayer';
import { FocusRoutinePlayer } from '@/components/app/FocusRoutinePlayer';
import { OverlayPortal } from '@/components/app/OverlayPortal';

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
});

export const useFocusPlayer = () => useContext(FocusPlayerContext);

export function FocusPlayerProvider({ children }: { children: ReactNode }) {
  const player = useFocusRoutinePlayer();
  const [minimized, setMinimized] = useState(false);

  const handleMinimize = () => setMinimized(true);
  const handleMaximize = () => setMinimized(false);

  // Auto-expand on summary so user sees results
  const isActive = player.phase !== 'idle';
  const isSummary = player.phase === 'summary';
  const showFullPlayer = isActive && player.config && (!minimized || isSummary);

  return (
    <FocusPlayerContext.Provider value={{
      startRoutine: (cfg) => { setMinimized(false); player.startRoutine(cfg); },
      isActive,
      isMinimized: isActive && minimized,
      maximize: handleMaximize,
      currentTask: player.currentTask,
      timeLeft: player.timeLeft,
      isOvertime: player.isOvertime,
      phase: player.phase,
      togglePause: player.togglePause,
      completeTask: player.completeTask,
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
          />
        </OverlayPortal>
      )}
    </FocusPlayerContext.Provider>
  );
}
