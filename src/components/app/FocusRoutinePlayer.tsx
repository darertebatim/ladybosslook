import { memo, useState, useCallback, useEffect } from 'react';
import { Pause, Play, Check, SkipForward, X, ChevronDown, Plus, Minus, GripVertical, ChevronUp, ArrowUp, ArrowDown } from 'lucide-react';
import { format, addSeconds } from 'date-fns';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { FocusRoutineSummary } from './FocusRoutineSummary';
import type { FocusRoutineConfig, FocusTask } from '@/hooks/useFocusRoutinePlayer';
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
  onReorderTasks: (tasks: FocusTask[]) => void;
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
  onReorderTasks,
  onEndRoutineEarly,
  onClose,
  onCancel,
}: FocusRoutinePlayerProps) {
  const [showAdjustSheet, setShowAdjustSheet] = useState(false);
  const [showNotifySheet, setShowNotifySheet] = useState(false);
  const [showSkipSheet, setShowSkipSheet] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showCompletionFlash, setShowCompletionFlash] = useState(false);
  const [showPlaylistSheet, setShowPlaylistSheet] = useState(false);
  const [showRearrangeSheet, setShowRearrangeSheet] = useState(false);
  const [rearrangeTasks, setRearrangeTasks] = useState<FocusTask[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskMinutes, setNewTaskMinutes] = useState(1);

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

  const handleComplete = () => {
    haptic.success();
    setShowCompletionFlash(true);
    setTimeout(() => {
      setShowCompletionFlash(false);
      onCompleteTask();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-[#f5f3ef]">
      {/* Completion flash overlay */}
      {showCompletionFlash && (
        <div className="absolute inset-0 z-[10] pointer-events-none animate-in fade-in-0 duration-200">
          <div className="absolute inset-0 bg-emerald-400/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full bg-emerald-500 flex items-center justify-center animate-in zoom-in-50 duration-300">
              <Check className="w-14 h-14 text-white" strokeWidth={3} />
            </div>
          </div>
        </div>
      )}

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

      {/* Task title + time range */}
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
        <div className="relative w-64 h-64 flex items-center justify-center">
          <div className="absolute inset-3 rounded-full bg-foreground/[0.04]" />

          {/* Progress ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 256 256">
            <circle cx="128" cy="128" r="120" fill="none" stroke="currentColor" strokeWidth="14" className="text-transparent" />
            <circle
              cx="128" cy="128" r="120"
              fill="none" strokeWidth="14"
              strokeDasharray={`${2 * Math.PI * 120}`}
              strokeDashoffset={`${2 * Math.PI * 120 * (1 - progressPercent / 100)}`}
              strokeLinecap="round"
              className="stroke-amber-400 transition-all duration-1000 ease-linear"
              style={{ filter: 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.4))' }}
            />
          </svg>

          {/* Circle content */}
          <div className="relative flex flex-col items-center z-10">
            <FluentEmoji emoji={currentTask?.emoji || '📝'} size={56} className="mb-2" />

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
                <button
                  onClick={() => { haptic.light(); setShowNotifySheet(true); }}
                  className="mt-2 px-3 py-1 rounded-full active:bg-foreground/5"
                >
                  <span className="text-sm text-muted-foreground underline underline-offset-2">Notify again</span>
                </button>
              </>
            ) : (
              <>
                <p className="text-[42px] font-extrabold text-foreground tracking-tight tabular-nums leading-none">
                  {formatTime(timeLeft)}
                </p>
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
          <div className="flex items-center justify-center gap-8 mb-4">
            <button
              onClick={() => { haptic.medium(); onTogglePause(); }}
              className="w-14 h-14 rounded-full bg-foreground/5 flex items-center justify-center active:bg-foreground/10"
            >
              <Pause className="w-6 h-6 text-foreground/60" />
            </button>

            <button
              onClick={handleComplete}
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

        {/* Next task preview */}
        {nextTask && !isPaused && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-foreground/5 rounded px-1.5 py-0.5">
              Next
            </span>
            <FluentEmoji emoji={nextTask.emoji} size={18} />
            <span className="text-sm text-foreground/60 truncate max-w-[200px]">{nextTask.title}</span>
          </div>
        )}

        {/* Bottom card */}
        {endTime && (
          <div className="flex items-center justify-between bg-foreground/[0.04] rounded-2xl px-5 py-3.5 mt-1">
            <div>
              <p className="text-xs text-muted-foreground">All ends</p>
              <p className="text-base font-bold text-foreground">{format(endTime, 'h:mma').toLowerCase()}</p>
            </div>
            <button
              onClick={() => { haptic.light(); setShowPlaylistSheet(true); }}
              className="text-sm font-medium text-muted-foreground px-4 py-2 rounded-xl bg-foreground/5 active:bg-foreground/10"
            >
              Rearrange
            </button>
          </div>
        )}
      </div>
      {showAdjustSheet && (
        <>
          <div
            className="absolute inset-0 bg-black/40 z-[10] animate-in fade-in-0 duration-200"
            onClick={() => setShowAdjustSheet(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 z-[11] bg-background rounded-t-3xl px-6 pb-8 pt-2 animate-in slide-in-from-bottom duration-300"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)' }}
          >
            <div className="w-10 h-1 bg-foreground/10 rounded-full mx-auto mb-4" />
            <h3 className="text-center text-lg font-bold mb-6">Adjust time</h3>
            <div className="grid grid-cols-4 gap-3">
              {[
                { icon: '—', label: '10 min', delta: -10 },
                { icon: '—', label: '1 min', delta: -1 },
                { icon: '+', label: '1 min', delta: 1 },
                { icon: '+', label: '10 min', delta: 10 },
              ].map(({ icon, label, delta }) => {
                const wouldGoBelowZero = delta < 0 && timeLeft + delta * 60 < 0;
                return (
                  <button
                    key={`${icon}${label}`}
                    disabled={wouldGoBelowZero}
                    onClick={() => { haptic.light(); onAdjustTime(delta); }}
                    className="flex flex-col items-center gap-1 py-4 rounded-2xl bg-foreground/[0.06] active:bg-foreground/10 disabled:opacity-30 disabled:active:bg-foreground/[0.06]"
                  >
                  <span className="text-lg font-semibold text-foreground/70">{icon}</span>
                  <span className="text-xs text-foreground/60 font-medium">{label}</span>
                </button>
                );
              })}
            </div>
            <button
              onClick={() => { haptic.light(); onResetTime(); setShowAdjustSheet(false); }}
              className="w-full mt-4 py-4 rounded-2xl bg-foreground/[0.04] text-red-500 font-semibold text-base active:bg-foreground/[0.08]"
            >
              Reset
            </button>
          </div>
        </>
      )}

      {/* Notify Again Bottom Sheet (overtime) */}
      {showNotifySheet && (
        <>
          <div
            className="absolute inset-0 bg-black/40 z-[10] animate-in fade-in-0 duration-200"
            onClick={() => setShowNotifySheet(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 z-[11] bg-background rounded-t-3xl px-6 pb-8 pt-2 animate-in slide-in-from-bottom duration-300"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)' }}
          >
            <div className="w-10 h-1 bg-foreground/10 rounded-full mx-auto mb-4" />
            <h3 className="text-center text-lg font-bold mb-6">Notify again</h3>
            <div className="grid grid-cols-3 gap-3">
              {[1, 5, 10].map((mins) => {
                const notifyTime = addSeconds(new Date(), mins * 60);
                return (
                  <button
                    key={mins}
                    onClick={() => {
                      haptic.medium();
                      // Set timer to exactly N minutes by computing the right delta
                      const targetSeconds = mins * 60;
                      const deltaMinutes = (targetSeconds - timeLeft) / 60;
                      onAdjustTime(deltaMinutes);
                      setShowNotifySheet(false);
                    }}
                    className="flex flex-col items-center gap-1 py-5 rounded-2xl bg-foreground/[0.06] active:bg-foreground/10"
                  >
                    <span className="text-xl font-bold text-foreground">{mins} min</span>
                    <span className="text-xs text-muted-foreground">({format(notifyTime, 'H:mm')})</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => {
                haptic.medium();
                setShowNotifySheet(false);
                onCompleteTask();
              }}
              className="w-full mt-4 py-4 rounded-2xl bg-foreground text-background font-semibold text-base active:opacity-90"
            >
              Move to next task
            </button>
          </div>
        </>
      )}

      {/* Skip Confirmation Bottom Sheet — inline */}
      {showSkipSheet && (
        <>
          <div
            className="absolute inset-0 bg-black/40 z-[10] animate-in fade-in-0 duration-200"
            onClick={() => setShowSkipSheet(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 z-[11] bg-background rounded-t-3xl px-6 pb-8 pt-2 animate-in slide-in-from-bottom duration-300"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)' }}
          >
            <div className="w-10 h-1 bg-foreground/10 rounded-full mx-auto mb-4" />
            <h3 className="text-center text-lg font-bold mb-6">Should we skip?</h3>
            <div className="space-y-2.5">
              <button
                onClick={() => {
                  haptic.light();
                  setShowSkipSheet(false);
                  setRearrangeTasks([...config.tasks.slice(currentTaskIndex + 1)]);
                  setShowRearrangeSheet(true);
                }}
                className="w-full py-4 rounded-2xl bg-foreground/[0.06] text-foreground font-semibold text-base active:bg-foreground/10"
              >
                Rearrange order
              </button>
              <button
                onClick={() => { haptic.light(); setShowSkipSheet(false); onMoveTaskToEnd(); }}
                className="w-full py-4 rounded-2xl bg-foreground/[0.06] text-foreground font-semibold text-base active:bg-foreground/10"
              >
                Move task to end
              </button>
              <button
                onClick={() => { haptic.medium(); setShowSkipSheet(false); onSkipTask(); }}
                className="w-full py-4 rounded-2xl bg-foreground/[0.06] text-foreground/60 font-semibold text-base active:bg-foreground/10"
              >
                Skip
              </button>
            </div>
          </div>
        </>
      )}

      {/* End Routine Confirmation Dialog */}
      {showEndDialog && (
        <div className="absolute inset-0 z-[10] flex items-center justify-center bg-black/50 animate-in fade-in-0 duration-200">
          <div className="bg-background rounded-2xl p-6 mx-8 max-w-sm w-full shadow-xl animate-in zoom-in-95 duration-200">
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
                onClick={() => { haptic.medium(); setShowEndDialog(false); onEndRoutineEarly(); }}
                className="flex-1 py-3 rounded-xl bg-foreground text-background font-medium text-sm active:opacity-90"
              >
                End
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Playlist Bottom Sheet */}
      {showPlaylistSheet && (
        <>
          <div
            className="absolute inset-0 bg-black/40 z-[10] animate-in fade-in-0 duration-200"
            onClick={() => setShowPlaylistSheet(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 z-[11] bg-background rounded-t-3xl px-6 pb-6 pt-2 animate-in slide-in-from-bottom duration-300 max-h-[70vh] flex flex-col"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
          >
            <div className="w-10 h-1 bg-foreground/10 rounded-full mx-auto mb-4" />
            <div className="text-center mb-4">
              <p className="text-lg font-bold text-foreground">
                {endTime ? format(endTime, 'h:mma').toLowerCase() : ''}
              </p>
              <p className="text-sm text-muted-foreground">Estimated end time</p>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {(() => {
                let accTime = new Date();
                // For remaining tasks (from current+1 onward), compute start times
                const remainingTasks = config.tasks.slice(currentTaskIndex + 1);
                // Current task remaining time
                accTime = new Date(Date.now() + Math.max(0, timeLeft) * 1000);
                return remainingTasks.map((task, i) => {
                  const taskTime = accTime;
                  accTime = addSeconds(accTime, task.targetSeconds);
                  return (
                    <div key={task.id} className="flex items-center gap-3 bg-foreground/[0.04] rounded-2xl px-4 py-3">
                      <span className="text-xs text-muted-foreground tabular-nums w-10">
                        {format(taskTime, 'H:mm')}
                      </span>
                      <FluentEmoji emoji={task.emoji} size={28} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{Math.round(task.targetSeconds / 60)}m</p>
                      </div>
                      <div className="w-9 h-9 rounded-full bg-foreground/[0.06] flex items-center justify-center">
                        <Play className="w-4 h-4 text-foreground/50 ml-0.5" />
                      </div>
                    </div>
                  );
                });
              })()}
              {config.tasks.slice(currentTaskIndex + 1).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No more tasks remaining</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  haptic.light();
                  setShowPlaylistSheet(false);
                  setRearrangeTasks([...config.tasks.slice(currentTaskIndex + 1)]);
                  setShowRearrangeSheet(true);
                }}
                className="flex-1 py-4 rounded-2xl bg-foreground/[0.06] text-foreground font-semibold text-base active:bg-foreground/10"
              >
                Rearrange
              </button>
              <button
                onClick={() => {
                  haptic.light();
                  setShowPlaylistSheet(false);
                  setShowAddTaskForm(true);
                  setNewTaskTitle('');
                  setNewTaskMinutes(1);
                }}
                className="flex-1 py-4 rounded-2xl bg-foreground text-background font-semibold text-base active:opacity-90"
              >
                Add
              </button>
            </div>
          </div>
        </>
      )}

      {/* Rearrange Bottom Sheet */}
      {showRearrangeSheet && (
        <>
          <div
            className="absolute inset-0 bg-black/40 z-[10] animate-in fade-in-0 duration-200"
            onClick={() => setShowRearrangeSheet(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 z-[11] bg-background rounded-t-3xl px-6 pb-6 pt-2 animate-in slide-in-from-bottom duration-300 max-h-[75vh] flex flex-col"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
          >
            <div className="w-10 h-1 bg-foreground/10 rounded-full mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-4">Rearrange</h3>
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {/* Current task (greyed out) */}
              {currentTask && (
                <div className="flex items-center gap-3 bg-foreground/[0.04] rounded-2xl px-4 py-3.5 opacity-40">
                  <FluentEmoji emoji={currentTask.emoji} size={28} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground/50 truncate">{currentTask.title}</p>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">{Math.round(currentTask.targetSeconds / 60)}m</span>
                </div>
              )}
              {/* Remaining tasks (draggable via simple move buttons) */}
              {rearrangeTasks.map((task, i) => (
                <div key={task.id} className="flex items-center gap-3 bg-foreground/[0.04] rounded-2xl px-4 py-3.5">
                  <FluentEmoji emoji={task.emoji} size={28} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{task.title}</p>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">{Math.round(task.targetSeconds / 60)}m</span>
                  <div className="flex flex-col gap-0.5">
                    <button
                      className="p-0.5 active:opacity-50 disabled:opacity-15"
                      disabled={i === 0}
                      onClick={() => {
                        haptic.light();
                        const newArr = [...rearrangeTasks];
                        [newArr[i - 1], newArr[i]] = [newArr[i], newArr[i - 1]];
                        setRearrangeTasks(newArr);
                      }}
                    >
                      <ArrowUp className="w-4 h-4 text-foreground/50" />
                    </button>
                    <button
                      className="p-0.5 active:opacity-50 disabled:opacity-15"
                      disabled={i === rearrangeTasks.length - 1}
                      onClick={() => {
                        haptic.light();
                        const newArr = [...rearrangeTasks];
                        [newArr[i], newArr[i + 1]] = [newArr[i + 1], newArr[i]];
                        setRearrangeTasks(newArr);
                      }}
                    >
                      <ArrowDown className="w-4 h-4 text-foreground/50" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                haptic.medium();
                // Apply rearranged tasks: keep tasks up to currentTaskIndex, then new order
                const kept = config.tasks.slice(0, currentTaskIndex + 1);
                onReorderTasks([...kept, ...rearrangeTasks]);
                setShowRearrangeSheet(false);
              }}
              className="w-full py-4 rounded-2xl bg-foreground text-background font-semibold text-base active:opacity-90"
            >
              Done
            </button>
          </div>
        </>
      )}

      {/* Quick Add Task Sheet */}
      {showAddTaskForm && (
        <>
          <div
            className="absolute inset-0 bg-black/40 z-[10] animate-in fade-in-0 duration-200"
            onClick={() => setShowAddTaskForm(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 z-[11] bg-background rounded-t-3xl px-6 pb-6 pt-2 animate-in slide-in-from-bottom duration-300"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
          >
            <div className="w-10 h-1 bg-foreground/10 rounded-full mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-4">Add task</h3>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task name"
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-foreground/[0.06] text-foreground placeholder:text-muted-foreground text-base outline-none focus:ring-2 focus:ring-primary/30 mb-3"
            />
            <div className="flex items-center gap-3 mb-5">
              <span className="text-sm text-muted-foreground">Duration</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNewTaskMinutes(m => Math.max(1, m - 1))}
                  className="w-9 h-9 rounded-xl bg-foreground/[0.06] flex items-center justify-center active:bg-foreground/10"
                >
                  <Minus className="w-4 h-4 text-foreground" />
                </button>
                <span className="text-base font-semibold text-foreground w-10 text-center tabular-nums">{newTaskMinutes}m</span>
                <button
                  onClick={() => setNewTaskMinutes(m => m + 1)}
                  className="w-9 h-9 rounded-xl bg-foreground/[0.06] flex items-center justify-center active:bg-foreground/10"
                >
                  <Plus className="w-4 h-4 text-foreground" />
                </button>
              </div>
            </div>
            <button
              disabled={!newTaskTitle.trim()}
              onClick={() => {
                haptic.medium();
                const newTask: FocusTask = {
                  id: `quick-${Date.now()}`,
                  title: newTaskTitle.trim(),
                  emoji: '⚡',
                  targetSeconds: newTaskMinutes * 60,
                };
                const updatedTasks = [...config.tasks, newTask];
                onReorderTasks(updatedTasks);
                setShowAddTaskForm(false);
                setNewTaskTitle('');
                setNewTaskMinutes(1);
              }}
              className="w-full py-4 rounded-2xl bg-foreground text-background font-semibold text-base active:opacity-90 disabled:opacity-40"
            >
              Add to routine
            </button>
          </div>
        </>
      )}
    </div>
  );
});
