import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';
import type { BadgeLevel } from '@/hooks/useWeeklyTaskCompletion';

import coinBronze from '@/assets/coin-bronze.png';
import coinSilver from '@/assets/coin-silver.png';
import coinGold from '@/assets/coin-gold.png';

const BADGE_IMAGES: Record<Exclude<BadgeLevel, 'none'>, string> = {
  bronze: coinBronze,
  silver: coinSilver,
  gold: coinGold,
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
      {/* Day-of-week headers */}
      <div className="flex mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="flex-1 text-center text-[10px] font-medium text-muted-foreground/60">
            {d}
          </div>
        ))}
      </div>

      {/* Week rows - matching collapsed week strip styling */}
      {weeks.map((week, weekIdx) => (
        <div key={weekIdx} className="flex mt-1.5">
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
                    'w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all relative',
                    !isCurrentMonth && 'opacity-30',
                    isCurrentMonth && !isSelected && !isTodayDate && !hasBadge && 'text-muted-foreground hover:bg-muted/50',
                    isSelected && !hasBadge && 'bg-chip-lavender text-foreground scale-105',
                    !isSelected && isTodayDate && isCurrentMonth && !hasBadge && 'border border-background text-muted-foreground',
                    hasBadge && isSelected && 'ring-2 ring-chip-lavender ring-offset-0'
                  )}
                >
                  {hasProgramEvents && isCurrentMonth && (
                    <Star className={cn(
                      "absolute -top-0.5 -right-0.5 h-2.5 w-2.5 z-20",
                      isSelected ? "text-indigo-400 fill-indigo-400" : "text-indigo-500 fill-indigo-500"
                    )} />
                  )}
                  {hasBadge && isCurrentMonth ? (
                    <img 
                      src={BADGE_IMAGES[badgeLevel]} 
                      alt={`${badgeLevel} badge`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <span className={cn(
                      'text-sm font-bold leading-none',
                      isSelected && 'text-foreground',
                      !isCurrentMonth && 'text-muted-foreground/40'
                    )}>
                      {format(dateItem, 'd')}
                    </span>
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
