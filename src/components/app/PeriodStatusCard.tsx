import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { useCycleStatusWithLoading } from '@/hooks/usePeriodTracker';
import { getStatusText, getSubtitleText } from '@/lib/periodTracking';

interface PeriodStatusCardProps {
  className?: string;
}

export const PeriodStatusCard = ({ className }: PeriodStatusCardProps) => {
  const navigate = useNavigate();
  const { status, settings, isLoading, hasCompletedOnboarding } = useCycleStatusWithLoading();

  // Don't show if settings say to hide
  if (settings && !settings.show_on_home) {
    return null;
  }

  // Don't show if still loading
  if (isLoading) {
    return null;
  }

  const handleClick = () => {
    haptic.light();
    navigate('/app/period');
  };

  const statusText = getStatusText(status);
  const subtitleText = hasCompletedOnboarding ? getSubtitleText(status) : 'Tap to set up';

  return (
    <div
      onClick={handleClick}
      className={cn(
        'rounded-2xl p-4 transition-all duration-200 cursor-pointer active:scale-[0.98]',
        'bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Icon circle */}
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm bg-pink-500 text-white">
          <Heart className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top line with badge */}
          <div className="flex items-center gap-2 text-xs mb-0.5">
            <span className="font-semibold text-pink-700 dark:text-pink-300">
              {status?.phase.emoji || '🌸'} {status?.phase.name || 'Period'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white font-medium text-[10px]">
              Cycle
            </span>
          </div>

          {/* Main text */}
          <p className="font-semibold text-foreground truncate">
            {statusText}
          </p>

          {/* Subtitle */}
          <p className="text-xs text-foreground/50 truncate">
            {subtitleText}
          </p>
        </div>
      </div>
    </div>
  );
};
