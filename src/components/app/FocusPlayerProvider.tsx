import { createContext, useContext, type ReactNode } from 'react';
import { useFocusRoutinePlayer, type FocusRoutineConfig } from '@/hooks/useFocusRoutinePlayer';
import { FocusRoutinePlayer } from '@/components/app/FocusRoutinePlayer';
import { OverlayPortal } from '@/components/app/OverlayPortal';

type FocusPlayerContextType = {
  startRoutine: (config: FocusRoutineConfig) => void;
  isActive: boolean;
};

const FocusPlayerContext = createContext<FocusPlayerContextType>({
  startRoutine: () => {},
  isActive: false,
});

export const useFocusPlayer = () => useContext(FocusPlayerContext);

export function FocusPlayerProvider({ children }: { children: ReactNode }) {
  const player = useFocusRoutinePlayer();

  return (
    <FocusPlayerContext.Provider value={{ startRoutine: player.startRoutine, isActive: player.phase !== 'idle' }}>
      {children}
      {player.phase !== 'idle' && player.config && (
        <OverlayPortal>
          <FocusRoutinePlayer
            phase={player.phase as 'breathe' | 'running' | 'paused' | 'summary'}
            config={player.config}
            currentTask={player.currentTask}
            currentTaskIndex={player.currentTaskIndex}
            timeLeft={player.timeLeft}
            taskResults={player.taskResults}
            startedAt={player.startedAt}
            endTime={player.endTime}
            sessionStats={player.sessionStats}
            onBreathComplete={player.onBreathComplete}
            onCompleteTask={player.completeTask}
            onSkipTask={player.skipTask}
            onTogglePause={player.togglePause}
            onAdjustTime={player.adjustTime}
            onClose={player.closePlayer}
            onCancel={player.cancelPlayer}
          />
        </OverlayPortal>
      )}
    </FocusPlayerContext.Provider>
  );
}
