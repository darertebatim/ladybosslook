import { Pause, Play, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { useFocusPlayer } from '@/components/app/FocusPlayerProvider';
import { haptic } from '@/lib/haptics';

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

  return (
    <div
      className={cn(
        "fixed bottom-[calc(64px+env(safe-area-inset-bottom))] left-2 right-2 z-40",
        "rounded-2xl overflow-hidden cursor-pointer",
        "animate-in slide-in-from-bottom-4 duration-300",
        isOvertime
          ? "bg-amber-50 border border-amber-200/50"
          : "bg-primary/10 border border-primary/20",
        "shadow-lg"
      )}
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
            "font-bold text-lg tabular-nums leading-tight",
            isOvertime ? "text-amber-600" : "text-foreground"
          )}>
            {isOvertime && '+'}{formatMiniTime(timeLeft)}
          </p>
          <p className="text-xs text-muted-foreground truncate">{currentTask.title}</p>
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
            "bg-foreground/10 active:bg-foreground/20"
          )}
        >
          {isPaused ? (
            <Play className="h-4.5 w-4.5 ml-0.5 text-foreground" />
          ) : (
            <Pause className="h-4.5 w-4.5 text-foreground" />
          )}
        </button>

        {/* Complete */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            haptic.success();
            completeTask();
          }}
          className={cn(
            "flex-shrink-0 h-10 w-10 rounded-full",
            "flex items-center justify-center",
            "bg-primary text-primary-foreground active:opacity-90"
          )}
        >
          <Check className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
