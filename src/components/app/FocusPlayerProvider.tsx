import { createContext, useContext, useState, type ReactNode } from 'react';
import { useFocusRoutinePlayer, type FocusRoutineConfig } from '@/hooks/useFocusRoutinePlayer';
import { FocusRoutinePlayer } from '@/components/app/FocusRoutinePlayer';
import { FocusMiniPlayer } from '@/components/app/FocusMiniPlayer';
import { OverlayPortal } from '@/components/app/OverlayPortal';

type FocusPlayerContextType = {
  startRoutine: (config: FocusRoutineConfig) => void;
  isActive: boolean;
  isMinimized: boolean;
};

const FocusPlayerContext = createContext<FocusPlayerContextType>({
  startRoutine: () => {},
  isActive: false,
  isMinimized: false,
});

export const useFocusPlayer = () => useContext(FocusPlayerContext);

export function FocusPlayerProvider({ children }: { children: ReactNode }) {
  const player = useFocusRoutinePlayer();
  const [minimized, setMinimized] = useState(false);

  const handleStartRoutine = (config: FocusRoutineConfig) => {
    setMinimized(false);
    player.startRoutine(config);
  };

  const handleMinimize = () => setMinimized(true);
  const handleMaximize = () => setMinimized(false);

  const isActive = player.phase !== 'idle';
  const isRunningOrPaused = player.phase === 'running' || player.phase === 'paused';

  return (
    <FocusPlayerContext.Provider value={{ startRoutine: handleStartRoutine, isActive, isMinimized: minimized }}>
      {children}
      {isActive && player.config && !minimized && (
        <OverlayPortal>
          <FocusRoutinePlayer
            phase={player.phase as 'breathe' | 'running' | 'paused' | 'summary'}
            config={player.config}
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
      {/* Mini player when minimized and running/paused */}
      {isActive && player.config && minimized && isRunningOrPaused && (
        <FocusMiniPlayer
          currentTask={player.currentTask}
          timeLeft={player.timeLeft}
          isOvertime={player.isOvertime}
          overtimeSeconds={player.overtimeSeconds}
          isPaused={player.phase === 'paused'}
          onMaximize={handleMaximize}
          onTogglePause={player.togglePause}
          onCompleteTask={player.completeTask}
        />
      )}
    </FocusPlayerContext.Provider>
  );
}
