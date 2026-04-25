import { memo } from 'react';
import { format } from 'date-fns';
import { X, Share2 } from 'lucide-react';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';
import { useShareContent } from '@/hooks/useShareContent';

export interface SessionTaskResult {
  title: string;
  emoji: string;
  targetSeconds: number;
  actualSeconds: number;
  status: 'completed' | 'skipped';
}

interface RoutinePlayerSummaryProps {
  routineTitle: string;
  routineEmoji: string;
  startedAt: Date;
  endedAt: Date;
  taskResults: SessionTaskResult[];
  totalSessions: number;
  streak: number;
  onClose: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function formatDelta(target: number, actual: number): { text: string; color: string } {
  const diff = actual - target;
  if (diff === 0) return { text: '±0', color: 'text-muted-foreground' };
  if (diff > 0) return { text: `+${formatDuration(diff)}`, color: 'text-red-500' };
  return { text: `-${formatDuration(Math.abs(diff))}`, color: 'text-blue-500' };
}

export const RoutinePlayerSummary = memo(function RoutinePlayerSummary({
  routineTitle,
  routineEmoji,
  startedAt,
  endedAt,
  taskResults,
  totalSessions,
  streak,
  onClose,
}: RoutinePlayerSummaryProps) {
  const totalTargetSeconds = taskResults.reduce((s, t) => s + t.targetSeconds, 0);
  const totalActualSeconds = taskResults.reduce((s, t) => s + t.actualSeconds, 0);
  const totalDelta = formatDelta(totalTargetSeconds, totalActualSeconds);
  const completedCount = taskResults.filter(t => t.status === 'completed').length;

  const { handleShare } = useShareContent({
    title: routineTitle,
    text: `Just completed my "${routineTitle}" focus routine! ${completedCount}/${taskResults.length} tasks done in ${formatDuration(totalActualSeconds)} 🎯`,
    source: 'routine_summary',
  });

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 pt-3 pb-2"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
      >
        <button onClick={onClose} className="p-2 active:opacity-70">
          <X className="w-5 h-5 text-foreground" />
        </button>
        <button
          onClick={() => { haptic.light(); handleShare(); }}
          className="p-2 active:opacity-70"
        >
          <Share2 className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 pb-8" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 100px)' }}>
        {/* Title + time range */}
        <div className="text-center mt-4">
          <FluentEmoji emoji={routineEmoji} size={48} />
          <h2 className="text-xl font-bold text-foreground mt-2">{routineTitle}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {format(startedAt, 'h:mm a')} – {format(endedAt, 'h:mm a')}
          </p>
        </div>

        {/* Stats cards */}
        <div className="flex gap-3 mt-6">
          <div className="flex-1 bg-muted rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{streak}</p>
            <p className="text-xs text-muted-foreground mt-1">Streak 🔥</p>
          </div>
          <div className="flex-1 bg-muted rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{totalSessions}</p>
            <p className="text-xs text-muted-foreground mt-1">Total</p>
          </div>
        </div>

        {/* Task breakdown */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Breakdown
          </h3>
          <div className="space-y-0 bg-muted rounded-2xl overflow-hidden divide-y divide-border/50">
            {taskResults.map((task, i) => {
              const delta = formatDelta(task.targetSeconds, task.actualSeconds);
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <FluentEmoji emoji={task.emoji} size={24} className="shrink-0" />
                  <p className="flex-1 text-sm text-foreground truncate">{task.title}</p>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-foreground">
                      {formatDuration(task.actualSeconds)}
                    </p>
                    {task.status === 'skipped' ? (
                      <p className="text-[11px] text-muted-foreground">skipped</p>
                    ) : (
                      <p className={`text-[11px] ${delta.color}`}>{delta.text}</p>
                    )}
                  </div>
                </div>
              );
            })}
            {/* Total row */}
            <div className="flex items-center gap-3 px-4 py-3 bg-background/50">
              <span className="text-lg shrink-0">⏱</span>
              <p className="flex-1 text-sm font-semibold text-foreground">Total</p>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-foreground">
                  {formatDuration(totalActualSeconds)}
                </p>
                <p className={`text-[11px] ${totalDelta.color}`}>{totalDelta.text}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Done button */}
      <div
        className="px-5 pb-4 pt-2 bg-background border-t border-border"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
      >
        <Button
          onClick={() => { haptic.light(); onClose(); }}
          className="w-full h-12 rounded-xl text-base font-semibold"
        >
          Done
        </Button>
      </div>
    </div>
  );
});
