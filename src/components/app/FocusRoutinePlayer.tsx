import { memo, useState } from 'react';
import { Pause, Play, Check, SkipForward, X, ChevronDown, Plus, Minus, RotateCcw } from 'lucide-react';
import { format, addSeconds } from 'date-fns';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { FocusRoutineSummary } from './FocusRoutineSummary';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import type { FocusRoutineConfig } from '@/hooks/useFocusRoutinePlayer';
import type { SessionTaskResult } from './FocusRoutineSummary';

interface FocusRoutinePlayerProps {
  phase: 'breathe' | 'running' | 'paused' | 'summary';
  config: FocusRoutineConfig;
  currentTask: { id: string; title: string; emoji: string; targetSeconds: number; color?: string } | null;
  currentTaskIndex: number;
  timeLeft: number;
  isOvertime: boolean;
  overtimeSeconds: number;
  taskResults: SessionTaskResult[];
  startedAt: Date;
  endTime: Date | null;
  sessionStats: { total: number; streak: number } | undefined;
  taskStartedAt: Date;
  pauseElapsed: number;
  onBreathComplete: () => void;
  onCompleteTask: () => void;
  onSkipTask: () => void;
  onTogglePause: () => void;
  onAdjustTime: (deltaMins: number) => void;
  onResetTime: () => void;
  onMoveTaskToEnd: () => void;
  onEndRoutineEarly: () => void;
  onClose: () => void;
  onCancel: () => void;
}

