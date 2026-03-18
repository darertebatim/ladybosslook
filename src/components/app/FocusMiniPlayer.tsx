import { Pause, Play, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { useFocusPlayer } from '@/components/app/FocusPlayerProvider';
import { haptic } from '@/lib/haptics';
import { TASK_COLORS, type TaskColor } from '@/hooks/useTaskPlanner';

function formatMiniTime(seconds: number): string {
  const abs = Math.abs(seconds);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function FocusMiniPlayer() {
  const {
    isActive,
    isMinimized,
    maximize,
    currentTask,
    timeLeft,
    isOvertime,
    phase,
    togglePause,
    completeTask,
  } = useFocusPlayer();

  if (!isActive || !isMinimized || !currentTask || phase === 'summary') return null;

  const isPaused = phase === 'paused';

  // Resolve color from task palette — always use the task's own color, even in overtime
  const taskBg = currentTask.color
    ? (TASK_COLORS[currentTask.color as TaskColor] || currentTask.color)
    : TASK_COLORS.yellow;

  return (
    <div
      className={cn(
        "fixed bottom-[calc(64px+env(safe-area-inset-bottom))] left-2 right-2 z-40",
        "rounded-2xl overflow-hidden cursor-pointer",
        "animate-in slide-in-from-bottom-4 duration-300",
        "shadow-lg"
      )}
      style={{ backgroundColor: taskBg }}
      onClick={maximize}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Task emoji */}
        <div className="flex-shrink-0">
          <FluentEmoji emoji={currentTask.emoji} size={36} />
        </div>

        {/* Timer + task name */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-bold text-lg tabular-nums leading-tight text-black",
            isOvertime && "text-red-600"
          )}>
            {isOvertime && '+'}{formatMiniTime(timeLeft)}
          </p>
          <p className="text-xs text-black/60 truncate">{currentTask.title}</p>
        </div>

        {/* Pause / Play */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            haptic.light();
            togglePause();
          }}
          className={cn(
            "flex-shrink-0 h-10 w-10 rounded-full",
            "flex items-center justify-center",
            "bg-black/10 active:bg-black/20"
          )}
        >
          {isPaused ? (
            <Play className="h-4.5 w-4.5 ml-0.5 text-black" />
          ) : (
            <Pause className="h-4.5 w-4.5 text-black" />
          )}
        </button>

        {/* Complete — only show when running (not paused) */}
        {!isPaused && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              haptic.success();
              completeTask();
            }}
            className={cn(
              "flex-shrink-0 h-10 w-10 rounded-full",
              "flex items-center justify-center",
              "bg-black text-white active:opacity-90"
            )}
          >
            <Check className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
