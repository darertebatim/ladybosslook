import { memo, useMemo } from 'react';
import { Pause, Play, Check, SkipForward, Minus, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { FocusRoutineBreathIntro } from './FocusRoutineBreathIntro';
import { FocusRoutineSummary } from './FocusRoutineSummary';
import type { FocusRoutineConfig } from '@/hooks/useFocusRoutinePlayer';
import type { SessionTaskResult } from './FocusRoutineSummary';

interface FocusRoutinePlayerProps {
  phase: 'breathe' | 'running' | 'paused' | 'summary';
  config: FocusRoutineConfig;
  currentTask: { id: string; title: string; emoji: string; targetSeconds: number; color?: string } | null;
  currentTaskIndex: number;
  timeLeft: number;
  taskResults: SessionTaskResult[];
  startedAt: Date;
  endTime: Date | null;
  sessionStats: { total: number; streak: number } | undefined;
  onBreathComplete: () => void;
  onCompleteTask: () => void;
  onSkipTask: () => void;
  onTogglePause: () => void;
  onAdjustTime: (deltaMins: number) => void;
  onClose: () => void;
  onCancel: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const FocusRoutinePlayer = memo(function FocusRoutinePlayer({
  phase,
  config,
  currentTask,
  currentTaskIndex,
  timeLeft,
  taskResults,
  startedAt,
  endTime,
  sessionStats,
  onBreathComplete,
  onCompleteTask,
  onSkipTask,
  onTogglePause,
  onAdjustTime,
  onClose,
  onCancel,
}: FocusRoutinePlayerProps) {

  const nextTask = config.tasks[currentTaskIndex + 1] || null;
  const progressPercent = currentTask
    ? Math.max(0, Math.min(100, ((currentTask.targetSeconds - timeLeft) / currentTask.targetSeconds) * 100))
    : 0;

  // Breathe intro phase
  if (phase === 'breathe') {
    return (
      <FocusRoutineBreathIntro
        routineTitle={config.routineTitle}
        routineEmoji={config.routineEmoji}
        onComplete={onBreathComplete}
        onCancel={onCancel}
      />
    );
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

  // Running / Paused phase
  const isTimerDone = timeLeft === 0;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-[#f5f3ef]">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 pt-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}
      >
        <button onClick={onCancel} className="p-2 active:opacity-70">
          <X className="w-5 h-5 text-foreground/70" />
        </button>
        <div className="text-center">
          <p className="text-xs text-muted-foreground font-medium">
            {currentTaskIndex + 1} / {config.tasks.length}
          </p>
        </div>
        <div className="w-9" /> {/* Spacer */}
      </div>

      {/* Progress bar */}
      <div className="px-4 mt-2">
        <div className="h-1 bg-black/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground/70 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Task emoji & timer circle */}
        <div className="relative w-56 h-56 flex items-center justify-center">
          {/* Background circle */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 224 224">
            <circle
              cx="112" cy="112" r="104"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-black/5"
            />
            <circle
              cx="112" cy="112" r="104"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 104}`}
              strokeDashoffset={`${2 * Math.PI * 104 * (1 - progressPercent / 100)}`}
              strokeLinecap="round"
              className="text-foreground/50 transition-all duration-1000 ease-linear"
            />
          </svg>

          <div className="flex flex-col items-center">
            <span className="text-5xl mb-3">{currentTask?.emoji || '📝'}</span>
            <p className="text-4xl font-bold text-foreground tracking-tight tabular-nums">
              {formatTime(timeLeft)}
            </p>
          </div>
        </div>

        {/* Task title */}
        <p className="mt-4 text-lg font-semibold text-foreground text-center max-w-xs">
          {currentTask?.title}
        </p>

        {/* Time adjuster */}
        <div className="flex items-center gap-6 mt-4">
          <button
            onClick={() => { haptic.light(); onAdjustTime(-1); }}
            className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center active:bg-black/10"
          >
            <Minus className="w-4 h-4 text-foreground/60" />
          </button>
          <span className="text-sm text-muted-foreground font-medium">1m</span>
          <button
            onClick={() => { haptic.light(); onAdjustTime(1); }}
            className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center active:bg-black/10"
          >
            <Plus className="w-4 h-4 text-foreground/60" />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 pb-6" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}>
        {/* Next task preview */}
        {nextTask && (
          <div className="flex items-center justify-center gap-2 mb-5 opacity-60">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Next</span>
            <span className="text-sm">{nextTask.emoji}</span>
            <span className="text-sm text-foreground/70 truncate max-w-[180px]">{nextTask.title}</span>
          </div>
        )}

        {/* Control buttons */}
        <div className="flex items-center justify-center gap-8">
          {/* Pause / Play */}
          <button
            onClick={() => { haptic.medium(); onTogglePause(); }}
            className="w-14 h-14 rounded-full bg-black/5 flex items-center justify-center active:bg-black/10"
          >
            {phase === 'paused' ? (
              <Play className="w-6 h-6 text-foreground/70 ml-0.5" />
            ) : (
              <Pause className="w-6 h-6 text-foreground/70" />
            )}
          </button>

          {/* Complete / Done */}
          <button
            onClick={() => { haptic.success(); onCompleteTask(); }}
            className="w-[72px] h-[72px] rounded-full bg-foreground flex items-center justify-center active:scale-95 transition-transform shadow-lg"
          >
            <Check className="w-8 h-8 text-background" strokeWidth={3} />
          </button>

          {/* Skip */}
          <button
            onClick={() => { haptic.light(); onSkipTask(); }}
            className="w-14 h-14 rounded-full bg-black/5 flex items-center justify-center active:bg-black/10"
          >
            <SkipForward className="w-6 h-6 text-foreground/70" />
          </button>
        </div>

        {/* End time */}
        {endTime && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            All ends {format(endTime, 'h:mm a')}
          </p>
        )}
      </div>
    </div>
  );
});
