import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Flame } from 'lucide-react';

interface MonthCalendarProps {
  selectedDate: Date;
  currentMonth: Date;
  onDateSelect: (date: Date) => void;
  completedDates?: Set<string>;
}

export const MonthCalendar = ({ selectedDate, currentMonth, onDateSelect, completedDates }: MonthCalendarProps) => {
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
            const hasCompletions = completedDates?.has(dateStr);

            return (
              <button
                key={dateItem.toISOString()}
                onClick={() => onDateSelect(dateItem)}
                className="flex-1 flex justify-center"
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all relative',
                    !isCurrentMonth && 'text-muted-foreground/30',
                    isCurrentMonth && !isSelected && !isTodayDate && 'hover:bg-muted/50',
                    isSelected && 'bg-violet-600 text-white shadow-md',
                    !isSelected && isTodayDate && isCurrentMonth && 'bg-violet-100 text-violet-700'
                  )}
                >
                  {hasCompletions && isCurrentMonth && !isSelected && (
                    <Flame className="absolute h-7 w-7 text-orange-400 opacity-50" />
                  )}
                  <span className="relative z-10">{format(dateItem, 'd')}</span>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};
