import { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { format, addDays, subDays, startOfWeek, endOfWeek, addWeeks, subWeeks, addMonths, subMonths, addYears, subYears } from 'date-fns';

type Period = 'day' | 'week' | 'month' | 'year';

interface FocusStatsScreenProps {
  onBack: () => void;
}

// Mock data for UI — will be replaced with real data later
const MOCK_DAILY_SESSIONS = [
  { hour: 10, minutes: 8, theme: 'Focus' },
  { hour: 11, minutes: 15, theme: 'Focus' },
  { hour: 14, minutes: 25, theme: 'Read' },
];

const MOCK_THEMES = [
  { name: 'Read', color: 'hsl(330, 80%, 75%)', totalMinutes: 25 },
  { name: 'Focus', color: 'hsl(270, 70%, 75%)', totalMinutes: 23 },
];

export const FocusStatsScreen = ({ onBack }: FocusStatsScreenProps) => {
  const [period, setPeriod] = useState<Period>('day');
  const [currentDate, setCurrentDate] = useState(new Date());

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

  // Mock stats
  const pomodoroCount = 4;
  const focusDays = 1;
  const totalFocusCounts = 11;
  const totalFocusHours = 0.4;

  // Timeline bars (24h view for day)
  const timelineHours = ['00:00', '06:00', '12:00', '18:00', '23:00'];
  const maxMinutes = 60;

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <div className="bg-background px-4 pt-4 pb-2">
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
                period === p ? 'bg-[hsl(270,60%,70%)] text-background' : 'text-muted-foreground'
              )}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
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
                <span className="text-2xl">🍅</span>
                <span className="text-3xl font-bold text-foreground">{pomodoroCount}</span>
              </div>
            </div>
            <div className="flex-1 pl-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">Focus Days</p>
              <span className="text-3xl font-bold text-foreground">{focusDays}</span>
            </div>
          </div>
        </div>

        {/* Total counts card */}
        <div className="px-5 mb-6">
          <div className="bg-background rounded-2xl divide-y divide-border/50">
            <div className="flex items-center justify-between p-5">
              <span className="text-base font-medium text-foreground">Total Focus Counts</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">{totalFocusCounts}</span>
                <span className="text-sm text-muted-foreground">times</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-5">
              <span className="text-base font-medium text-foreground">Total Focus Time</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">{totalFocusHours}</span>
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
              {[60, 40, 20, 0].map((val, i) => (
                <div
                  key={val}
                  className="absolute left-0 right-0 flex items-center"
                  style={{ bottom: `${(val / maxMinutes) * 100}%` }}
                >
                  <div className="flex-1 border-b border-dashed border-border/40" />
                  <span className="text-xs text-muted-foreground/60 ml-2 whitespace-nowrap">
                    {val > 0 ? `${val} min` : `${val} min`}
                  </span>
                </div>
              ))}

              {/* Bars */}
              {MOCK_DAILY_SESSIONS.map((session, idx) => {
                const barHeight = (session.minutes / maxMinutes) * 100;
                const barX = (session.hour / 24) * 100;
                return (
                  <div
                    key={idx}
                    className="absolute bottom-0 rounded-t"
                    style={{
                      left: `${barX}%`,
                      width: '12px',
                      height: `${barHeight}%`,
                      backgroundColor: 'hsl(270, 70%, 78%)',
                    }}
                  />
                );
              })}
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between mt-2">
              {timelineHours.map(h => (
                <span key={h} className="text-xs text-muted-foreground/60">{h}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Focus Details */}
        <div className="px-5 pb-10">
          <h2 className="text-lg font-bold text-foreground mb-4">Focus Details</h2>
          <div className="bg-background rounded-2xl divide-y divide-border/50">
            {MOCK_THEMES.map(theme => (
              <div key={theme.name} className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: theme.color }}
                  />
                  <span className="text-base font-medium text-foreground">{theme.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">Total: {theme.totalMinutes} min</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
