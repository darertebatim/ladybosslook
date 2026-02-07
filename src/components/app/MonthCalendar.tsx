import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';
import type { BadgeLevel } from '@/hooks/useWeeklyTaskCompletion';

import badgeBronze from '@/assets/badge-bronze.png';
import badgeSilver from '@/assets/badge-silver.png';
import badgeGold from '@/assets/badge-gold.png';

const BADGE_IMAGES: Record<Exclude<BadgeLevel, 'none'>, string> = {
  bronze: badgeBronze,
  silver: badgeSilver,
  gold: badgeGold,
};

interface DayStats {
  badgeLevel: BadgeLevel;
  completedTasks: number;
  totalTasks: number;
}

interface MonthCalendarProps {
  selectedDate: Date;
  currentMonth: Date;
  onDateSelect: (date: Date) => void;
  completedDates?: Set<string>;
  programEventDates?: Set<string>;
  /** Badge data keyed by date string (yyyy-MM-dd) */
  badgeData?: Record<string, DayStats>;
}

export const MonthCalendar = ({ 
  selectedDate, 
  currentMonth, 
  onDateSelect, 
  completedDates, 
  programEventDates,
  badgeData,
}: MonthCalendarProps) => {
  // Generate all days for the month grid
  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const allDays: Date[] = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      allDays.push(day);
      day = addDays(day, 1);
    }

    // Chunk into weeks of 7
    const weekRows: Date[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weekRows.push(allDays.slice(i, i + 7));
    }
    return weekRows;
  }, [currentMonth]);

  return (
    <div className="animate-in slide-in-from-top-2 duration-200">
      {/* Week rows - same styling as collapsed week strip */}
      {weeks.map((week, weekIdx) => (
        <div key={weekIdx} className="flex mt-2">
          {week.map((dateItem) => {
            const isCurrentMonth = isSameMonth(dateItem, currentMonth);
            const isSelected = isSameDay(dateItem, selectedDate);
            const isTodayDate = isToday(dateItem);
            const dateStr = format(dateItem, 'yyyy-MM-dd');
            const hasProgramEvents = programEventDates?.has(dateStr);
            
            // Get badge level for this day
            const dayStats = badgeData?.[dateStr];
            const badgeLevel = dayStats?.badgeLevel || 'none';
            const hasBadge = badgeLevel !== 'none';

            return (
              <button
                key={dateItem.toISOString()}
                onClick={() => onDateSelect(dateItem)}
                className="flex-1 flex justify-center"
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all relative overflow-hidden',
                    !isCurrentMonth && 'text-muted-foreground/30',
                    isCurrentMonth && !isSelected && !isTodayDate && !hasBadge && 'hover:bg-muted/50',
                    isSelected && !hasBadge && 'bg-violet-600 text-white shadow-md',
                    !isSelected && isTodayDate && isCurrentMonth && !hasBadge && 'bg-violet-100 text-violet-700',
                    hasBadge && isSelected && 'ring-2 ring-violet-600 ring-offset-1'
                  )}
                >
                  {hasBadge && isCurrentMonth ? (
                    <img 
                      src={BADGE_IMAGES[badgeLevel]} 
                      alt={`${badgeLevel} badge`}
                      className="w-[115%] h-[115%] object-cover"
                    />
                  ) : (
                    <>
                      {hasProgramEvents && isCurrentMonth && (
                        <Star className={cn(
                          "absolute -top-0.5 -right-0.5 h-3 w-3",
                          isSelected ? "text-indigo-300 fill-indigo-300" : "text-indigo-500 fill-indigo-500"
                        )} />
                      )}
                      <span className="relative z-10">{format(dateItem, 'd')}</span>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};
