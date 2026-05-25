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
      startHref: `/app/routine/${r.routineId}`,
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