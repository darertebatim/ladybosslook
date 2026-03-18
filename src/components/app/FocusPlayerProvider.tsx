import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  /** True when the current task is a pro-linked task and user is inside the tool */
  isProTaskActive: boolean;
  /** Complete the pro task and return to the player / next task */
  completeProTask: () => void;
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
  isProTaskActive: false,
  completeProTask: () => {},
});

export const useFocusPlayer = () => useContext(FocusPlayerContext);

export function FocusPlayerProvider({ children }: { children: ReactNode }) {
  const player = useFocusRoutinePlayer();
  const [minimized, setMinimized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Track which task id we already auto-navigated to (prevent loops)
  const autoNavTaskIdRef = useRef<string | null>(null);
  const [proTaskActive, setProTaskActive] = useState(false);

  const handleMinimize = () => setMinimized(true);
  const handleMaximize = () => setMinimized(false);

  const openProTask = useCallback(() => {
    const task = player.currentTask;
    if (!task?.proLinkType) return;
    const path = getProTaskNavigationPath(task.proLinkType as ProLinkType, task.proLinkValue || null);
    setMinimized(true);
    setProTaskActive(true);
    navigate(path, { state: { fromFocusRoutine: true } });
  }, [player.currentTask, navigate]);

  // Complete pro task: mark as done and move to next
  const completeProTask = useCallback(() => {
    setProTaskActive(false);
    player.completeTask();
    // After completing, the next task will be evaluated by the auto-nav effect
  }, [player]);

  // Auto-navigate to pro tool when a pro-linked task becomes current
  useEffect(() => {
    if (player.phase !== 'running') return;
    const task = player.currentTask;
    if (!task?.proLinkType) {
      // Non-pro task: make sure player is visible
      if (autoNavTaskIdRef.current) {
        autoNavTaskIdRef.current = null;
        setMinimized(false);
        setProTaskActive(false);
      }
      return;
    }
    // Already navigated for this task
    if (autoNavTaskIdRef.current === task.id) return;
    autoNavTaskIdRef.current = task.id;

    // Auto-navigate to the tool
    const path = getProTaskNavigationPath(task.proLinkType as ProLinkType, task.proLinkValue || null);
    setMinimized(true);
    setProTaskActive(true);
    // Small delay to let state settle
    setTimeout(() => {
      navigate(path, { state: { fromFocusRoutine: true } });
    }, 100);
  }, [player.phase, player.currentTask, navigate]);

  // Reset auto-nav tracking when routine ends
  useEffect(() => {
    if (player.phase === 'idle' || player.phase === 'summary') {
      autoNavTaskIdRef.current = null;
      setProTaskActive(false);
    }
  }, [player.phase]);

  // Auto-expand on summary so user sees results
  const isActive = player.phase !== 'idle';
  const isSummary = player.phase === 'summary';
  const showFullPlayer = isActive && player.config && (!minimized || isSummary) && !proTaskActive;

  return (
    <FocusPlayerContext.Provider value={{
      startRoutine: (cfg, resumeOpts) => {
        setMinimized(false);
        autoNavTaskIdRef.current = null;
        player.startRoutine(cfg, resumeOpts);
      },
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
      isProTaskActive: proTaskActive,
      completeProTask,
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