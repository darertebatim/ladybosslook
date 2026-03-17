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

      {/* Task title + time range — ABOVE circle */}
      <div className="px-6 mt-4">
        <h2 className="text-xl font-bold text-foreground text-center leading-snug max-w-xs mx-auto">
          {currentTask?.title}
        </h2>
        <p className="text-sm text-muted-foreground text-center mt-1">
          {format(taskStartedAt, 'h:mma').toLowerCase()}  →  {format(taskEndTime, 'h:mma').toLowerCase()}
        </p>
      </div>

      {/* Main circle area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Timer circle with emoji + time + adjuster inside */}
        <div className="relative w-60 h-60 flex items-center justify-center">
          {/* Background filled circle */}
          <div className="absolute inset-0 rounded-full bg-foreground/[0.04]" />

          {/* Progress ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 240 240">
            <circle
              cx="120" cy="120" r="114"
              fill="none" stroke="currentColor" strokeWidth="4"
              className="text-foreground/[0.06]"
            />
            <circle
              cx="120" cy="120" r="114"
              fill="none" stroke="currentColor" strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 114}`}
              strokeDashoffset={`${2 * Math.PI * 114 * (1 - progressPercent / 100)}`}
              strokeLinecap="round"
              className={cn(
                "transition-all duration-1000 ease-linear",
                isOvertime ? "text-amber-400" : "text-foreground/40"
              )}
            />
          </svg>

          {/* Circle content */}
          <div className="relative flex flex-col items-center z-10">
            {/* 3D Emoji */}
            <FluentEmoji emoji={currentTask?.emoji || '📝'} size={56} className="mb-2" />

            {/* Timer */}
            {isPaused ? (
              <>
                <p className="text-[42px] font-extrabold text-foreground/25 tracking-tight tabular-nums leading-none">
                  {formatTime(Math.max(0, timeLeft))}
                </p>
                <p className="text-xs text-foreground/30 mt-1.5 font-medium">Paused</p>
              </>
            ) : isOvertime ? (
              <>
                <p className="text-[42px] font-extrabold text-red-500 tracking-tight tabular-nums leading-none">
                  +{formatTime(overtimeSeconds)}
                </p>
                {/* Time adjuster inside circle */}
                <button
                  onClick={() => { haptic.light(); setShowAdjustSheet(true); }}
                  className="flex items-center gap-3 mt-2 px-3 py-1 rounded-full active:bg-foreground/5"
                >
                  <Minus className="w-3.5 h-3.5 text-foreground/40" />
                  <span className="text-xs text-muted-foreground font-medium tabular-nums">
                    {Math.ceil(Math.max(0, timeLeft) / 60)}m
                  </span>
                  <Plus className="w-3.5 h-3.5 text-foreground/40" />
                </button>
              </>
            ) : (
              <>
                <p className="text-[42px] font-extrabold text-foreground tracking-tight tabular-nums leading-none">
                  {formatTime(timeLeft)}
                </p>
                {/* Time adjuster inside circle */}
                <button
                  onClick={() => { haptic.light(); setShowAdjustSheet(true); }}
                  className="flex items-center gap-3 mt-2 px-3 py-1 rounded-full active:bg-foreground/5"
                >
                  <Minus className="w-3.5 h-3.5 text-foreground/40" />
                  <span className="text-xs text-muted-foreground font-medium tabular-nums">
                    {Math.ceil(Math.max(0, timeLeft) / 60)}m
                  </span>
                  <Plus className="w-3.5 h-3.5 text-foreground/40" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Controls section */}
      <div className="px-6 pb-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
        {isPaused ? (
          /* Paused state: pause counter + Resume outside circle */
          <div className="flex flex-col items-center gap-3 mb-4">
            <p className="text-[36px] font-extrabold text-blue-500 tabular-nums leading-none">
              {formatTime(pauseElapsed)}
            </p>
            <button
              onClick={() => { haptic.medium(); onTogglePause(); }}
              className="px-10 py-3.5 rounded-full bg-blue-500 text-white font-semibold text-base active:scale-95 transition-transform shadow-lg"
            >
              Resume
            </button>
          </div>
        ) : (
          /* Running state: Pause / Complete / Skip */
          <div className="flex items-center justify-center gap-8 mb-4">
            <button
              onClick={() => { haptic.medium(); onTogglePause(); }}
              className="w-14 h-14 rounded-full bg-foreground/5 flex items-center justify-center active:bg-foreground/10"
            >
              <Pause className="w-6 h-6 text-foreground/60" />
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
              <SkipForward className="w-6 h-6 text-foreground/60" />
            </button>
          </div>
        )}

        {/* Next task preview — below buttons */}
        {nextTask && !isPaused && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-foreground/5 rounded px-1.5 py-0.5">
              Next
            </span>
            <FluentEmoji emoji={nextTask.emoji} size={18} />
            <span className="text-sm text-foreground/60 truncate max-w-[200px]">{nextTask.title}</span>
          </div>
        )}

        {/* Bottom card: All ends time + Rearrange */}
        {endTime && (
          <div className="flex items-center justify-between bg-foreground/[0.04] rounded-2xl px-5 py-3.5 mt-1">
            <div>
              <p className="text-xs text-muted-foreground">All ends</p>
              <p className="text-base font-bold text-foreground">{format(endTime, 'h:mma').toLowerCase()}</p>
            </div>
            <button className="text-sm font-medium text-muted-foreground px-4 py-2 rounded-xl bg-foreground/5 active:bg-foreground/10">
              Rearrange
            </button>
          </div>
        )}
      </div>

      {/* Adjust Time Bottom Sheet */}
      <Sheet open={showAdjustSheet} onOpenChange={setShowAdjustSheet}>
        <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-8" hideCloseButton>
          <SheetTitle className="text-center text-lg font-bold mt-3 mb-6">Adjust time</SheetTitle>
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: '—', label: '10 min', delta: -10 },
              { icon: '—', label: '1 min', delta: -1 },
              { icon: '+', label: '1 min', delta: 1 },
              { icon: '+', label: '10 min', delta: 10 },
            ].map(({ icon, label, delta }) => (
              <button
                key={`${icon}${label}`}
                onClick={() => { haptic.light(); onAdjustTime(delta); }}
                className="flex flex-col items-center gap-1 py-4 rounded-2xl bg-foreground/[0.06] active:bg-foreground/10"
              >
                <span className="text-lg font-semibold text-foreground/70">{icon}</span>
                <span className="text-xs text-foreground/60 font-medium">{label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => { haptic.light(); onResetTime(); setShowAdjustSheet(false); }}
            className="w-full mt-4 py-4 rounded-2xl bg-foreground/[0.04] text-red-500 font-semibold text-base active:bg-foreground/[0.08]"
          >
            Reset
          </button>
        </SheetContent>
      </Sheet>

      {/* Skip Confirmation Bottom Sheet */}
      <Sheet open={showSkipSheet} onOpenChange={setShowSkipSheet}>
        <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-8" hideCloseButton>
          <SheetTitle className="text-center text-lg font-bold mt-3 mb-6">Should we skip?</SheetTitle>
          <div className="space-y-2.5">
            <button
              onClick={() => {
                haptic.light();
                setShowSkipSheet(false);
              }}
              className="w-full py-4 rounded-2xl bg-foreground/[0.06] text-foreground font-semibold text-base active:bg-foreground/10"
            >
              Rearrange order
            </button>
            <button
              onClick={() => {
                haptic.light();
                setShowSkipSheet(false);
                onMoveTaskToEnd();
              }}
              className="w-full py-4 rounded-2xl bg-foreground/[0.06] text-foreground font-semibold text-base active:bg-foreground/10"
            >
              Move task to end
            </button>
            <button
              onClick={() => {
                haptic.medium();
                setShowSkipSheet(false);
                onSkipTask();
              }}
              className="w-full py-4 rounded-2xl bg-foreground/[0.06] text-foreground/60 font-semibold text-base active:bg-foreground/10"
            >
              Skip
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
