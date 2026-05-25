/**
 * My Rilo — Path engine (Phase 1)
 *
 * Pure helpers + types. Given today's data (mood log, routines, quiz,
 * dismissals), returns an ordered list of `PathStep` for the screen.
 * Time-of-day buckets are implicit: completed steps render in "Morning",
 * the first non-completed step is the "Right now" hero, the rest are "Later".
 */

export type PathStepKind =
  | "mood"
  | "breath"
  | "quiz_pick"
  | "routine"
  | "community"
  | "playlist"
  | "reward";

export interface PathStep {
  /** Stable identifier for dismissals: `${kind}:${ref}`. */
  id: string;
  kind: PathStepKind;
  /** Identifier within the kind (routine_id, "default", etc.). */
  ref: string;
  emoji: string;
  /** One-line kicker / category. */
  kicker: string;
  /** Main title. */
  title: string;
  /** Secondary one-liner (duration · subtitle). */
  meta: string;
  /** Estimated minutes (for header total). */
  estMinutes: number;
  /** Already complete today. */
  done: boolean;
  /** Route to navigate when user taps Start. */
  startHref: string;
  /** Tint key — maps to PathStep accent. */
  tint: "yellow" | "mint" | "peach" | "lavender" | "pink" | "sky";
  /** Allow Skip action. Reward is never skippable. */
  skippable?: boolean;
}

export interface PathInputs {
  hasMoodTodayLog: boolean;
  hasQuizResult: boolean;
  quizTopCategory: string | null;
  activeRoutines: Array<{
    routineId: string;
    title: string;
    emoji: string | null;
    color: string | null;
  }>;
  /** Set of dismissed step ids for today. */
  dismissedIds: Set<string>;
  /** True when user has no routines AND no quiz result. */
  isDayOne: boolean;
  /** Today's featured playlist (picked deterministically by the engine). */
  featuredPlaylist?: {
    id: string;
    name: string;
    coverEmoji?: string | null;
    category?: string | null;
  } | null;
}

const TINT_BY_COLOR: Record<string, PathStep["tint"]> = {
  yellow: "yellow",
  mint: "mint",
  peach: "peach",
  lavender: "lavender",
  pink: "pink",
  sky: "sky",
  lime: "mint",
};

function tintForRoutine(color: string | null | undefined, idx: number): PathStep["tint"] {
  if (color && TINT_BY_COLOR[color]) return TINT_BY_COLOR[color];
  const cycle: PathStep["tint"][] = ["peach", "lavender", "mint", "sky", "pink", "yellow"];
  return cycle[idx % cycle.length];
}

/** Day-1 starter path for brand-new users (no routines + no quiz). */
export function buildDayOnePath(inputs: PathInputs): PathStep[] {
  const steps: PathStep[] = [];

  steps.push({
    id: "quiz_pick:onboarding",
    kind: "quiz_pick",
    ref: "onboarding",
    emoji: "🧠",
    kicker: "Start here",
    title: "Take the 60-second Self-Care Quiz",
    meta: "3 min · personalize your path",
    estMinutes: 3,
    done: false,
    startHref: "/app/onboarding/selfcare-quiz",
    tint: "peach",
    skippable: false,
  });

  steps.push({
    id: "breath:default",
    kind: "breath",
    ref: "default",
    emoji: "🌬️",
    kicker: "Breathwork",
    title: "2-min reset breath",
    meta: "2 min · Calm pattern",
    estMinutes: 2,
    done: false,
    startHref: "/app/breathe",
    tint: "mint",
    skippable: true,
  });

  steps.push({
    id: "routine:pick_first",
    kind: "routine",
    ref: "pick_first",
    emoji: "✨",
    kicker: "Pick your first routine",
    title: "Browse routines",
    meta: "1 min · Morning Reset · New Mom · Anxiety…",
    estMinutes: 1,
    done: false,
    startHref: "/app/tools/tasks",
    tint: "lavender",
    skippable: false,
  });

  steps.push(rewardStep());

  return filterDismissed(steps, inputs.dismissedIds);
}

/** Standard path: mood → breath → quiz pick → routines → reward. */
export function buildStandardPath(inputs: PathInputs): PathStep[] {
  const steps: PathStep[] = [];

  steps.push({
    id: "mood:today",
    kind: "mood",
    ref: "today",
    emoji: "💛",
    kicker: "Mood check-in",
    title: inputs.hasMoodTodayLog ? "Mood logged" : "How are you feeling?",
    meta: inputs.hasMoodTodayLog ? "1 min · done" : "1 min · pick your mood",
    estMinutes: 1,
    done: inputs.hasMoodTodayLog,
    startHref: "/app/mood",
    tint: "yellow",
    skippable: !inputs.hasMoodTodayLog,
  });

  steps.push({
    id: "breath:default",
    kind: "breath",
    ref: "default",
    emoji: "🌬️",
    kicker: "Breathwork",
    title: "2-min reset breath",
    meta: "2 min · Calm pattern",
    estMinutes: 2,
    done: false,
    startHref: "/app/breathe",
    tint: "mint",
    skippable: true,
  });

  if (inputs.hasQuizResult && inputs.quizTopCategory) {
    steps.push({
      id: `quiz_pick:${inputs.quizTopCategory}`,
      kind: "quiz_pick",
      ref: inputs.quizTopCategory,
      emoji: "🧠",
      kicker: "Rilo picked from your quiz",
      title: humanizeCategory(inputs.quizTopCategory),
      meta: "5 min · Self-care",
      estMinutes: 5,
      done: false,
      startHref: "/app/tools/tasks",
      tint: "peach",
      skippable: true,
    });
  }

  inputs.activeRoutines.forEach((r, idx) => {
    steps.push({
      id: `routine:${r.routineId}`,
      kind: "routine",
      ref: r.routineId,
      emoji: r.emoji || "🔥",
      kicker: "Your routine",
      title: r.title,
      meta: "today's pick",
      estMinutes: 5,
      done: false,
      startHref: `/app/routines/${r.routineId}`,
      tint: tintForRoutine(r.color, idx),
      skippable: true,
    });
  });

  steps.push(rewardStep());

  return filterDismissed(steps, inputs.dismissedIds).slice(0, 8);
}

