import { memo } from 'react';
import { Pause, Play, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

function formatTime(seconds: number): string {
  const abs = Math.abs(seconds);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

interface FocusMiniPlayerProps {
  currentTask: { id: string; title: string; emoji: string; targetSeconds: number } | null;
  timeLeft: number;
  isOvertime: boolean;
  overtimeSeconds: number;
  isPaused: boolean;
  onMaximize: () => void;
  onTogglePause: () => void;
  onCompleteTask: () => void;
}

export const FocusMiniPlayer = memo(function FocusMiniPlayer({
  currentTask,
  timeLeft,
  isOvertime,
  overtimeSeconds,
  isPaused,
  onMaximize,
  onTogglePause,
  onCompleteTask,
}: FocusMiniPlayerProps) {
  if (!currentTask) return null;

  return (
    <div
      className={cn(
        "fixed bottom-[calc(64px+env(safe-area-inset-bottom))] left-2 right-2 z-40",
        "rounded-xl overflow-hidden cursor-pointer",
        "animate-in slide-in-from-bottom-4 duration-300",
        "bg-amber-50 dark:bg-amber-950/80 backdrop-blur-lg",
        "border border-amber-200/50 dark:border-amber-800/50",
        "shadow-lg"
      )}
      onClick={onMaximize}
    >
      <div className="flex items-center gap-2.5 p-2">
        {/* Task emoji */}
        <div className="h-11 w-11 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-100/80 dark:bg-amber-900/40">
          <FluentEmoji emoji={currentTask.emoji} size={28} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-bold text-base tabular-nums",
            isOvertime ? "text-red-500" : "text-foreground"
          )}>
            {isOvertime ? `+${formatTime(overtimeSeconds)}` : formatTime(timeLeft)}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {currentTask.title}
          </p>
        </div>

        {/* Pause/Resume */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            haptic.medium();
            onTogglePause();
          }}
          className={cn(
            "flex-shrink-0 h-9 w-9 rounded-full",
            "flex items-center justify-center",
            "border-2 border-foreground/30",
            "active:scale-95 transition-transform"
          )}
        >
          {isPaused ? (
            <Play className="h-4 w-4 ml-0.5" />
          ) : (
            <Pause className="h-4 w-4" />
          )}
        </button>

        {/* Complete */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            haptic.success();
            onCompleteTask();
          }}
          className={cn(
            "flex-shrink-0 h-9 w-9 rounded-full",
            "flex items-center justify-center",
            "bg-amber-400 text-black",
            "active:scale-95 transition-transform"
          )}
        >
          <Check className="h-4 w-4" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
});
