import { useState, useEffect, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { getCurrentZone } from '@/lib/fastingZones';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, subMonths, addMonths } from 'date-fns';
import { X, ChevronLeft, ChevronRight, Trophy, Flame, Clock, Timer, TrendingUp, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface FastingSession {
  id: string;
  protocol: string;
  fasting_hours: number;
  started_at: string;
  ended_at: string | null;
}

interface WeightLog {
  id: string;
  weight_value: number;
  weight_unit: string;
  logged_at: string;
}

interface FastingStatsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: FastingSession[];
  onDeleteSession: (id: string) => void;
}

function formatDuration(startedAt: string, endedAt: string): string {
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function formatTotalTime(totalMs: number): string {
  const hours = Math.floor(totalMs / 3600000);
  return `${hours}h`;
}

function calculateStreak(sessions: FastingSession[]): { current: number; max: number } {
  if (sessions.length === 0) return { current: 0, max: 0 };

  const fastDays = new Set<string>();
  sessions.forEach(s => {
    if (s.ended_at) {
      fastDays.add(format(new Date(s.started_at), 'yyyy-MM-dd'));
    }
  });

  const sortedDays = Array.from(fastDays).sort().reverse();
  if (sortedDays.length === 0) return { current: 0, max: 0 };

  let maxStreak = 1;
  let currentStreak = 0;

  // Check current streak from today
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
  
  if (sortedDays[0] === today || sortedDays[0] === yesterday) {
    currentStreak = 1;
    for (let i = 1; i < sortedDays.length; i++) {
      const prev = new Date(sortedDays[i - 1]);
      const curr = new Date(sortedDays[i]);
      const diff = (prev.getTime() - curr.getTime()) / 86400000;
      if (diff === 1) {
        currentStreak++;
      } else break;
    }
  }

  // Max streak
  let streak = 1;
  const allSorted = Array.from(fastDays).sort();
  for (let i = 1; i < allSorted.length; i++) {
    const prev = new Date(allSorted[i - 1]);
    const curr = new Date(allSorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      streak++;
      maxStreak = Math.max(maxStreak, streak);
    } else {
      streak = 1;
    }
  }
  maxStreak = Math.max(maxStreak, streak);

  return { current: currentStreak, max: maxStreak };
}

// Badges
interface Badge {
  id: string;
  emoji: string;
  name: string;
  description: string;
  check: (sessions: FastingSession[]) => boolean;
}

const BADGES: Badge[] = [
  { id: 'first', emoji: '🏅', name: 'First Fast', description: 'Complete your first fast', check: (s) => s.filter(x => x.ended_at).length >= 1 },
  { id: 'five', emoji: '🔥', name: '5 Fasts', description: 'Complete 5 fasts', check: (s) => s.filter(x => x.ended_at).length >= 5 },
  { id: 'ten', emoji: '⭐', name: '10 Fasts', description: 'Complete 10 fasts', check: (s) => s.filter(x => x.ended_at).length >= 10 },
  { id: 'streak3', emoji: '🎯', name: '3-Day Streak', description: 'Fast 3 days in a row', check: (s) => calculateStreak(s).max >= 3 },
  { id: 'streak7', emoji: '💎', name: '7-Day Streak', description: 'Fast 7 days in a row', check: (s) => calculateStreak(s).max >= 7 },
  { id: 'long16', emoji: '💪', name: '16h Fast', description: 'Complete a 16+ hour fast', check: (s) => s.some(x => x.ended_at && (new Date(x.ended_at).getTime() - new Date(x.started_at).getTime()) >= 16 * 3600000) },
  { id: 'long24', emoji: '🧬', name: '24h Fast', description: 'Complete a 24+ hour fast', check: (s) => s.some(x => x.ended_at && (new Date(x.ended_at).getTime() - new Date(x.started_at).getTime()) >= 24 * 3600000) },
];

export function FastingStatsSheet({ open, onOpenChange, sessions, onDeleteSession }: FastingStatsSheetProps) {
  const { user } = useAuth();
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [weightValue, setWeightValue] = useState('');
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [weightGoal, setWeightGoal] = useState('');
  const [isLoggingWeight, setIsLoggingWeight] = useState(false);

  const completed = sessions.filter(s => s.ended_at);
  const totalFasts = completed.length;
  const totalTimeMs = completed.reduce((sum, s) => sum + (new Date(s.ended_at!).getTime() - new Date(s.started_at).getTime()), 0);
  const avgDurationMs = totalFasts > 0 ? totalTimeMs / totalFasts : 0;
  const longestMs = totalFasts > 0 ? Math.max(...completed.map(s => new Date(s.ended_at!).getTime() - new Date(s.started_at).getTime())) : 0;
  const streaks = useMemo(() => calculateStreak(sessions), [sessions]);
  const earnedBadges = useMemo(() => BADGES.filter(b => b.check(sessions)), [sessions]);

  // Load weight data
  useEffect(() => {
    if (!user || !open) return;
    const load = async () => {
      const [logsRes, prefRes] = await Promise.all([
        supabase.from('weight_logs' as any).select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(50),
        supabase.from('fasting_preferences' as any).select('weight_goal, weight_unit').eq('user_id', user.id).limit(1),
      ]);
      setWeightLogs((logsRes.data as any) || []);
      const pref = (prefRes.data as any)?.[0];
      if (pref?.weight_goal) setWeightGoal(String(pref.weight_goal));
    };
    load();
  }, [user, open]);

  // Calendar data
  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const fastDaysInMonth = useMemo(() => {
    const daySet = new Set<string>();
    completed.forEach(s => {
      const d = format(new Date(s.started_at), 'yyyy-MM-dd');
      daySet.add(d);
    });
    return daySet;
  }, [completed]);

  const handleLogWeight = async () => {
    if (!user || !weightValue || isLoggingWeight) return;
    setIsLoggingWeight(true);
    const { data, error } = await supabase.from('weight_logs' as any).insert({
      user_id: user.id,
      weight_value: parseFloat(weightValue),
      weight_unit: 'lb',
      logged_at: new Date().toISOString(),
    } as any).select().single();

    if (!error && data) {
      setWeightLogs(prev => [data as any, ...prev]);
      setWeightValue('');
    }
    setIsLoggingWeight(false);
  };

  const handleSaveGoal = async () => {
    if (!user) return;
    await supabase.from('fasting_preferences' as any).upsert({
      user_id: user.id,
      weight_goal: weightGoal ? parseFloat(weightGoal) : null,
    } as any, { onConflict: 'user_id' });
  };

  const lastWeight = weightLogs[0];
  const prevWeight = weightLogs[1];
  const trend = lastWeight && prevWeight
    ? lastWeight.weight_value - prevWeight.weight_value
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-0 pb-0 max-h-[92vh] flex flex-col" hideCloseButton>
        <SheetHeader className="px-6 mb-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-3" />
          <SheetTitle className="text-center">Statistics</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-10 space-y-6">
          {/* Summary */}
          <div className="rounded-2xl bg-muted/20 p-4">
            <h3 className="font-semibold text-base mb-3">Summary</h3>
            <div className="grid grid-cols-2 gap-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Total fasts</p>
                <p className="text-2xl font-bold">{totalFasts}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total time</p>
                <p className="text-2xl font-bold">{formatTotalTime(totalTimeMs)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Average fast</p>
                <p className="text-2xl font-bold">{formatDuration('2000-01-01T00:00:00Z', new Date(new Date('2000-01-01T00:00:00Z').getTime() + avgDurationMs).toISOString())}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Longest fast</p>
                <p className="text-2xl font-bold">{formatDuration('2000-01-01T00:00:00Z', new Date(new Date('2000-01-01T00:00:00Z').getTime() + longestMs).toISOString())}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Max Streak</p>
                <p className="text-2xl font-bold">{streaks.max}d</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold">{streaks.current}d</p>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="rounded-2xl bg-muted/20 p-4">
            <h3 className="font-semibold text-base mb-3">Badges</h3>
            {earnedBadges.length === 0 ? (
              <p className="text-sm text-muted-foreground">Complete fasts to earn badges!</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {earnedBadges.map(badge => (
                  <div key={badge.id} className="flex flex-col items-center gap-1">
                    <span className="text-3xl">{badge.emoji}</span>
                    <span className="text-[10px] text-muted-foreground">{badge.name}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Show locked badges */}
            {BADGES.filter(b => !b.check(sessions)).length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3 opacity-30">
                {BADGES.filter(b => !b.check(sessions)).map(badge => (
                  <div key={badge.id} className="flex flex-col items-center gap-1">
                    <span className="text-3xl grayscale">🔒</span>
                    <span className="text-[10px] text-muted-foreground">{badge.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fasting Calendar */}
          <div className="rounded-2xl bg-muted/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-base">Fasting Calendar</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setCalendarMonth(prev => subMonths(prev, 1))} className="p-1 active:scale-90">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium min-w-[100px] text-center">
                  {format(calendarMonth, 'MMMM yyyy')}
                </span>
                <button onClick={() => setCalendarMonth(prev => addMonths(prev, 1))} className="p-1 active:scale-90">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-center text-[10px] text-muted-foreground font-medium">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {daysInMonth.map(day => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const hasFast = fastDaysInMonth.has(dayStr);
                const isToday = isSameDay(day, new Date());
                return (
                  <div
                    key={dayStr}
                    className={`aspect-square flex items-center justify-center rounded-full text-xs font-medium ${
                      hasFast
                        ? 'bg-emerald-500 text-white'
                        : isToday
                          ? 'ring-1 ring-primary'
                          : ''
                    }`}
                  >
                    {day.getDate()}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Fasts */}
          <div className="rounded-2xl bg-muted/20 p-4">
            <h3 className="font-semibold text-base mb-3">Recent fasts</h3>
            {completed.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No fasts completed yet</p>
            ) : (
              <div className="space-y-3">
                {completed.slice(0, 10).map(session => (
                  <div key={session.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-xl font-bold">
                        {formatDuration(session.started_at, session.ended_at!)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(session.started_at), 'M/d/yyyy, h:mm')} – {format(new Date(session.ended_at!), 'h:mm a')}
                      </p>
                    </div>
                    <button
                      onClick={() => onDeleteSession(session.id)}
                      className="p-1.5 rounded-full active:scale-90 transition-transform"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weight Logging */}
          <div className="rounded-2xl bg-muted/20 p-4">
            <h3 className="font-semibold text-base mb-3">Weight logging</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Weight (lb)</span>
                <input
                  type="number"
                  step="0.1"
                  value={weightValue}
                  onChange={e => setWeightValue(e.target.value)}
                  placeholder="0.0"
                  className="w-24 text-right bg-muted/50 rounded-lg px-3 py-2 text-sm font-medium outline-none"
                />
              </div>

              <Button
                onClick={handleLogWeight}
                disabled={!weightValue || isLoggingWeight}
                className="w-full rounded-xl bg-orange-400 hover:bg-orange-500 text-white"
              >
                Log weight
              </Button>

              <div className="border-t border-border pt-3 mt-3">
                <h4 className="font-semibold text-sm mb-2">Weight goal</h4>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm">Goal (lb)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={weightGoal}
                    onChange={e => setWeightGoal(e.target.value)}
                    onBlur={handleSaveGoal}
                    placeholder="0.0"
                    className="w-24 text-right bg-muted/50 rounded-lg px-3 py-2 text-sm font-medium outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Last weight</p>
                    <p className="text-lg font-bold">{lastWeight ? `${lastWeight.weight_value} lb` : 'No data'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-lg font-bold">{lastWeight ? format(new Date(lastWeight.logged_at), 'MMM d') : 'No data'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Trend</p>
                    <p className="text-lg font-bold">
                      {trend !== null ? `${trend > 0 ? '+' : ''}${trend.toFixed(1)} lb` : 'No data'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Progress</p>
                    <p className="text-lg font-bold">
                      {lastWeight && weightGoal
                        ? `${(parseFloat(weightGoal) - lastWeight.weight_value).toFixed(1)} lb`
                        : 'No data'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
