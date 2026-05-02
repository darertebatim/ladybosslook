import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/lib/haptics';
import { useTranslation } from 'react-i18next';
import { BackButton } from '@/components/app/BackButton';
import { SEOHead } from '@/components/SEOHead';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getLocalDateStr } from '@/lib/localDate';
import {
  useSelfCareBalance,
  useSelfCareBalanceTrend,
  CLUSTER_BAR_COLORS,
  CLUSTER_TEXT_COLORS,
  getSuggestionFor,
  SUGGESTION_CHIPS,
} from '@/hooks/useSelfCareBalance';
import {
  CLUSTER_LABELS,
  CLUSTER_EMOJIS,
  type ClusterType,
} from '@/utils/selfcare-scoring';

const CLUSTER_ORDER: ClusterType[] = ['body', 'mind', 'environment', 'people'];

function addDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return getLocalDateStr(d);
}

function formatRange(start: string, end: string): string {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${s.toLocaleDateString(undefined, opts)} – ${e.toLocaleDateString(undefined, opts)}`;
}

const AppBalance = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Week scrubber: rangeEnd is the latest day in the visible window
  const today = getLocalDateStr();
  const [rangeEnd, setRangeEnd] = useState(today);
  const rangeStart = useMemo(() => addDays(rangeEnd, -6), [rangeEnd]);

  const { data, isLoading } = useSelfCareBalance(rangeStart, rangeEnd);
  const { data: trend, isLoading: trendLoading } = useSelfCareBalanceTrend(4);

  const isCurrentWeek = rangeEnd === today;
  const hasData = (data?.totalCompletions ?? 0) > 0;

  const goPrev = () => setRangeEnd((r) => addDays(r, -7));
  const goNext = () => {
    const next = addDays(rangeEnd, 7);
    setRangeEnd(next > today ? today : next);
  };

  return (
    <>
      <SEOHead title={t('tier1.balance.title')} description={t('tier1.balance.seoDesc')} />

      <div className="flex flex-col h-dvh overflow-hidden bg-amber-50">
        <header
          className="shrink-0 relative z-10"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
        >
          <div className="px-4 py-2 flex items-center justify-between">
            <BackButton to="/app/presence" className="text-orange-700" />
            <h1 className="text-base font-semibold text-orange-900">
              {t('tier1.balance.title')}
            </h1>
            <div className="w-9" />
          </div>
        </header>

        <div
          className="flex-1 overflow-y-auto overscroll-contain px-4 pb-12 pt-2 space-y-4"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Week scrubber */}
          <div className="flex items-center justify-between bg-white rounded-2xl p-2 shadow-ios">
            <button
              onClick={goPrev}
              className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              aria-label={t('tier1.common.previousWeek')}
            >
              <ChevronLeft className="h-5 w-5 text-orange-700" />
            </button>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                {isCurrentWeek ? t('tier1.common.thisWeek') : formatRange(rangeStart, rangeEnd)}
              </p>
              {!isCurrentWeek && (
                <p className="text-[11px] text-muted-foreground">
                  {formatRange(rangeStart, rangeEnd)}
                </p>
              )}
            </div>
            <button
              onClick={goNext}
              disabled={isCurrentWeek}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-transform',
                isCurrentWeek ? 'opacity-30' : 'active:scale-95',
              )}
              aria-label={t('tier1.common.nextWeek')}
            >
              <ChevronRight className="h-5 w-5 text-orange-700" />
            </button>
          </div>

          {/* Big bar chart */}
          <section className="bg-white rounded-2xl p-4 shadow-ios">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-orange-900/60 uppercase tracking-wide">
                {t('tier1.balance.yourBalance')}
              </h2>
              {hasData && (
                <span className="text-xs text-muted-foreground">
                  {t('tier1.balance.completionsLabel', { n: data!.totalCompletions })}
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {CLUSTER_ORDER.map((c) => (
                  <Skeleton key={c} className="h-10 w-full" />
                ))}
              </div>
            ) : !hasData ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t('tier1.balance.noCompletions')}
              </p>
            ) : (
              <div className="space-y-4">
                {CLUSTER_ORDER.map((c) => {
                  const b = data!.clusters[c];
                  return (
                    <div key={c}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                          <span aria-hidden>{CLUSTER_EMOJIS[c]}</span>
                          {CLUSTER_LABELS[c]}
                        </span>
                        <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                          {b.score}% · {t('tier1.balance.doneCount', { n: b.completions })}
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            CLUSTER_BAR_COLORS[c],
                          )}
                          style={{ width: `${Math.max(2, b.score)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Suggestion */}
          {hasData && data?.weakestCluster && (
            <section className="rounded-2xl bg-amber-100/70 p-4 flex gap-3">
              <Sparkles className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-950 mb-1">
                  {t('tier1.balance.suggestionTitle')}
                </p>
                <p className="text-sm text-amber-950/80 leading-snug">
                  {getSuggestionFor(data.weakestCluster)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SUGGESTION_CHIPS[data.weakestCluster].map((chip) => (
                    <button
                      key={chip.slug}
                      onClick={() => {
                        haptic.light();
                        navigate(`/app/tasksbank/${chip.slug}`);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-sm font-semibold text-amber-950 shadow-ios active:scale-95 transition-transform min-h-[40px]"
                    >
                      <span aria-hidden>{chip.emoji}</span>
                      <span>{chip.label}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-amber-700/70" />
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Per-cluster task breakdown */}
          {hasData && (
            <section className="bg-white rounded-2xl p-4 shadow-ios">
              <h2 className="text-sm font-semibold text-orange-900/60 uppercase tracking-wide mb-3">
                {t('tier1.balance.whatYouDid')}
              </h2>
              <div className="space-y-4">
                {CLUSTER_ORDER.map((c) => {
                  const b = data!.clusters[c];
                  const tasks = Object.entries(b.byTask).sort(
                    (a, b) => b[1].count - a[1].count,
                  );
                  if (tasks.length === 0) return null;
                  return (
                    <div key={c}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span aria-hidden>{CLUSTER_EMOJIS[c]}</span>
                        <span
                          className={cn(
                            'text-sm font-semibold',
                            CLUSTER_TEXT_COLORS[c],
                          )}
                        >
                          {CLUSTER_LABELS[c]}
                        </span>
                      </div>
                      <div className="space-y-1.5 pl-1">
                        {tasks.map(([title, info]) => (
                          <div
                            key={title}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-foreground truncate flex-1">
                              {info.emoji ? `${info.emoji} ` : ''}
                              {title}
                            </span>
                            <span className="text-muted-foreground tabular-nums ml-2">
                              ×{info.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {CLUSTER_ORDER.every(
                  (c) => Object.keys(data!.clusters[c].byTask).length === 0,
                ) && (
                  <p className="text-sm text-muted-foreground">
                    {t('tier1.balance.noTagged')}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* 4-week trend sparklines */}
          <section className="bg-white rounded-2xl p-4 shadow-ios">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-orange-700" />
              <h2 className="text-sm font-semibold text-orange-900/60 uppercase tracking-wide">
                {t('tier1.balance.fourWeekTrend')}
              </h2>
            </div>

            {trendLoading ? (
              <div className="space-y-3">
                {CLUSTER_ORDER.map((c) => (
                  <Skeleton key={c} className="h-10 w-full" />
                ))}
              </div>
            ) : !trend || trend.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('tier1.balance.noTrend')}</p>
            ) : (
              <div className="space-y-3">
                {CLUSTER_ORDER.map((c) => (
                  <div key={c}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground">
                        {CLUSTER_LABELS[c]}
                      </span>
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {t('tier1.balance.nowSuffix', { pct: trend[trend.length - 1].scores[c] })}
                      </span>
                    </div>
                    <div className="flex items-end gap-1 h-10">
                      {trend.map((week, i) => {
                        const v = week.scores[c];
                        const h = Math.max(4, (v / 100) * 40);
                        const isLatest = i === trend.length - 1;
                        return (
                          <div
                            key={week.weekStart}
                            className="flex-1 flex flex-col items-center justify-end gap-0.5"
                          >
                            <div
                              className={cn(
                                'w-full rounded-sm',
                                CLUSTER_BAR_COLORS[c],
                                !isLatest && 'opacity-50',
                              )}
                              style={{ height: `${h}px` }}
                              title={`Week of ${week.weekStart}: ${v}%`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <p className="text-[11px] text-muted-foreground text-center pt-1">
                  {t('tier1.balance.oldestNewest')}
                </p>
              </div>
            )}
          </section>

          {/* Scoring legend */}
          <p className="text-[11px] text-muted-foreground text-center px-4 pt-2">
            {t('tier1.balance.scoreLegend')}
          </p>
        </div>
      </div>
    </>
  );
};

export default AppBalance;
