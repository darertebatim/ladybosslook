import { useMemo } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { AppHeader, AppHeaderSpacer } from '@/components/app/AppHeader';
import { useBreathingSessions, useBreathingExercises } from '@/hooks/useBreathingExercises';
import { Skeleton } from '@/components/ui/skeleton';
import { Wind, Clock, Flame, TrendingUp, Calendar } from 'lucide-react';
import { format, subDays, startOfDay, isAfter } from 'date-fns';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { useTranslation } from 'react-i18next';

export default function AppBreatheStats() {
  const { t } = useTranslation();
  const { data: sessions, isLoading: sessionsLoading } = useBreathingSessions();
  const { data: exercises } = useBreathingExercises();

  const exerciseMap = useMemo(() => {
    if (!exercises) return new Map();
    return new Map(exercises.map(e => [e.id, e]));
  }, [exercises]);

  const stats = useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return { totalSessions: 0, totalMinutes: 0, streak: 0, favoriteExercise: null, last7Days: [], byExercise: [] };
    }

    const totalSessions = sessions.length;
    const totalSeconds = sessions.reduce((sum, s) => sum + s.duration_seconds, 0);
    const totalMinutes = Math.round(totalSeconds / 60);

    // Streak calculation
    let streak = 0;
    const today = startOfDay(new Date());
    let checkDate = today;
    const sessionDates = new Set(sessions.map(s => format(new Date(s.completed_at), 'yyyy-MM-dd')));
    
    for (let i = 0; i < 365; i++) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      if (sessionDates.has(dateStr)) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else if (i === 0) {
        // Today might not have a session yet, check yesterday
        checkDate = subDays(checkDate, 1);
        continue;
      } else {
        break;
      }
    }

    // Last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const daySessions = sessions.filter(s => format(new Date(s.completed_at), 'yyyy-MM-dd') === dateStr);
      const mins = Math.round(daySessions.reduce((sum, s) => sum + s.duration_seconds, 0) / 60);
      return { date, label: format(date, 'EEE'), minutes: mins, count: daySessions.length };
    });

    // By exercise
    const exerciseCounts = new Map<string, { count: number; totalSeconds: number }>();
    sessions.forEach(s => {
      const existing = exerciseCounts.get(s.exercise_id) || { count: 0, totalSeconds: 0 };
      existing.count++;
      existing.totalSeconds += s.duration_seconds;
      exerciseCounts.set(s.exercise_id, existing);
    });

    const byExercise = Array.from(exerciseCounts.entries())
      .map(([id, data]) => ({ exerciseId: id, ...data }))
      .sort((a, b) => b.count - a.count);

    const favoriteExercise = byExercise.length > 0 ? exerciseMap.get(byExercise[0].exerciseId) : null;

    return { totalSessions, totalMinutes, streak, favoriteExercise, last7Days, byExercise };
  }, [sessions, exerciseMap]);

  const maxMinutes = Math.max(...(stats.last7Days.map(d => d.minutes)), 1);

  return (
    <>
      <SEOHead title={t('breatheStatsPage.seoTitle')} description={t('breatheStatsPage.seoDesc')} />
      <div className="min-h-screen bg-background">
        <AppHeader title={t('breatheStatsPage.title')} showBack backTo="/app/breathe" />
        <AppHeaderSpacer />

        <div className="px-4 pb-safe space-y-5">
          {sessionsLoading ? (
            <div className="space-y-4 pt-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
          ) : sessions && sessions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Wind className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-foreground font-medium">{t('breatheStatsPage.noSessions')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('breatheStatsPage.noSessionsHint')}</p>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-muted rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Wind className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">{t('breatheStatsPage.sessions')}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalSessions}</p>
                </div>
                <div className="bg-muted rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">{t('breatheStatsPage.totalMinutes')}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalMinutes}</p>
                </div>
                <div className="bg-muted rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">{t('breatheStatsPage.dayStreak')}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stats.streak}</p>
                </div>
                <div className="bg-muted rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">{t('breatheStatsPage.favorite')}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {stats.favoriteExercise?.name || '—'}
                  </p>
                </div>
              </div>

              {/* Last 7 days chart */}
              <div className="bg-muted rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">{t('breatheStatsPage.last7Days')}</span>
                </div>
                <div className="flex items-end justify-between gap-2 h-24">
                  {stats.last7Days.map((day, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end justify-center" style={{ height: 72 }}>
                        <div
                          className="w-full max-w-[28px] rounded-t-md transition-all"
                          style={{
                            height: day.minutes > 0 ? Math.max((day.minutes / maxMinutes) * 72, 6) : 4,
                            backgroundColor: day.minutes > 0 ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{day.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* By exercise breakdown */}
              {stats.byExercise.length > 0 && (
                <div className="bg-muted rounded-2xl p-4">
                  <span className="text-sm font-semibold text-foreground mb-3 block">{t('breatheStatsPage.exerciseBreakdown')}</span>
                  <div className="space-y-3">
                    {stats.byExercise.map(({ exerciseId, count, totalSeconds }) => {
                      const exercise = exerciseMap.get(exerciseId);
                      if (!exercise) return null;
                      return (
                        <div key={exerciseId} className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center shrink-0">
                            <FluentEmoji emoji={exercise.emoji || '🌬️'} size={24} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{exercise.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {count} {count === 1 ? t('breatheStatsPage.sessionUnit') : t('breatheStatsPage.sessionUnitPlural')} · {Math.round(totalSeconds / 60)} {t('breatheStatsPage.minShort')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
