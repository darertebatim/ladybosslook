import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addDays,
  isAfter,
} from 'date-fns';
import { cn } from '@/lib/utils';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// ─── STREAK CALENDAR ───

interface StreakCalendarProps {
  activeDates: string[]; // 'yyyy-MM-dd'
}

export function StreakCalendar({ activeDates }: StreakCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const activeSet = useMemo(() => new Set(activeDates), [activeDates]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const today = new Date();

  return (
    <CalendarShell
      currentMonth={currentMonth}
      onPrev={() => setCurrentMonth(m => subMonths(m, 1))}
      onNext={() => setCurrentMonth(m => addMonths(m, 1))}
    >
      {days.map((day, idx) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const inMonth = isSameMonth(day, currentMonth);
        const isActive = activeSet.has(dateStr);
        const isToday = isSameDay(day, today);
        const isFuture = isAfter(day, today);

        // Check consecutive for pill effect
        const prevActive = activeSet.has(format(addDays(day, -1), 'yyyy-MM-dd'));
        const nextActive = activeSet.has(format(addDays(day, 1), 'yyyy-MM-dd'));

        if (!inMonth) {
          return (
            <div key={idx} className="flex items-center justify-center h-10">
              <span className="text-sm text-muted-foreground/30">{format(day, 'd')}</span>
            </div>
          );
        }

        return (
          <div key={idx} className="flex items-center justify-center h-10 relative">
            {isActive && (
              <div
                className={cn(
                  'absolute inset-y-1 bg-orange-400',
                  // Pill shape for consecutive days
                  prevActive && nextActive && 'inset-x-0 rounded-none',
                  prevActive && !nextActive && 'left-0 right-1 rounded-r-full',
                  !prevActive && nextActive && 'left-1 right-0 rounded-l-full',
                  !prevActive && !nextActive && 'inset-x-1 rounded-full',
                )}
              />
            )}
            <span
              className={cn(
                'relative z-10 text-sm font-medium',
                isActive && 'text-white',
                !isActive && !isFuture && 'text-foreground',
                isFuture && !isActive && 'text-foreground',
                isToday && !isActive && 'text-orange-500 font-bold',
              )}
            >
              {format(day, 'd')}
            </span>
          </div>
        );
      })}
    </CalendarShell>
  );
}

// ─── MOOD CALENDAR ───

interface MoodCalendarProps {
  moodByDate: Record<string, { emotion: string; valence: string }>;
}

const VALENCE_EMOJI: Record<string, string> = {
  positive: '😊',
  negative: '😔',
  neutral: '😐',
};

export function MoodCalendar({ moodByDate }: MoodCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const today = new Date();

  return (
    <CalendarShell
      currentMonth={currentMonth}
      onPrev={() => setCurrentMonth(m => subMonths(m, 1))}
      onNext={() => setCurrentMonth(m => addMonths(m, 1))}
    >
      {days.map((day, idx) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const inMonth = isSameMonth(day, currentMonth);
        const mood = moodByDate[dateStr];
        const isToday = isSameDay(day, today);

        if (!inMonth) {
          return (
            <div key={idx} className="flex items-center justify-center h-10">
              <span className="text-sm text-muted-foreground/30">{format(day, 'd')}</span>
            </div>
          );
        }

        if (mood) {
          // Show a yellow circle with smiley face
          const valence = mood.valence || 'neutral';
          const bgColor = valence === 'positive' ? 'bg-yellow-300' 
            : valence === 'negative' ? 'bg-yellow-200' 
            : 'bg-green-200';
          
          return (
            <div key={idx} className="flex items-center justify-center h-10">
              <div className={cn('w-9 h-9 rounded-full flex items-center justify-center', bgColor)}>
                <span className="text-base leading-none">
                  {VALENCE_EMOJI[valence] || '😊'}
                </span>
              </div>
            </div>
          );
        }

        return (
          <div key={idx} className="flex items-center justify-center h-10">
            <span className={cn(
              'text-sm font-medium',
              isToday ? 'text-orange-500 font-bold' : 'text-foreground',
            )}>
              {format(day, 'd')}
            </span>
          </div>
        );
      })}
    </CalendarShell>
  );
}

// ─── ACTION CALENDAR ───

interface ActionCalendarProps {
  countsByDate: Record<string, number>;
}

export function ActionCalendar({ countsByDate }: ActionCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const today = new Date();

  return (
    <CalendarShell
      currentMonth={currentMonth}
      onPrev={() => setCurrentMonth(m => subMonths(m, 1))}
      onNext={() => setCurrentMonth(m => addMonths(m, 1))}
    >
      {days.map((day, idx) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const inMonth = isSameMonth(day, currentMonth);
        const count = countsByDate[dateStr] || 0;
        const isToday = isSameDay(day, today);

        if (!inMonth) {
          return (
            <div key={idx} className="flex items-center justify-center h-10">
              <span className="text-sm text-muted-foreground/30">{format(day, 'd')}</span>
            </div>
          );
        }

        if (count > 0) {
          // Gold coin style – brighter for more completions
          const intensity = Math.min(count, 5);
          const bgColor = intensity >= 3 ? 'bg-amber-400' : intensity >= 2 ? 'bg-amber-300' : 'bg-amber-200';
          
          return (
            <div key={idx} className="flex items-center justify-center h-10">
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center shadow-sm',
                bgColor,
              )}>
                <span className="text-base">💎</span>
              </div>
            </div>
          );
        }

        return (
          <div key={idx} className="flex items-center justify-center h-10">
            <span className={cn(
              'text-sm font-medium',
              isToday ? 'text-orange-500 font-bold' : 'text-foreground',
            )}>
              {format(day, 'd')}
            </span>
          </div>
        );
      })}
    </CalendarShell>
  );
}

// ─── SHARED CALENDAR SHELL ───

interface CalendarShellProps {
  currentMonth: Date;
  onPrev: () => void;
  onNext: () => void;
  children: React.ReactNode;
}

function CalendarShell({ currentMonth, onPrev, onNext, children }: CalendarShellProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrev} className="p-1 active:scale-90 transition-transform">
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <h4 className="text-base font-semibold text-foreground">
          {format(currentMonth, 'MMM yyyy')}
        </h4>
        <button onClick={onNext} className="p-1 active:scale-90 transition-transform">
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={i} className="text-center text-xs font-semibold text-muted-foreground py-1">
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {children}
      </div>
    </div>
  );
}
