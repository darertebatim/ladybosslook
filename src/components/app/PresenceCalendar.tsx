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
} from 'date-fns';
import { cn } from '@/lib/utils';
import { useStreakCalendar } from '@/hooks/usePresenceCalendars';
import { useDateRangeTaskCompletion, BadgeLevel } from '@/hooks/useWeeklyTaskCompletion';

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

// ─── Badge emoji for each level ───
function BadgeIcon({ level, size = 28 }: { level: BadgeLevel; size?: number }) {
  if (level === 'gold') {
    return (
      <div className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
        <span style={{ fontSize: size * 0.7 }}>🏅</span>
      </div>
    );
  }
  if (level === 'silver') {
    return (
      <div className="w-9 h-9 rounded-full bg-sky-200 flex items-center justify-center shadow-sm">
        <span style={{ fontSize: size * 0.7 }}>💎</span>
      </div>
    );
  }
  if (level === 'bronze') {
    return (
      <div className="w-9 h-9 rounded-full bg-orange-200 flex items-center justify-center shadow-sm">
        <span style={{ fontSize: size * 0.7 }}>🥉</span>
      </div>
    );
  }
  return null;
}

// ─── STREAK CALENDAR ───

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

// ─── ACTION CALENDAR (badge-based like me+) ───

export function ActionCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const { data: badgeData = {} } = useDateRangeTaskCompletion(monthStart, monthEnd);
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
        const isToday = isSameDay(day, today);
        const dayData = badgeData[dateStr];
        const badge = dayData?.badgeLevel || 'none';

        if (!inMonth) {
          return (
            <div key={idx} className="flex items-center justify-center h-10">
              <span className="text-sm text-muted-foreground/30">{format(day, 'd')}</span>
            </div>
          );
        }

        if (badge !== 'none') {
          return (
            <div key={idx} className="flex items-center justify-center h-10">
              <BadgeIcon level={badge} />
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

export function CalendarShell({ currentMonth, onPrev, onNext, children }: CalendarShellProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
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
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={i} className="text-center text-xs font-semibold text-muted-foreground py-1">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {children}
      </div>
    </div>
  );
}