function formatTime(seconds: number): string {
  const abs = Math.abs(seconds);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const FocusRoutinePlayer = memo(function FocusRoutinePlayer({
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
  onBreathComplete,
  onCompleteTask,
  onSkipTask,
  onTogglePause,
  onAdjustTime,
  onResetTime,
  onMoveTaskToEnd,
  onEndRoutineEarly,
  onClose,
  onCancel,
}: FocusRoutinePlayerProps) {
  const [showAdjustSheet, setShowAdjustSheet] = useState(false);
  const [showSkipSheet, setShowSkipSheet] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);

  const nextTask = config.tasks[currentTaskIndex + 1] || null;
  const progressPercent = currentTask
    ? isOvertime
      ? 100
      : Math.max(0, Math.min(100, ((currentTask.targetSeconds - timeLeft) / currentTask.targetSeconds) * 100))
    : 0;

  // Breathe phase removed — go straight to running
  if (phase === 'breathe') {
    onBreathComplete();
    return null;
  }

  // Summary phase
  if (phase === 'summary') {
    return (
      <FocusRoutineSummary
        routineTitle={config.routineTitle}
        routineEmoji={config.routineEmoji}
        startedAt={startedAt}
        endedAt={new Date()}
        taskResults={taskResults}
        totalSessions={sessionStats?.total || 1}
        streak={sessionStats?.streak || 1}
        onClose={onClose}
      />
    );
  }

  // Task time range
  const taskEndTime = addSeconds(taskStartedAt, currentTask?.targetSeconds || 0);
  const isPaused = phase === 'paused';

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-[#f5f3ef]">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 pt-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}
      >
        <button onClick={onCancel} className="p-2 active:opacity-70">
          <ChevronDown className="w-5 h-5 text-foreground/70" />
        </button>
        <div className="flex items-center gap-1.5 bg-foreground/5 rounded-full px-3 py-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-foreground/70">Focus</span>
          <span className="text-xs text-muted-foreground">
            {currentTaskIndex + 1}/{config.tasks.length}
          </span>
        </div>
        <button onClick={() => { haptic.light(); setShowEndDialog(true); }} className="p-2 active:opacity-70">
          <X className="w-5 h-5 text-foreground/70" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-4 mt-2">
        <div className="h-1 bg-foreground/5 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-linear",
              isOvertime ? "bg-amber-400" : "bg-foreground/70"
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Timer circle */}
        <div className="relative w-56 h-56 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 224 224">
            <circle
              cx="112" cy="112" r="104"
              fill="none" stroke="currentColor" strokeWidth="4"
              className="text-foreground/5"
            />
            <circle
              cx="112" cy="112" r="104"
              fill="none" stroke="currentColor" strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 104}`}
              strokeDashoffset={`${2 * Math.PI * 104 * (1 - progressPercent / 100)}`}
              strokeLinecap="round"
              className={cn(
                "transition-all duration-1000 ease-linear",
                isOvertime ? "text-amber-400" : "text-foreground/50"
              )}
            />
          </svg>

          <div className="flex flex-col items-center">
            <span className="text-5xl mb-3">{currentTask?.emoji || '📝'}</span>
            {isPaused ? (
              <>
                <p className="text-4xl font-bold text-foreground/30 tracking-tight tabular-nums">
                  {formatTime(Math.max(0, timeLeft))}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Paused</p>
                <p className="text-sm font-semibold text-blue-500 tabular-nums mt-0.5">
                  {formatTime(pauseElapsed)}
                </p>
              </>
            ) : isOvertime ? (
              <p className="text-4xl font-bold text-red-500 tracking-tight tabular-nums">
                +{formatTime(overtimeSeconds)}
              </p>
            ) : (
              <p className="text-4xl font-bold text-foreground tracking-tight tabular-nums">
                {formatTime(timeLeft)}
              </p>
            )}
          </div>
        </div>

        {/* Task title */}
        <p className="mt-4 text-lg font-semibold text-foreground text-center max-w-xs">
          {currentTask?.title}
        </p>

        {/* Task time range */}
        <p className="text-xs text-muted-foreground mt-1">
          {format(taskStartedAt, 'h:mma').toLowerCase()} → {format(taskEndTime, 'h:mma').toLowerCase()}
        </p>

        {/* Time adjuster trigger */}
        {!isPaused && (
          <button
            onClick={() => { haptic.light(); setShowAdjustSheet(true); }}
            className="flex items-center gap-4 mt-4 px-4 py-2 rounded-full bg-foreground/5 active:bg-foreground/10"
          >
            <Minus className="w-4 h-4 text-foreground/50" />
            <span className="text-sm text-muted-foreground font-medium tabular-nums">
              {Math.ceil(Math.max(0, timeLeft) / 60)}m
            </span>
            <Plus className="w-4 h-4 text-foreground/50" />
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="px-6 pb-6" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}>
        {/* Next task preview */}
        {nextTask && !isPaused && (
          <div className="flex items-center justify-center gap-2 mb-5 opacity-60">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Next</span>
            <span className="text-sm">{nextTask.emoji}</span>
            <span className="text-sm text-foreground/70 truncate max-w-[180px]">{nextTask.title}</span>
          </div>
        )}

        {isPaused ? (
          /* Paused state: single Resume button */
          <div className="flex justify-center">
            <button
              onClick={() => { haptic.medium(); onTogglePause(); }}
              className="px-10 py-3.5 rounded-full bg-blue-500 text-white font-semibold text-base active:scale-95 transition-transform shadow-lg"
            >
              Resume
            </button>
          </div>
        ) : (
          /* Running state: standard controls */
          <div className="flex items-center justify-center gap-8">
            <button
              onClick={() => { haptic.medium(); onTogglePause(); }}
              className="w-14 h-14 rounded-full bg-foreground/5 flex items-center justify-center active:bg-foreground/10"
            >
              <Pause className="w-6 h-6 text-foreground/70" />
            </button>

            <button
              onClick={() => { haptic.success(); onCompleteTask(); }}
              className="w-[72px] h-[72px] rounded-full bg-foreground flex items-center justify-center active:scale-95 transition-transform shadow-lg"
            >
              <Check className="w-8 h-8 text-background" strokeWidth={3} />
            </button>

            <button
              onClick={() => { haptic.light(); setShowSkipSheet(true); }}
              className="w-14 h-14 rounded-full bg-foreground/5 flex items-center justify-center active:bg-foreground/10"
            >
              <SkipForward className="w-6 h-6 text-foreground/70" />
            </button>
          </div>
        )}

        {/* End time */}
        {endTime && !isPaused && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            All ends {format(endTime, 'h:mm a')}
          </p>
        )}
      </div>

      {/* Adjust Time Bottom Sheet */}
      <Sheet open={showAdjustSheet} onOpenChange={setShowAdjustSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8" hideCloseButton>
          <SheetTitle className="text-center text-base font-semibold mt-2 mb-5">Adjust time</SheetTitle>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '-10 min', delta: -10 },
              { label: '-1 min', delta: -1 },
              { label: '+1 min', delta: 1 },
              { label: '+10 min', delta: 10 },
            ].map(({ label, delta }) => (
              <button
                key={label}
                onClick={() => { haptic.light(); onAdjustTime(delta); }}
                className="py-3 rounded-xl bg-foreground/5 text-foreground font-medium text-sm active:bg-foreground/10"
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => { haptic.light(); onResetTime(); setShowAdjustSheet(false); }}
            className="w-full mt-3 py-3 rounded-xl border border-border text-muted-foreground font-medium text-sm flex items-center justify-center gap-2 active:bg-foreground/5"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </SheetContent>
      </Sheet>

      {/* Skip Confirmation Bottom Sheet */}
      <Sheet open={showSkipSheet} onOpenChange={setShowSkipSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8" hideCloseButton>
          <SheetTitle className="text-center text-base font-semibold mt-2 mb-5">Should we skip?</SheetTitle>
          <div className="space-y-2">
            <button
              onClick={() => {
                haptic.light();
                setShowSkipSheet(false);
                onMoveTaskToEnd();
              }}
              className="w-full py-3.5 rounded-xl bg-foreground/5 text-foreground font-medium text-sm active:bg-foreground/10"
            >
              Move task to end
            </button>
            <button
              onClick={() => {
                haptic.medium();
                setShowSkipSheet(false);
                onSkipTask();
              }}
              className="w-full py-3.5 rounded-xl bg-foreground/5 text-red-500 font-medium text-sm active:bg-foreground/10"
            >
              Skip
            </button>
            <button
              onClick={() => setShowSkipSheet(false)}
              className="w-full py-3.5 rounded-xl text-muted-foreground font-medium text-sm"
            >
              Cancel
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* End Routine Confirmation Dialog */}
      {showEndDialog && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-2xl p-6 mx-8 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-foreground text-center">End the routine?</h3>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Completed tasks will be saved.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEndDialog(false)}
                className="flex-1 py-3 rounded-xl bg-foreground/5 text-foreground font-medium text-sm active:bg-foreground/10"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  haptic.medium();
                  setShowEndDialog(false);
                  onEndRoutineEarly();
                }}
                className="flex-1 py-3 rounded-xl bg-foreground text-background font-medium text-sm active:opacity-90"
              >
                End
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
