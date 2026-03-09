import { useState, useMemo } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { format, addDays, subDays, startOfWeek, endOfWeek, addWeeks, subWeeks, addMonths, subMonths, addYears, subYears, parseISO, differenceInCalendarDays } from 'date-fns';
import { useFocusStats, FocusSession } from '@/hooks/useFocusSessions';
import tomato3d from '@/assets/tomato-3d.png';

type Period = 'day' | 'week' | 'month' | 'year';

interface FocusStatsScreenProps {
  onBack: () => void;
}

export const FocusStatsScreen = ({ onBack }: FocusStatsScreenProps) => {
  const [period, setPeriod] = useState<Period>('day');
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: sessions = [], isLoading } = useFocusStats(currentDate, period);

  const navigateDate = (direction: 'prev' | 'next') => {
    haptic.light();
    setCurrentDate(prev => {
      switch (period) {
        case 'day': return direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1);
        case 'week': return direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1);
        case 'month': return direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1);
        case 'year': return direction === 'prev' ? subYears(prev, 1) : addYears(prev, 1);
      }
    });
  };

  const formatDateLabel = () => {
    switch (period) {
      case 'day': return format(currentDate, 'MMM dd, yyyy');
      case 'week': {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd')}`;
      }
      case 'month': return format(currentDate, 'MMMM yyyy');
      case 'year': return format(currentDate, 'yyyy');
    }
  };

  // Computed stats
  const stats = useMemo(() => {
    const pomodoroCount = sessions.filter(s => s.session_type === 'pomodoro').reduce((sum, s) => sum + (s.pomodoro_rounds || 0), 0);
    const uniqueDays = new Set(sessions.map(s => format(parseISO(s.started_at), 'yyyy-MM-dd'))).size;
    const totalCount = sessions.length;
    const totalSeconds = sessions.reduce((sum, s) => sum + s.duration_seconds, 0);
    const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;

    // Timeline: group by hour for day, by day for week/month, by month for year
    const timelineBars: { label: string; minutes: number }[] = [];
    if (period === 'day') {
      const hourMap: Record<number, number> = {};
      sessions.forEach(s => {
        const hour = parseISO(s.started_at).getHours();
        hourMap[hour] = (hourMap[hour] || 0) + s.duration_seconds / 60;
      });
      for (let h = 0; h < 24; h++) {
        if (hourMap[h]) timelineBars.push({ label: `${h.toString().padStart(2, '0')}:00`, minutes: hourMap[h] });
      }
    } else {
      const dayMap: Record<string, number> = {};
      sessions.forEach(s => {
        const key = format(parseISO(s.started_at), 'MM/dd');
        dayMap[key] = (dayMap[key] || 0) + s.duration_seconds / 60;
      });
      Object.entries(dayMap).forEach(([label, minutes]) => {
        timelineBars.push({ label, minutes });
      });
    }

    // Theme breakdown
    const themeMap: Record<string, number> = {};
    sessions.forEach(s => {
      const t = s.theme || 'Focus';
      themeMap[t] = (themeMap[t] || 0) + s.duration_seconds / 60;
    });
    const themes = Object.entries(themeMap).map(([name, totalMinutes]) => ({
      name,
      totalMinutes: Math.round(totalMinutes),
    })).sort((a, b) => b.totalMinutes - a.totalMinutes);

    return { pomodoroCount, focusDays: uniqueDays, totalCount, totalHours, timelineBars, themes };
  }, [sessions, period]);

  const THEME_COLORS = ['hsl(270,70%,75%)', 'hsl(330,80%,75%)', 'hsl(200,70%,65%)', 'hsl(40,80%,65%)', 'hsl(150,60%,55%)'];

  // Timeline max
  const maxMin = Math.max(60, ...stats.timelineBars.map(b => b.minutes));
  const timelineLabels = period === 'day'
    ? ['00:00', '06:00', '12:00', '18:00', '23:00']
    : stats.timelineBars.map(b => b.label);

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <div
        className="bg-background px-4 pb-2"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
      >
        <button onClick={onBack} className="p-2 -ml-2 mb-2">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground px-2">Focus Stats</h1>
      </div>

      {/* Period tabs */}
      <div className="bg-background px-5 pb-5 pt-4">
        <div className="flex bg-muted rounded-full p-1">
          {(['day', 'week', 'month', 'year'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => { setPeriod(p); haptic.light(); }}
              className={cn(
                'flex-1 py-2 rounded-full text-sm font-medium transition-colors capitalize',
                period === p ? 'bg-[hsl(270,60%,70%)] text-white' : 'text-muted-foreground'
              )}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-safe">
        {/* Date navigation */}
        <div className="flex items-center justify-between px-8 py-4">
          <button onClick={() => navigateDate('prev')} className="p-2">
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </button>
          <span className="text-lg font-semibold text-foreground">{formatDateLabel()}</span>
          <button onClick={() => navigateDate('next')} className="p-2">
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Top stat cards */}
        <div className="px-5 mb-4">
          <div className="bg-background rounded-2xl p-5 flex">
            <div className="flex-1 border-r border-border/50 pr-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">Pomodoro Counts</p>
              <div className="flex items-center gap-2">
                <img src={tomato3d} alt="🍅" className="w-7 h-7" />
                <span className="text-3xl font-bold text-foreground">{stats.pomodoroCount}</span>
              </div>
            </div>
            <div className="flex-1 pl-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">Focus Days</p>
              <span className="text-3xl font-bold text-foreground">{stats.focusDays}</span>
            </div>
          </div>
        </div>

        {/* Total counts card */}
        <div className="px-5 mb-6">
          <div className="bg-background rounded-2xl divide-y divide-border/50">
            <div className="flex items-center justify-between p-5">
              <span className="text-base font-medium text-foreground">Total Focus Counts</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">{stats.totalCount}</span>
                <span className="text-sm text-muted-foreground">times</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-5">
              <span className="text-base font-medium text-foreground">Total Focus Time</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">{stats.totalHours}</span>
                <span className="text-sm text-muted-foreground">h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Focus Timeline */}
        <div className="px-5 mb-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Focus Timeline</h2>
          <div className="bg-background rounded-2xl p-5">
            <div className="relative h-48">
              {/* Y-axis dashed lines */}
              {[60, 40, 20, 0].map(val => (
                <div
                  key={val}
                  className="absolute left-0 right-12 flex items-center"
                  style={{ bottom: `${(val / maxMin) * 100}%` }}
                >
                  <div className="flex-1 border-b border-dashed border-border/40" />
                  <span className="text-xs text-muted-foreground/60 ml-2 whitespace-nowrap w-10 text-right">
                    {val} min
                  </span>
                </div>
              ))}

              {/* Bars */}
              {stats.timelineBars.map((bar, idx) => {
                const barHeight = Math.max(2, (bar.minutes / maxMin) * 100);
                let barX: number;
                if (period === 'day') {
                  const hour = parseInt(bar.label);
                  barX = (hour / 24) * 85;
                } else {
                  barX = (idx / Math.max(1, stats.timelineBars.length)) * 85;
                }
                return (
                  <div
                    key={idx}
                    className="absolute bottom-0 rounded-t"
                    style={{
                      left: `${barX}%`,
                      width: '14px',
                      height: `${barHeight}%`,
                      backgroundColor: 'hsl(270, 70%, 78%)',
                    }}
                  />
                );
              })}
            </div>

            {/* X-axis labels */}
            {period === 'day' ? (
              <div className="flex justify-between mt-2 pr-12">
                {['00:00', '06:00', '12:00', '18:00', '23:00'].map(h => (
                  <span key={h} className="text-xs text-muted-foreground/60">{h}</span>
                ))}
              </div>
            ) : stats.timelineBars.length > 0 ? (
              <div className="flex gap-4 mt-2 overflow-x-auto pr-12">
                {stats.timelineBars.map((b, i) => (
                  <span key={i} className="text-xs text-muted-foreground/60 shrink-0">{b.label}</span>
                ))}
              </div>
            ) : (
              <div className="flex justify-center mt-2">
                <span className="text-xs text-muted-foreground/40">No data</span>
              </div>
            )}
          </div>
        </div>

        {/* Focus Details */}
        {stats.themes.length > 0 && (
          <div className="px-5 pb-10">
            <h2 className="text-lg font-bold text-foreground mb-4">Focus Details</h2>
            <div className="bg-background rounded-2xl divide-y divide-border/50">
              {stats.themes.map((theme, i) => (
                <div key={theme.name} className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: THEME_COLORS[i % THEME_COLORS.length] }}
                    />
                    <span className="text-base font-medium text-foreground">{theme.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Total: {theme.totalMinutes} min</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <span className="text-4xl mb-4">⏱️</span>
            <p className="text-muted-foreground text-center">No focus sessions yet for this period.</p>
          </div>
        )}
      </div>
    </div>
  );
};
