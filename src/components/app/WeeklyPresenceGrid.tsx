import { format, addDays, startOfWeek, isSameDay, isBefore, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useWeeklyTaskCompletion, BadgeLevel } from '@/hooks/useWeeklyTaskCompletion';

import badgeBronze from '@/assets/badge-bronze.png';
import badgeSilver from '@/assets/badge-silver.png';
import badgeGold from '@/assets/badge-gold.png';

interface WeeklyPresenceGridProps {
  lastActiveDate?: Date | null;
  showedUpToday?: boolean;
  variant?: 'light' | 'dark';
}

const BADGE_IMAGES: Record<Exclude<BadgeLevel, 'none'>, string> = {
  bronze: badgeBronze,
  silver: badgeSilver,
  gold: badgeGold,
};

export function WeeklyPresenceGrid({ 
  lastActiveDate, 
  showedUpToday = false,
  variant = 'light' 
}: WeeklyPresenceGridProps) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const { data: weeklyCompletion } = useWeeklyTaskCompletion();
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    const dateStr = format(day, 'yyyy-MM-dd');
    const isToday = isSameDay(day, today);
    const isPast = isBefore(startOfDay(day), startOfDay(today));
    
    // Get badge level for this day
    const dayStats = weeklyCompletion?.[dateStr];
    const badgeLevel = dayStats?.badgeLevel || 'none';
    
    // Day is active if it has a badge (completed at least 1 task)
    const isActive = badgeLevel !== 'none';
    
    return {
      date: day,
      dateStr,
      label: format(day, 'EEEEE'),
      fullLabel: format(day, 'EEE'),
      isActive,
      isToday,
      isPast,
      badgeLevel,
    };
  });

  const isDark = variant === 'dark';

  return (
    <div className="flex justify-center gap-2">
      {weekDays.map((day, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          {/* Day label */}
          <span className={cn(
            'text-[10px] font-medium',
            isDark ? 'text-white/50' : 'text-muted-foreground'
          )}>
            {day.fullLabel}
          </span>
          
          {/* Badge or Circle */}
          <div 
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium transition-all',
              day.isToday && isDark && 'ring-2 ring-violet-300',
              day.isToday && !isDark && 'ring-2 ring-primary/30',
              !day.isActive && (
                isDark
                  ? 'bg-white/10 text-white/40'
                  : 'bg-muted text-muted-foreground'
              )
            )}
          >
            {day.isActive && day.badgeLevel !== 'none' ? (
              <img 
                src={BADGE_IMAGES[day.badgeLevel]} 
                alt={`${day.badgeLevel} badge`}
                className="w-9 h-9 object-contain"
              />
            ) : (
              format(day.date, 'd')
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
