import { Pause, Play, Check, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { useRoutinePlayerContext } from '@/components/app/RoutinePlayerProvider';
import { haptic } from '@/lib/haptics';
import { TASK_COLORS, type TaskColor } from '@/hooks/useTaskPlanner';
import { PRO_LINK_CONFIGS, type ProLinkType } from '@/lib/proTaskTypes';

// Secondary (darker) palette matching task colors
const TASK_COLORS_DARK: Record<string, string> = {
  pink: '#FFC2EA',
  peach: '#FFD2A1',
  yellow: '#FFEA4E',
  lime: '#C3F1E1',
  sky: '#B9D6FF',
  mint: '#C9F588',
  lavender: '#DEC1FF',
  purple: '#DEC1FF',
  blue: '#B9D6FF',
  red: '#FFC2EA',
  orange: '#FFD2A1',
  green: '#C3F1E1',
};

function formatMiniTime(seconds: number): string {
  const abs = Math.abs(seconds);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function RoutineMiniPlayer() {
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
    openProTask,
  } = useRoutinePlayerContext();

  if (!isActive || !isMinimized || !currentTask || phase === 'summary' || phase === 'completing') return null;

  const isPaused = phase === 'paused';
  const colorKey = (currentTask.color || 'yellow') as TaskColor;
  const proLinkType = (currentTask as any)?.proLinkType as ProLinkType | null;
  const proConfig = proLinkType ? PRO_LINK_CONFIGS[proLinkType] : null;

  // Resolve colors from task palette
  const taskBg = TASK_COLORS[colorKey] || TASK_COLORS.yellow;
  const buttonBg = TASK_COLORS_DARK[colorKey] || TASK_COLORS_DARK.yellow;

  return (
    <div
      className={cn(
        "fixed bottom-[calc(88px+env(safe-area-inset-bottom))] left-2 right-2 z-40",
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
          {(() => {
            const isCountUp = (currentTask as any)?.hasTimerGoal === false;
            const displayTime = isCountUp ? Math.abs(timeLeft) : timeLeft;
            return (
              <p className={cn(
                "font-bold text-lg tabular-nums leading-tight text-black",
                !isCountUp && isOvertime && "text-red-600"
              )}>
                {!isCountUp && isOvertime && '+'}{formatMiniTime(displayTime)}
                {isPaused && (
                  <span className="ml-1.5 text-[10px] font-semibold rounded px-1.5 py-0.5 align-middle" style={{ backgroundColor: buttonBg, color: 'black' }}>
                    Paused
                  </span>
                )}
              </p>
            );
          })()}
          <p className="text-xs text-black/60 truncate">{currentTask.title}</p>
        </div>

        {/* Pause / Play */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            haptic.light();
            togglePause();
          }}
          className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center active:opacity-80"
          style={{ backgroundColor: buttonBg }}
        >
          {isPaused ? (
            <Play className="h-4.5 w-4.5 ml-0.5 text-black" />
          ) : (
            <Pause className="h-4.5 w-4.5 text-black" />
          )}
        </button>

        {/* Pro task open button */}
        {!isPaused && proConfig && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              haptic.medium();
              openProTask();
            }}
            className="flex-shrink-0 h-10 px-3 rounded-full flex items-center justify-center gap-1.5 active:opacity-80"
            style={{ backgroundColor: buttonBg }}
          >
            <ExternalLink className="h-3.5 w-3.5 text-black" />
            <span className="text-xs font-semibold text-black">Open</span>
          </button>
        )}

        {/* Complete — only show when running */}
        {!isPaused && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              haptic.success();
              completeTask();
            }}
            className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center active:opacity-80"
            style={{ backgroundColor: buttonBg }}
          >
            <Check className="h-5 w-5 text-black" />
          </button>
        )}
      </div>
    </div>
  );
}
