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
    <div className="bg-gradient-to-b from-violet-100 to-background px-2 pb-2 animate-in slide-in-from-top-2 duration-200">
      {/* Month navigation */}
      <div className="flex items-center justify-between py-3">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-full hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-base font-semibold">
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
      <div className="grid grid-cols-7 gap-1 mb-1">
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
                'h-9 w-full rounded-full flex items-center justify-center text-sm transition-all',
                !isCurrentMonth && 'text-muted-foreground/30 cursor-not-allowed',
                isCurrentMonth && 'hover:bg-muted',
                isSelected && 'bg-violet-600 text-white hover:bg-violet-700',
                !isSelected && isTodayDate && isCurrentMonth && 'bg-violet-100 font-semibold text-violet-700'
              )}
            >
              {format(dateItem, 'd')}
            </button>
          );
        })}
      </div>

      {/* Collapse handle */}
      <button 
        onClick={onClose}
        className="w-full flex justify-center pt-3 pb-1"
      >
        <div className="flex gap-0.5">
          <div className="w-8 h-1 rounded-full bg-muted-foreground/30" />
          <div className="w-8 h-1 rounded-full bg-muted-foreground/30" />
        </div>
      </button>
    </div>
  );
};