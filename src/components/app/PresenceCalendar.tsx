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
import { useStreakCalendar, useMoodCalendar, useActionCalendar } from '@/hooks/usePresenceCalendars';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function useCalendarDays(currentMonth: Date) {
  return useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);
}

// ─── STREAK CALENDAR (self-contained with data fetching) ───

export function StreakCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data: activeDates = [] } = useStreakCalendar(currentMonth);
  const activeSet = useMemo(() => new Set(activeDates), [activeDates]);
  const days = useCalendarDays(currentMonth);
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

        if (!inMonth) {
          return (
            <div key={idx} className="flex items-center justify-center h-10">
              <span className="text-sm text-muted-foreground/30">{format(day, 'd')}</span>
            </div>
          );
        }

        // Check consecutive for pill effect
        const prevDay = addDays(day, -1);
        const nextDay = addDays(day, 1);
        const prevActive = isSameMonth(prevDay, currentMonth) && activeSet.has(format(prevDay, 'yyyy-MM-dd'));
        const nextActive = isSameMonth(nextDay, currentMonth) && activeSet.has(format(nextDay, 'yyyy-MM-dd'));

        return (
          <div key={idx} className="flex items-center justify-center h-10 relative">
            {isActive && (
              <div
                className={cn(
                  'absolute inset-y-1',
                  prevActive && nextActive && 'inset-x-0 rounded-none bg-orange-400',
                  prevActive && !nextActive && 'left-0 right-1 rounded-r-full bg-orange-400',
                  !prevActive && nextActive && 'left-1 right-0 rounded-l-full bg-orange-400',
                  !prevActive && !nextActive && 'inset-x-1 rounded-full bg-orange-400',
                )}
              />
            )}
            <span
              className={cn(
                'relative z-10 text-sm font-medium',
                isActive && 'text-white',
                !isActive && 'text-foreground',
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

const VALENCE_EMOJI_MAP: Record<string, string> = {
  positive: '😊',
  negative: '😔',
  neutral: '😐',
};

const VALENCE_BG: Record<string, string> = {
  positive: 'bg-yellow-300',
  negative: 'bg-yellow-200',
  neutral: 'bg-green-200',
};

export function MoodCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data: moodByDate = {} } = useMoodCalendar(currentMonth);
  const days = useCalendarDays(currentMonth);
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
          const valence = mood.valence || 'neutral';
          const bg = VALENCE_BG[valence] || VALENCE_BG.neutral;
          const emoji = VALENCE_EMOJI_MAP[valence] || '😊';

          return (
            <div key={idx} className="flex items-center justify-center h-10">
              <div className={cn('w-9 h-9 rounded-full flex items-center justify-center', bg)}>
                <FluentEmoji emoji={emoji} size={22} />
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

export function ActionCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data: countsByDate = {} } = useActionCalendar(currentMonth);
  const days = useCalendarDays(currentMonth);
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
          // Gold coin – brighter for more completions
          const intensity = Math.min(count, 5);
          const bg = intensity >= 3 ? 'bg-amber-400' : intensity >= 2 ? 'bg-amber-300' : 'bg-amber-200';

          return (
            <div key={idx} className="flex items-center justify-center h-10">
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center shadow-sm',
                bg,
              )}>
                <FluentEmoji emoji={intensity >= 3 ? '🏆' : '💎'} size={20} />
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
