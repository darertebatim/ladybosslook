import { useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JournalCalendarProps {
  /** Set of date strings (yyyy-MM-dd) that have journal entries */
  journalDays: Set<string>;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function JournalCalendar({ journalDays }: JournalCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);
  const today = startOfDay(new Date());

  return (
    <div className="space-y-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
          className="p-2 rounded-full active:bg-muted active:scale-95 transition-transform"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <h3 className="text-sm font-semibold text-foreground">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
          className="p-2 rounded-full active:bg-muted active:scale-95 transition-transform"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-center text-[10px] font-medium text-muted-foreground py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for offset */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const hasEntry = journalDays.has(dateKey);
          const isToday = isSameDay(day, today);
          const isFuture = day > today;

          return (
            <div
              key={dateKey}
              className={cn(
                'aspect-square flex items-center justify-center rounded-lg text-xs relative',
                isFuture && 'opacity-30',
                isToday && 'ring-1 ring-primary/40',
                hasEntry ? 'bg-primary/15' : 'bg-transparent'
              )}
            >
              {hasEntry ? (
                <Check className="h-4 w-4 text-primary" strokeWidth={3} />
              ) : (
                <span className={cn(
                  'text-xs',
                  isToday ? 'font-semibold text-foreground' : 'text-muted-foreground'
                )}>
                  {format(day, 'd')}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
