import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getLocalDateStr } from '@/lib/localDate';
import {
  mapTaskToCluster,
  CLUSTER_LABELS,
  type ClusterType,
} from '@/utils/selfcare-scoring';

// Activity-level scoring: 10+ completions in a cluster within the window = 100%.
const SCORE_PER_COMPLETION = 10;

export interface ClusterBreakdown {
  cluster: ClusterType;
  label: string;
  completions: number;
  /** 0–100 activity level */
  score: number;
  /** Per-tag counts (e.g. { sleep: 3, movement: 5 }) */
  byTag: Record<string, number>;
  /** Per-task counts: { taskTitle: { count, emoji } } */
  byTask: Record<string, { count: number; emoji: string | null }>;
}

export interface SelfCareBalance {
  rangeStart: string; // YYYY-MM-DD
  rangeEnd: string;   // YYYY-MM-DD
  totalCompletions: number;
  clusters: Record<ClusterType, ClusterBreakdown>;
  /** Cluster with the lowest score (for suggestion). Null if no data. */
  weakestCluster: ClusterType | null;
  /** Cluster with the highest score. Null if no data. */
  strongestCluster: ClusterType | null;
}

const EMPTY_BREAKDOWN = (cluster: ClusterType): ClusterBreakdown => ({
  cluster,
  label: CLUSTER_LABELS[cluster],
  completions: 0,
  score: 0,
  byTag: {},
  byTask: {},
});

function buildEmpty(rangeStart: string, rangeEnd: string): SelfCareBalance {
  return {
    rangeStart,
    rangeEnd,
    totalCompletions: 0,
    clusters: {
      body: EMPTY_BREAKDOWN('body'),
      mind: EMPTY_BREAKDOWN('mind'),
      environment: EMPTY_BREAKDOWN('environment'),
      people: EMPTY_BREAKDOWN('people'),
    },
    weakestCluster: null,
    strongestCluster: null,
  };
}

/**
 * Returns the YYYY-MM-DD start date for a window ending today (inclusive),
 * spanning `days` days back. e.g. days=7 → last 7 calendar days including today.
 */
export function getWindowStart(days: number, end: Date = new Date()): string {
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  return getLocalDateStr(start);
}

/**
 * Fetches Self-Care Balance for an arbitrary date range.
 * Uses Activity Level scoring: score = min(100, completions * 10).
 */
export function useSelfCareBalance(
  rangeStart: string,
  rangeEnd: string,
  enabled = true,
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['selfcare-balance', user?.id, rangeStart, rangeEnd],
    enabled: enabled && !!user?.id,
    staleTime: 60_000,
    queryFn: async (): Promise<SelfCareBalance> => {
      if (!user?.id) return buildEmpty(rangeStart, rangeEnd);

      // Fetch task_completions joined to user_tasks for tag + title + emoji
      const { data, error } = await supabase
        .from('task_completions')
        .select('task_id, completed_date, user_tasks!inner(tag, title, emoji)')
        .eq('user_id', user.id)
        .gte('completed_date', rangeStart)
        .lte('completed_date', rangeEnd);

      if (error) throw error;

      const result = buildEmpty(rangeStart, rangeEnd);

      for (const row of data ?? []) {
        // user_tasks may come back as object or array depending on PostgREST
        const ut = Array.isArray((row as any).user_tasks)
          ? (row as any).user_tasks[0]
          : (row as any).user_tasks;
        if (!ut) continue;
        const cluster = mapTaskToCluster(ut.tag);
        if (!cluster) continue;

        const bucket = result.clusters[cluster];
        bucket.completions += 1;
        result.totalCompletions += 1;

        const tagKey = ut.tag ?? 'unknown';
        bucket.byTag[tagKey] = (bucket.byTag[tagKey] ?? 0) + 1;

        const titleKey = ut.title ?? 'Untitled';
        const existing = bucket.byTask[titleKey];
        if (existing) {
          existing.count += 1;
        } else {
          bucket.byTask[titleKey] = { count: 1, emoji: ut.emoji ?? null };
        }
      }

      // Compute scores
      let weakest: ClusterType | null = null;
      let strongest: ClusterType | null = null;
      let weakestScore = Infinity;
      let strongestScore = -1;
      (Object.keys(result.clusters) as ClusterType[]).forEach((c) => {
        const b = result.clusters[c];
        b.score = Math.min(100, b.completions * SCORE_PER_COMPLETION);
        if (b.score < weakestScore) {
          weakestScore = b.score;
          weakest = c;
        }
        if (b.score > strongestScore) {
          strongestScore = b.score;
          strongest = c;
        }
      });

      // Only surface weakest/strongest if there's any data at all
      if (result.totalCompletions > 0) {
        result.weakestCluster = weakest;
        result.strongestCluster = strongest;
      }

      return result;
    },
  });
}

