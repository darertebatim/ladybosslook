import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

interface PeriodCalendarProps {
  currentMonth: Date;
  loggedPeriodDays: Set<string>;
  predictedPeriodDays: Set<string>;
  ovulationDays: Set<string>;
  onDateSelect: (date: Date) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const PeriodCalendar = ({
  currentMonth,
  loggedPeriodDays,
  predictedPeriodDays,
  ovulationDays,
  onDateSelect,
}: PeriodCalendarProps) => {
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
    <div className="space-y-2">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-pink-400 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Date grid */}
      {weeks.map((week, weekIdx) => (
        <div key={weekIdx} className="grid grid-cols-7 gap-1">
          {week.map((dateItem) => {
            const isCurrentMonth = isSameMonth(dateItem, currentMonth);
            const isTodayDate = isToday(dateItem);
            const dateStr = format(dateItem, 'yyyy-MM-dd');
            
            const isLogged = loggedPeriodDays.has(dateStr);
            const isPredicted = predictedPeriodDays.has(dateStr) && !isLogged;
            const isOvulation = ovulationDays.has(dateStr) && !isLogged && !isPredicted;

            return (
              <button
                key={dateItem.toISOString()}
                onClick={() => {
                  haptic.light();
                  onDateSelect(dateItem);
                }}
                disabled={!isCurrentMonth}
                className={cn(
                  'aspect-square flex items-center justify-center text-sm font-medium rounded-full transition-all relative',
                  'active:scale-90',
                  !isCurrentMonth && 'text-pink-200 pointer-events-none',
                  isCurrentMonth && !isLogged && !isPredicted && !isOvulation && 'hover:bg-pink-50 text-pink-700',
                  isTodayDate && !isLogged && 'ring-2 ring-pink-400 ring-offset-1'
                )}
              >
                {/* Background for logged period */}
                {isLogged && (
                  <div className="absolute inset-1 rounded-full bg-pink-500 shadow-md" />
                )}
                
                {/* Border for predicted period */}
                {isPredicted && (
                  <div 
                    className="absolute inset-1 rounded-full border-2 border-dashed border-pink-400"
                    style={{ 
                      borderStyle: 'dashed',
                      borderWidth: '2px',
                    }}
                  />
                )}
                
                {/* Background for ovulation */}
                {isOvulation && (
                  <div className="absolute inset-1.5 rounded-full bg-amber-400/80 shadow-sm" />
                )}

                {/* Date number */}
                <span 
                  className={cn(
                    'relative z-10',
                    isLogged && 'text-white font-semibold',
                    isOvulation && 'text-white font-semibold',
                    isPredicted && 'text-pink-500',
                  )}
                >
                  {format(dateItem, 'd')}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};
