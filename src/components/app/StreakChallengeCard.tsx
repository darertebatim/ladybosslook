import { Flame } from 'lucide-react';
import { StreakProgressBar } from './StreakProgressBar';
import { cn } from '@/lib/utils';

interface StreakChallengeCardProps {
  currentStreak: number;
  streakGoal: number;
  className?: string;
}

/**
 * Streak Challenge card for the Presence page
 * Shows progress toward the user's streak goal with a striped progress bar
 */
export const StreakChallengeCard = ({ 
  currentStreak, 
  streakGoal, 
  className 
}: StreakChallengeCardProps) => {
  const isCompleted = currentStreak >= streakGoal;
  
  return (
    <div className={cn('bg-white rounded-2xl p-4 shadow-sm', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
          <Flame className="w-3.5 h-3.5 text-orange-500" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">Streak Challenge</h3>
      </div>
      
      {/* Current day display */}
      <div className="mb-4">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold text-orange-500">
            {isCompleted ? '🎉' : `Day ${currentStreak}`}
          </span>
        </div>
        <p className="text-sm text-gray-500">
          {isCompleted 
            ? `You completed the ${streakGoal}-day challenge!`
            : `of the ${streakGoal}-day challenge`
          }
        </p>
      </div>
      
      {/* Progress bar */}
      <StreakProgressBar 
        current={currentStreak} 
        goal={streakGoal} 
      />
    </div>
  );
};
