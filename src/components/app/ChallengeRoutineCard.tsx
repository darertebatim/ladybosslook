import { Trophy, Calendar } from 'lucide-react';
import { StreakProgressBar } from './StreakProgressBar';
import { cn } from '@/lib/utils';
import type { UserChallenge } from '@/hooks/useUserChallenges';

interface ChallengeRoutineCardProps {
  challenge: UserChallenge;
  className?: string;
}

function formatStartDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export const ChallengeRoutineCard = ({ 
  challenge, 
  className,
}: ChallengeRoutineCardProps) => {
  const isCompleted = challenge.completedDays >= challenge.totalDays;
  
  return (
    <div className={cn('bg-white rounded-2xl p-4 shadow-sm', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">Challenge Routine</h3>
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
          {!challenge.hasStarted && challenge.computedStartDate ? (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 inline" />
              Starts {formatStartDate(challenge.computedStartDate)}
            </span>
          ) : isCompleted 
            ? `🎉 Challenge complete! All ${challenge.totalDays} days done!`
            : `Day ${challenge.completedDays} of ${challenge.totalDays}`
          }
        </p>
      </div>
      
      {/* Progress bar */}
      <StreakProgressBar 
        current={challenge.hasStarted ? challenge.completedDays : 0} 
        goal={challenge.totalDays} 
      />
    </div>
  );
};
