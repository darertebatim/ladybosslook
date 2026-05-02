import { useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useSelfCareBalance,
  CLUSTER_BAR_COLORS,
  getSuggestionFor,
} from '@/hooks/useSelfCareBalance';
import { getLocalDateStr } from '@/lib/localDate';
import { CLUSTER_LABELS, type ClusterType } from '@/utils/selfcare-scoring';
import { cn } from '@/lib/utils';

const CLUSTER_ORDER: ClusterType[] = ['body', 'mind', 'environment', 'people'];

export function SelfCareBalanceCard() {
  const navigate = useNavigate();
  const today = getLocalDateStr();
  // All-time window
  const start = '2000-01-01';
  const { data, isLoading } = useSelfCareBalance(start, today);

  const hasData = (data?.totalCompletions ?? 0) > 0;
  const maxCompletions = data
    ? Math.max(
        1,
        ...CLUSTER_ORDER.map((c) => data.clusters[c].completions),
      )
    : 1;

  return (
    <section className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-orange-900/60">
            Self-Care Balance
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            All time
          </p>
        </div>
        <button
          onClick={() => navigate('/app/balance')}
          className="flex items-center gap-0.5 text-sm font-medium text-muted-foreground active:scale-95 transition-transform min-h-[40px] px-1"
          aria-label="View all balance details"
        >
          View All <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {CLUSTER_ORDER.map((c) => (
            <Skeleton key={c} className="h-8 w-full" />
          ))}
        </div>
      ) : !hasData ? (
        <div className="py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Complete a few tasks to see your balance across Body, Mind,
            Environment & People.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {CLUSTER_ORDER.map((c) => {
              const bucket = data!.clusters[c];
              const widthPct = (bucket.completions / maxCompletions) * 100;
              return (
                <div key={c}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {CLUSTER_LABELS[c]}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                      {bucket.completions} {bucket.completions === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        CLUSTER_BAR_COLORS[c],
                      )}
                      style={{ width: `${bucket.completions > 0 ? Math.max(4, widthPct) : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {data?.weakestCluster && (
            <div className="mt-4 rounded-xl bg-amber-50 p-3 flex gap-2">
              <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-900 mb-0.5">
                  Suggestion for next week
                </p>
                <p className="text-xs text-amber-900/80 leading-snug">
                  {getSuggestionFor(data.weakestCluster)}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
