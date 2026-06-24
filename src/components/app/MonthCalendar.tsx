import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';
import type { BadgeLevel } from '@/hooks/useWeeklyTaskCompletion';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

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
    <div className="animate-in slide-in-from-top-2 duration-200 px-1">
      {/* Day-of-week headers */}
      <div className="flex mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="flex-1 text-center text-[12px] font-medium text-fg-warm-muted">
            {d}
          </div>
        ))}
      </div>

      {/* Week rows - matching collapsed week strip styling */}
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
            const hasBadge = badgeLevel === 'gold';

            return (
              <button
                key={dateItem.toISOString()}
                onClick={() => onDateSelect(dateItem)}
                className="flex-1 flex justify-center"
              >
                <div
                  className={cn(
                    'w-11 h-11 rounded-2xl flex flex-col items-center justify-center transition-all relative',
                    !isCurrentMonth && 'opacity-30',
                    isCurrentMonth && !isSelected && !isTodayDate && 'text-fg-warm active:bg-bg-warm',
                    isSelected && 'border-2 border-brand text-fg-warm',
                    !isSelected && isTodayDate && isCurrentMonth && !hasBadge && 'text-brand'
                  )}
                >
                  {hasProgramEvents && isCurrentMonth && (
                    <Star className={cn(
                      "absolute -top-0.5 -right-0.5 h-2.5 w-2.5 z-20",
                      isSelected ? "text-indigo-400 fill-indigo-400" : "text-indigo-500 fill-indigo-500"
                    )} />
                  )}
                  {hasBadge && isCurrentMonth && !isTodayDate && (
                    <div className={cn(
                      "absolute inset-0 flex items-center justify-center pointer-events-none",
                      isSelected ? "opacity-100" : "opacity-70"
                    )}>
                      <FluentEmoji emoji="🏆" size={32} />
                    </div>
                  )}
                  <span className={cn(
                    'relative z-10 text-[15px] font-bold leading-none',
                    !isCurrentMonth && 'text-fg-warm-muted/50',
                    hasBadge && !isTodayDate && isCurrentMonth && 'text-fg-warm drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]'
                  )}>
                    {format(dateItem, 'd')}
                  </span>
                  {hasBadge && isCurrentMonth && isTodayDate && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                      <FluentEmoji emoji="🏆" size={32} />
                    </div>
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
