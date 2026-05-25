/**
 * My Rilo — Path scorer (Phase 3)
 *
 * Given the user's signals (mood, time-of-day, completion history, recency)
 * and a candidate pool of alternate PathSteps, produce a scored ranking
 * we can offer in the "Swap" sheet — and later feed to the Phase 4 AI as a
 * constraint so it doesn't hallucinate non-existent steps.
 *
 * All inputs are plain data; this file has no I/O.
 */

import type { PathStep, PathStepKind } from "./pathEngine";

export interface ScoringContext {
  /** Local hour 0-23. */
  hourOfDay: number;
  /** Most recent mood label, if logged today. */
  todayMood: "calm" | "happy" | "tired" | "stressed" | "sad" | "anxious" | null;
  /** Step ids the user completed in the last 7 days, with day-offset (0=today). */
  recentCompletions: Record<string, number>;
  /** Step ids dismissed/snoozed today — never re-suggest. */
  excludedIds: Set<string>;
  /** Step the user is swapping out of (so we don't offer it back). */
  replacingStepId: string;
}

/** Buckets for time-of-day fit. */
function bucketForHour(h: number): "morning" | "midday" | "afternoon" | "evening" {
  if (h < 11) return "morning";
  if (h < 14) return "midday";
  if (h < 18) return "afternoon";
  return "evening";
}

/** A step's natural time-of-day preference. */
function preferredBucket(kind: PathStepKind): ReturnType<typeof bucketForHour> | null {
  switch (kind) {
    case "mood":
      return "morning";
    case "breath":
      return null; // anytime
    case "quiz_pick":
      return null;
    case "routine":
      return null;
    case "community":
      return "evening";
    case "reward":
      return "evening";
  }
}

/** Affinity between a mood and a step kind. Values [-0.4, +0.6]. */
function moodAffinity(mood: ScoringContext["todayMood"], kind: PathStepKind): number {
  if (!mood) return 0;
  const table: Record<string, Partial<Record<PathStepKind, number>>> = {
    stressed: { breath: 0.6, mood: 0.2, routine: 0.1, community: -0.1 },
    anxious: { breath: 0.55, mood: 0.2, routine: 0.05 },
    sad: { mood: 0.4, community: 0.35, breath: 0.2 },
    tired: { breath: 0.4, routine: -0.2, quiz_pick: -0.1 },
    calm: { routine: 0.3, quiz_pick: 0.25, community: 0.15 },
    happy: { community: 0.4, routine: 0.3, quiz_pick: 0.2 },
  };
  return table[mood]?.[kind] ?? 0;
}

/**
 * Score a single candidate. Higher is better. Result is roughly in [-1, 2].
 * Weights (tweak here):
 *   - mood fit:          0.6
 *   - time-of-day fit:   0.5
 *   - novelty (recency): 0.4
 *   - intrinsic prior:   0.3
 */
export function scoreCandidate(step: PathStep, ctx: ScoringContext): number {
  if (ctx.excludedIds.has(step.id)) return -Infinity;
  if (step.id === ctx.replacingStepId) return -Infinity;

  let s = 0;

  // Mood fit
  s += 0.6 * moodAffinity(ctx.todayMood, step.kind);

  // Time-of-day fit
  const bucket = bucketForHour(ctx.hourOfDay);
  const pref = preferredBucket(step.kind);
  if (pref === null) s += 0.2; // flexible kinds always get a small bonus
  else if (pref === bucket) s += 0.5;
  else s -= 0.15;

  // Novelty: penalise things you did today, reward things you haven't done in a while
  const dayOff = ctx.recentCompletions[step.id];
  if (dayOff === 0) s -= 0.4;
  else if (dayOff === undefined) s += 0.4;
  else s += Math.min(0.3, dayOff * 0.05);

  // Intrinsic priors
  if (step.kind === "breath") s += 0.15;
  if (step.kind === "routine") s += 0.25;
  if (step.kind === "community") s += 0.1;

  // Penalty for very long steps when user looks tired
  if (ctx.todayMood === "tired" && step.estMinutes >= 10) s -= 0.2;

  return s;
}

/** Score and sort a candidate pool, dropping -Infinity entries. */
export function rankCandidates(pool: PathStep[], ctx: ScoringContext): Array<PathStep & { _score: number }> {
  return pool
    .map((c) => ({ ...c, _score: scoreCandidate(c, ctx) }))
    .filter((c) => Number.isFinite(c._score))
    .sort((a, b) => b._score - a._score);
}