function rewardStep(): PathStep {
  return {
    id: "reward:end",
    kind: "reward",
    ref: "end",
    emoji: "🏆",
    kicker: "End of path",
    title: "+1 day streak & a new affirmation",
    meta: "Finish the path",
    estMinutes: 0,
    done: false,
    startHref: "/app/presence",
    tint: "peach",
    skippable: false,
  };
}

function filterDismissed(steps: PathStep[], dismissed: Set<string>): PathStep[] {
  return steps.filter((s) => !dismissed.has(s.id));
}

function humanizeCategory(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

/** Compute totals + active index for header rendering. */
export function summarizePath(steps: PathStep[]): {
  total: number;
  doneCount: number;
  activeIndex: number;
  totalMinutes: number;
} {
  const nonReward = steps.filter((s) => s.kind !== "reward");
  const total = nonReward.length;
  const doneCount = nonReward.filter((s) => s.done).length;
  const activeIndex = nonReward.findIndex((s) => !s.done);
  const totalMinutes = nonReward.reduce((sum, s) => sum + s.estMinutes, 0);
  return { total, doneCount, activeIndex, totalMinutes };
}

/**
 * Build the alternate-candidate pool used by the Swap sheet. These are
 * extra PathStep options the user can pick in place of a current step.
 * The pool intentionally over-produces — the scorer (pathScorer.ts) ranks
 * and trims the list before display.
 */
export function buildCandidatePool(inputs: PathInputs): PathStep[] {
  const pool: PathStep[] = [];

  // Breath alternates
  pool.push({
    id: "breath:box4",
    kind: "breath", ref: "box4", emoji: "🟦",
    kicker: "Breathwork", title: "Box breathing · 4-4-4-4",
    meta: "4 min · Focus pattern", estMinutes: 4, done: false,
    startHref: "/app/breathe", tint: "sky", skippable: true,
  });
  pool.push({
    id: "breath:478",
    kind: "breath", ref: "478", emoji: "💤",
    kicker: "Breathwork", title: "4-7-8 · Wind-down breath",
    meta: "3 min · Calming", estMinutes: 3, done: false,
    startHref: "/app/breathe", tint: "lavender", skippable: true,
  });

  // Reflection / journaling
  pool.push({
    id: "quiz_pick:reflect",
    kind: "quiz_pick", ref: "reflect", emoji: "📓",
    kicker: "Reflection", title: "60-sec journal",
    meta: "1 min · One sentence is enough", estMinutes: 1, done: false,
    startHref: "/app/tools/reflections", tint: "peach", skippable: true,
  });

  // Listen alternates
  pool.push({
    id: "quiz_pick:listen",
    kind: "quiz_pick", ref: "listen", emoji: "🎧",
    kicker: "Listen", title: "A calm 5-min playlist",
    meta: "5 min · Reset audio", estMinutes: 5, done: false,
    startHref: "/app/player", tint: "mint", skippable: true,
  });

  // Community check-in
  pool.push({
    id: "community:peek",
    kind: "community", ref: "peek", emoji: "💬",
    kicker: "Community", title: "Peek at today's check-ins",
    meta: "2 min · You're not alone", estMinutes: 2, done: false,
    startHref: "/app/channels", tint: "pink", skippable: true,
  });

  // Mood
  if (!inputs.hasMoodTodayLog) {
    pool.push({
      id: "mood:today",
      kind: "mood", ref: "today", emoji: "💛",
      kicker: "Mood check-in", title: "How are you feeling?",
      meta: "1 min · pick your mood", estMinutes: 1, done: false,
      startHref: "/app/mood", tint: "yellow", skippable: true,
    });
  }

  // Each routine the user owns (in case they want to swap one for another)
  inputs.activeRoutines.forEach((r, idx) => {
    pool.push({
      id: `routine:${r.routineId}`,
      kind: "routine", ref: r.routineId,
      emoji: r.emoji || "🔥",
      kicker: "Your routine", title: r.title,
      meta: "today's pick", estMinutes: 5, done: false,
      startHref: `/app/routines/${r.routineId}`,
      tint: tintForRoutine(r.color, idx), skippable: true,
    });
  });

  return pool;
}