/**
 * Convenience: fetch the last N weeks as separate balances (for trend sparklines).
 * Returns oldest → newest.
 */
export function useSelfCareBalanceTrend(weeks = 4) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['selfcare-balance-trend', user?.id, weeks],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      if (!user?.id) return [];

      const today = new Date();
      // Range covers the full window (weeks * 7 days)
      const totalDays = weeks * 7;
      const rangeStart = getWindowStart(totalDays, today);
      const rangeEnd = getLocalDateStr(today);

      const { data, error } = await supabase
        .from('task_completions')
        .select('completed_date, user_tasks!inner(tag)')
        .eq('user_id', user.id)
        .gte('completed_date', rangeStart)
        .lte('completed_date', rangeEnd);

      if (error) throw error;

      // Bucket per week (week 0 = oldest, week weeks-1 = current)
      const buckets: Array<Record<ClusterType, number>> = Array.from(
        { length: weeks },
        () => ({ body: 0, mind: 0, environment: 0, people: 0 }),
      );
      const weekStarts: string[] = [];
      for (let w = 0; w < weeks; w++) {
        const start = new Date(today);
        start.setDate(start.getDate() - ((weeks - 1 - w) * 7 + 6));
        weekStarts.push(getLocalDateStr(start));
      }

      for (const row of data ?? []) {
        const ut = Array.isArray((row as any).user_tasks)
          ? (row as any).user_tasks[0]
          : (row as any).user_tasks;
        if (!ut) continue;
        const cluster = mapTaskToCluster(ut.tag);
        if (!cluster) continue;

        // Determine which week bucket this completion falls into
        const completedDate = new Date((row as any).completed_date + 'T00:00:00');
        const diffDays = Math.floor(
          (today.getTime() - completedDate.getTime()) / 86400000,
        );
        const weekIdx = weeks - 1 - Math.floor(diffDays / 7);
        if (weekIdx < 0 || weekIdx >= weeks) continue;
        buckets[weekIdx][cluster] += 1;
      }

      return buckets.map((b, i) => ({
        weekStart: weekStarts[i],
        scores: {
          body: Math.min(100, b.body * SCORE_PER_COMPLETION),
          mind: Math.min(100, b.mind * SCORE_PER_COMPLETION),
          environment: Math.min(100, b.environment * SCORE_PER_COMPLETION),
          people: Math.min(100, b.people * SCORE_PER_COMPLETION),
        } as Record<ClusterType, number>,
        completions: b,
      }));
    },
  });
}

export const CLUSTER_BAR_COLORS: Record<ClusterType, string> = {
  body: 'bg-orange-500',
  mind: 'bg-purple-500',
  environment: 'bg-amber-500',
  people: 'bg-emerald-600',
};

export const CLUSTER_TEXT_COLORS: Record<ClusterType, string> = {
  body: 'text-orange-600',
  mind: 'text-purple-600',
  environment: 'text-amber-600',
  people: 'text-emerald-700',
};

export function getSuggestionFor(cluster: ClusterType): string {
  switch (cluster) {
    case 'body':
      return 'Add one Body moment this week — sleep, water, or a short walk.';
    case 'mind':
      return 'Try one mindful pause — a breath, a gratitude note, or a calm minute.';
    case 'environment':
      return 'Add one tidy-up or evening ritual — your Environment score has been quiet.';
    case 'people':
      return 'Reach out to someone — a text, a call, or a small kindness.';
  }
}
