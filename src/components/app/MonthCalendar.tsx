import { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MonthCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onClose: () => void;
}

export const MonthCalendar = ({ selectedDate, onDateSelect, onClose }: MonthCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Generate calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleSelectDate = (date: Date) => {
    onDateSelect(date);
    onClose();
  };

  return (
    <div className="bg-card rounded-2xl shadow-lg border p-4 mx-4 mb-4 animate-in slide-in-from-top-2 duration-200">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-full hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          onClick={handleNextMonth}
          className="p-2 rounded-full hover:bg-muted transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map((weekday) => (
          <div key={weekday} className="text-center text-xs text-muted-foreground font-medium py-1">
            {weekday}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((dateItem, idx) => {
          const isCurrentMonth = isSameMonth(dateItem, currentMonth);
          const isSelected = isSameDay(dateItem, selectedDate);
          const isTodayDate = isToday(dateItem);

          return (
            <button
              key={idx}
              onClick={() => handleSelectDate(dateItem)}
              disabled={!isCurrentMonth}
              className={cn(
                'h-10 w-full rounded-full flex items-center justify-center text-sm transition-all',
                !isCurrentMonth && 'text-muted-foreground/30 cursor-not-allowed',
                isCurrentMonth && 'hover:bg-muted',
                isSelected && 'bg-violet-600 text-white hover:bg-violet-700',
                !isSelected && isTodayDate && isCurrentMonth && 'bg-muted font-semibold'
              )}
            >
              {format(dateItem, 'd')}
            </button>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t">
        <button
          onClick={() => handleSelectDate(new Date())}
          className="flex-1 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
        >
          Today
        </button>
        <button
          onClick={() => handleSelectDate(addDays(new Date(), 1))}
          className="flex-1 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
        >
          Tomorrow
        </button>
      </div>
    </div>
  );
};
