import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakProgressBarProps {
  current: number;
  goal: number;
  className?: string;
}

/**
 * Custom striped progress bar for streak challenges
 * Features diagonal orange stripes and a flame indicator
 */
export const StreakProgressBar = ({ current, goal, className }: StreakProgressBarProps) => {
  const progress = Math.min((current / goal) * 100, 100);
  
  return (
    <div className={cn('relative flex items-center gap-2', className)}>
      {/* Progress track */}
      <div className="relative flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
        {/* Striped fill */}
        <div 
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{ 
            width: `${progress}%`,
            background: 'repeating-linear-gradient(45deg, #fb923c, #fb923c 6px, #fdba74 6px, #fdba74 12px)',
          }}
        />
        
        {/* Flame indicator at current position */}
        {progress > 0 && (
          <div 
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-500"
            style={{ left: `${progress}%` }}
          >
            <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center shadow-md">
              <Flame className="w-3 h-3 text-white" fill="currentColor" />
            </div>
          </div>
        )}
      </div>
      
      {/* Goal badge */}
      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
        <span className="text-xs font-semibold text-gray-600">{goal}</span>
      </div>
    </div>
  );
};
