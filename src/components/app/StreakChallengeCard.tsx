import { Flame, ArrowUp, Shield } from 'lucide-react';
import { StreakProgressBar } from './StreakProgressBar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';

interface StreakChallengeCardProps {
  currentStreak: number;
  streakGoal: number;
  className?: string;
  onLevelUp?: () => void;
  // Recovery
  canRecover?: boolean;
  previousStreak?: number;
  onRecover?: () => void;
}

/**
 * Streak Challenge card for the Presence page
 * Shows progress toward the user's streak goal with a striped progress bar
 */
export const StreakChallengeCard = ({ 
  currentStreak, 
  streakGoal, 
  className,
  onLevelUp,
  canRecover,
  previousStreak,
  onRecover,
}: StreakChallengeCardProps) => {
  const isCompleted = currentStreak >= streakGoal;
  const isStreakBroken = currentStreak === 0 && !!previousStreak && previousStreak > 0;
  
  return (
    <div className={cn('bg-white rounded-2xl p-4 shadow-sm', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Streak Challenge</h3>
        </div>
        {isCompleted && onLevelUp && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-full gap-1"
            onClick={() => {
              haptic.light();
              onLevelUp();
            }}
          >
            <ArrowUp className="w-3 h-3" />
            Level Up
          </Button>
        )}
      </div>
      
      {/* Current day display */}
      <div className="mb-4">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold text-orange-500">
            {isCompleted ? '🎉' : isStreakBroken ? '💔' : `Day ${currentStreak}`}
          </span>
        </div>
        <p className="text-sm text-gray-500">
          {isCompleted 
            ? `You completed the ${streakGoal}-day challenge!`
            : isStreakBroken
            ? `${previousStreak}-day streak was broken`
            : `of the ${streakGoal}-day challenge`
          }
        </p>
      </div>
      
      {/* Progress bar */}
      <StreakProgressBar 
        current={currentStreak} 
        goal={streakGoal} 
      />

      {/* Recovery button — shown when streak broken and recovery available */}
      {isStreakBroken && canRecover && onRecover && (
        <Button
          onClick={() => {
            haptic.light();
            onRecover();
          }}
          variant="outline"
          size="sm"
          className="mt-4 w-full border-orange-200 text-orange-600 hover:bg-orange-50 rounded-xl text-xs font-semibold gap-1.5"
        >
          <Shield className="w-3.5 h-3.5" />
          Use Recovery Shield
        </Button>
      )}
    </div>
  );
};
