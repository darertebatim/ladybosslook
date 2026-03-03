import { Trophy } from 'lucide-react';
import { StreakProgressBar } from './StreakProgressBar';
import { cn } from '@/lib/utils';
import type { UserChallenge } from '@/hooks/useUserChallenges';

interface ChallengRitualCardProps {
  challenge: UserChallenge;
  className?: string;
}

/**
 * Challenge Ritual card for the Presence page.
 * Shows the user's progress on an adopted challenge-type routine.
 */
export const ChallengeRitualCard = ({ 
  challenge, 
  className,
}: ChallengRitualCardProps) => {
  const isCompleted = challenge.completedDays >= challenge.totalDays;
  
  return (
    <div className={cn('bg-white rounded-2xl p-4 shadow-sm', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">Challenge Ritual</h3>
      </div>
      
      {/* Challenge info */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-lg">{challenge.emoji}</span>
          <span className="text-xl font-bold text-amber-700">
            {challenge.title}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {isCompleted 
            ? `🎉 Challenge complete! All ${challenge.totalDays} days done!`
            : `Day ${challenge.completedDays} of ${challenge.totalDays}`
          }
        </p>
      </div>
      
      {/* Progress bar */}
      <StreakProgressBar 
        current={challenge.completedDays} 
        goal={challenge.totalDays} 
      />
    </div>
  );
};
