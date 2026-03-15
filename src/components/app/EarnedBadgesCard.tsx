import { Award } from 'lucide-react';
import { useEarnedChallengeBadges } from '@/hooks/useEarnedChallengeBadges';
import { cn } from '@/lib/utils';

export const EarnedBadgesCard = () => {
  const { data: badges, isLoading } = useEarnedChallengeBadges();

  if (isLoading || !badges?.length) return null;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
          <Award className="w-3.5 h-3.5 text-amber-600" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">
          Challenge Badges
        </h3>
        <span className="ml-auto text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
          {badges.length}
        </span>
      </div>

      {/* Badges grid */}
      <div className="flex flex-wrap gap-3">
        {badges.map((badge) => (
          <div key={badge.id} className="flex flex-col items-center gap-1">
            <div className={cn(
              "w-20 h-20 rounded-xl overflow-hidden",
              "border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50",
              "shadow-md shadow-amber-100/50",
              "ring-2 ring-amber-200/50 ring-offset-1"
            )}>
              <img
                src={badge.badgeImageUrl}
                alt={`${badge.routineTitle} badge`}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[11px] text-gray-600 font-medium text-center leading-tight max-w-[80px] truncate">
              {badge.routineEmoji} {badge.routineTitle}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
