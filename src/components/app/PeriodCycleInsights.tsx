import { Heart } from 'lucide-react';
import { CycleStatus, getStatusText, getSubtitleText } from '@/lib/periodTracking';
import { cn } from '@/lib/utils';

interface PeriodCycleInsightsProps {
  status: CycleStatus | null;
}

export const PeriodCycleInsights = ({ status }: PeriodCycleInsightsProps) => {
  const statusText = getStatusText(status);
  const subtitleText = getSubtitleText(status);

  return (
    <div className="relative z-10 px-6 py-4">
      <div className="flex flex-col items-center text-center">
        {/* Phase emoji/icon */}
        <div className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-sm',
          status?.phase.bgColor || 'bg-pink-100'
        )}>
          {status?.phase.emoji ? (
            <span className="text-3xl">{status.phase.emoji}</span>
          ) : (
            <Heart className="h-8 w-8 text-pink-500" />
          )}
        </div>

        {/* Main status text */}
        <h2 className="text-xl font-bold text-pink-800 mb-1">
          {statusText}
        </h2>

        {/* Subtitle */}
        <p className="text-pink-600 text-sm mb-2">
          {subtitleText}
        </p>

        {/* Phase badge */}
        {status && (
          <div className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
            status.phase.bgColor,
            `text-${status.phase.color}-700`
          )}>
            <span>{status.phase.emoji}</span>
            <span>{status.phase.name} Phase</span>
          </div>
        )}

        {/* Phase description */}
        {status?.phase.description && (
          <p className="text-xs text-pink-500 mt-2 max-w-xs">
            {status.phase.description}
          </p>
        )}
      </div>
    </div>
  );
};
