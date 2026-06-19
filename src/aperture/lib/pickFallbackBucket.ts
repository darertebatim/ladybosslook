/**
 * Shared fallback bucket scorer — single source of truth for both:
 *   1. Memory page "Continue filling out your memory" card (single pick).
 *   2. Opener A chip ranking on memory_general chats (top-N).
 *
 * score(bucket):
 *   - has warm context → (1 - progress_pct) + 0.15
 *   - cold (no warm context, regardless of guesses) → 0.5
 * filter: target_count - count > 0   (skip filled buckets)
 *
 * Why the cold floor: on a fresh post-onboarding profile, every untouched
 * bucket would otherwise score 1.0 (progress=0, no bonus) and beat any
 * warm-but-partial bucket the user just answered. That cold-opens
 * dead-zone buckets like Partners/Competitors right after onboarding.
 * Pinning cold buckets at 0.5 lets warm-but-unfilled buckets (score
 * ≥ 0.15 + tiny remainder) win first, and falls back to cold buckets
 * only once the warm ones are full.
 *
 * Onboarding-mapped facts = anything in the bucket with a source other
 * than `ai_inferred_pre_onboarding` (pure guesses don't count as warm
 * context, so the AI never opens cold on Partners/Competitors and never
 * opens "warm" on a bucket that only has guesses).
 */

export type ScoreableBucket = {
  slug: string;
  title: string;
  target_count: number | null;
};

export type ScoreableItem = {
  bucket_slug: string | null;
  source: string;
};

export interface BucketScore {
  slug: string;
  title: string;
  score: number;
  progressPct: number;
  hasWarmContext: boolean;
  remaining: number;
}

function scoreOne(
  bucket: ScoreableBucket,
  items: ScoreableItem[],
): BucketScore {
  const target = Math.max(1, bucket.target_count ?? 8);
  const inBucket = items.filter(i => i.bucket_slug === bucket.slug);
  // Weighted count mirrors Memory.tsx: guesses count for 0.5.
  let count = 0;
  let hasWarmContext = false;
  for (const it of inBucket) {
    if (it.source === "ai_inferred_pre_onboarding") {
      count += 0.5;
    } else {
      count += 1;
      hasWarmContext = true;
    }
  }
  const progressPct = Math.min(1, count / target);
  const score = hasWarmContext
    ? (1 - progressPct) + 0.15
    : 0.5;
  return {
    slug: bucket.slug,
    title: bucket.title,
    score,
    progressPct,
    hasWarmContext,
    remaining: Math.max(0, target - count),
  };
}

/** All buckets ranked by score (highest = most useful to fill next). */
export function rankBuckets(
  buckets: ScoreableBucket[],
  items: ScoreableItem[],
): BucketScore[] {
  return buckets
    .map(b => scoreOne(b, items))
    .filter(s => s.remaining > 0)
    .sort((a, b) => b.score - a.score);
}

/** Top-N by score. Used to power Opener A's chip set. */
export function topNBuckets(
  buckets: ScoreableBucket[],
  items: ScoreableItem[],
  n = 4,
): BucketScore[] {
  return rankBuckets(buckets, items).slice(0, n);
}

/** Single best pick. Returns null if every bucket is filled. */
export function pickFallbackBucket(
  buckets: ScoreableBucket[],
  items: ScoreableItem[],
): BucketScore | null {
  const ranked = rankBuckets(buckets, items);
  return ranked[0] ?? null;
}