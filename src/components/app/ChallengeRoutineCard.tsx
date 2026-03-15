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
      
      {/* Challenge info + badge preview */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
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

        {/* Badge preview on right side */}
        {challenge.badgeImageUrl && (
          <div className="flex flex-col items-center ml-3 shrink-0">
            <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-amber-200 bg-amber-50 shadow-sm">
              <img 
                src={challenge.badgeImageUrl} 
                alt="Challenge badge" 
                className={cn(
                  "w-full h-full object-cover",
                  !isCompleted && "opacity-40 grayscale"
                )}
              />
            </div>
            <span className="text-[10px] text-amber-600 font-medium mt-0.5">Badge</span>
          </div>
        )}
      </div>
      
      {/* Progress bar */}
      <StreakProgressBar 
        current={challenge.hasStarted ? challenge.completedDays : 0} 
        goal={challenge.totalDays} 
      />
    </div>
  );
};
