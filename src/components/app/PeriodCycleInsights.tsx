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
    <div className="relative z-10 px-6 py-2">
      <div className="flex flex-col items-center text-center">
        {/* Phase emoji/icon */}
        <div className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center mb-2 shadow-sm',
          status?.phase.bgColor || 'bg-pink-100'
        )}>
          {status?.phase.emoji ? (
            <span className="text-2xl">{status.phase.emoji}</span>
          ) : (
            <Heart className="h-6 w-6 text-pink-500" />
          )}
        </div>

        {/* Main status text */}
        <h2 className="text-lg font-bold text-pink-800">
          {statusText}
        </h2>

        {/* Subtitle */}
        <p className="text-pink-600 text-xs mb-1">
          {subtitleText}
        </p>

        {/* Phase badge */}
        {status && (
          <div className={cn(
            'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium',
            status.phase.bgColor,
            `text-${status.phase.color}-700`
          )}>
            <span>{status.phase.emoji}</span>
            <span>{status.phase.name} Phase</span>
          </div>
        )}

        {/* Phase description */}
        {status?.phase.description && (
          <p className="text-[10px] text-pink-500 mt-1 max-w-xs">
            {status.phase.description}
          </p>
        )}
      </div>
    </div>
  );
};
