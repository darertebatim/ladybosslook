import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { useMoodLogsForMonth, MoodDay } from '@/hooks/useMoodLogs';
import { haptic } from '@/lib/haptics';

// Mood to emoji mapping
const MOOD_EMOJI: Record<string, string> = {
  great: '😄',
  good: '🙂',
  okay: '😐',
  not_great: '😔',
  bad: '😢',
};

// Mood to background color
const MOOD_BG: Record<string, string> = {
  great: 'bg-yellow-200',
  good: 'bg-green-200',
  okay: 'bg-blue-200',
  not_great: 'bg-purple-200',
  bad: 'bg-red-200',
};

interface MoodCalendarProps {
  onDaySelect?: (date: Date, mood: MoodDay | undefined) => void;
}

export function MoodCalendar({ onDaySelect }: MoodCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data: moodMap = new Map() } = useMoodLogsForMonth(currentMonth);

  const handlePrevMonth = () => {
    haptic.light();
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    haptic.light();
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-full hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <h3 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          onClick={handleNextMonth}
          className="p-2 rounded-full hover:bg-muted transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Week Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, i) => (
          <div key={i} className="text-center text-xs font-medium text-muted-foreground py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const moodData = moodMap.get(dateKey);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);

          return (
            <button
              key={i}
              onClick={() => {
                if (moodData) {
                  haptic.selection();
                  onDaySelect?.(day, moodData);
                }
              }}
              disabled={!moodData}
              className={cn(
                'aspect-square flex items-center justify-center rounded-lg relative transition-all',
                !isCurrentMonth && 'opacity-30',
                isTodayDate && !moodData && 'ring-2 ring-primary/30',
                moodData && 'cursor-pointer active:scale-95',
                !moodData && 'cursor-default'
              )}
            >
              {moodData ? (
                <div className={cn(
                  'w-full h-full rounded-lg flex items-center justify-center',
                  MOOD_BG[moodData.mood] || 'bg-muted'
                )}>
                  <FluentEmoji emoji={MOOD_EMOJI[moodData.mood] || '😐'} size={24} />
                  {moodData.count > 1 && (
                    <span className="absolute bottom-0 right-0 text-[10px] font-medium text-foreground/70 bg-background/80 rounded-full px-1">
                      {moodData.count}
                    </span>
                  )}
                </div>
              ) : (
                <span className={cn(
                  'text-sm',
                  isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {format(day, 'd')}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
