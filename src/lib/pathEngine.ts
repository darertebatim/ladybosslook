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
  | "reset"
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
  /** Optional cover image URL — for playlist/track steps, used instead of emoji tile. */
  coverImageUrl?: string | null;
  /**
   * Optional starter-pool slot id. When set, tapping/dismissing this step
   * marks the slot as completed cross-day, removing it from the pool
   * permanently (until graduation to Standard flow).
   */
  poolSlot?: StarterPoolSlot;
}

/* ─── Starter pool model ─────────────────────────────────────────────── */

export type StarterPoolSlot =
  | "primary_signature"
  | "secondary_signature"
  | "primary_deeper"
  | "secondary_deeper"
  | "browse_routines"
  | "continue_routine"
  | "selfcare_quiz"
  | "planner_intro"
  | "featured_audio"
  | "secondary_audio";

const STARTER_POOL_KEY = "simora_starter_pool_completed";
const STARTER_POOL_SLOT_MAP_KEY = "simora_starter_pool_slot_map";

/** Read the cross-day set of completed pool slots. */
export function getStarterPoolCompleted(): Set<StarterPoolSlot> {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STARTER_POOL_KEY) : null;
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set((Array.isArray(arr) ? arr : []) as StarterPoolSlot[]);
  } catch {
    return new Set();
  }
}

/** Persist a slot as completed cross-day. */
export function markStarterPoolSlotCompleted(slot: StarterPoolSlot) {
  try {
    const set = getStarterPoolCompleted();
    if (set.has(slot)) return;
    set.add(slot);
    localStorage.setItem(STARTER_POOL_KEY, JSON.stringify([...set]));
  } catch {}
}

/** Look up a step's pool slot from the most recent build's id→slot map. */
export function getPoolSlotForStepId(stepId: string): StarterPoolSlot | null {
  try {
    const raw = typeof localStorage !== "undefined"
      ? localStorage.getItem(STARTER_POOL_SLOT_MAP_KEY) : null;
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, StarterPoolSlot>;
    return (map && typeof map === "object" ? map[stepId] : null) ?? null;
  } catch {
    return null;
  }
}

/** Snapshot the current pool's id→slot mapping so dismiss/tap can resolve it later. */
function persistPoolSlotMap(steps: PathStep[]) {
  try {
    const map: Record<string, StarterPoolSlot> = {};
    for (const s of steps) if (s.poolSlot) map[s.id] = s.poolSlot;
    localStorage.setItem(STARTER_POOL_SLOT_MAP_KEY, JSON.stringify(map));
  } catch {}
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
  /** Today's featured audio — either a single track or a playlist. */
  featuredAudio?: {
    kind: "track" | "playlist";
    id: string;
    title: string;
    coverEmoji?: string | null;
    coverImageUrl?: string | null;
    category?: string | null;
    /** "continue" = resume in-progress playlist; "smart_next" = follow-up to last completed; default = normal pick. */
    mode?: "continue" | "smart_next" | "default";
    /** If set, navigate to this specific track (used for Continue to resume). */
    resumeAudioId?: string | null;
  } | null;
  /** Secondary audio (non-educational): a playlist or standalone track. */
  secondaryAudio?: {
    kind: "track" | "playlist";
    id: string;
    title: string;
    coverEmoji?: string | null;
    coverImageUrl?: string | null;
    category?: string | null;
  } | null;
  /** Optional locked Plus playlist teaser for non-Plus users. */
  lockedTeaser?: {
    id: string;
    title: string;
    category?: string | null;
    coverImageUrl?: string | null;
  } | null;
  /** Today's featured reset (one of: a specific breathing exercise or reflection). */
  featuredReset?: {
    kind: "breath" | "reflection";
    id: string;
    title: string;
    emoji: string | null;
    category?: string | null;
  } | null;
  /** Rilo Doors onboarding picks. When `primary` is set, the door-aware
   *  builder runs instead of the legacy buildStandardPath. */
  doorContext?: {
    primary: DoorKey | null;
    secondary: DoorKey | null;
    emotionKeys: string[]; // raw picker keys (e.g. "lonely", "anxious")
    immigrantKeys: string[];
  } | null;
  /** 0-based days since signup, capped at 3 (Day 1 = 0). */
  daysSinceSignup?: number;
  /** True when user has finished the planner onboarding flow at least once. */
  plannerOnboardingDone?: boolean;
}

export type DoorKey = "emotion" | "selfcare" | "immigrant" | "productivity" | "exploring";

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

/* ─── Door-aware path ────────────────────────────────────────────────── */

/** "Browse routines" Day-1 step — always offered for new users. */
function browseRoutinesStep(): PathStep {
  return {
    id: "routine:pick_first",
    kind: "routine", ref: "pick_first",
    emoji: "✨", kicker: "Pick your first routine",
    title: "Browse routines", meta: "Open your Planner",
    estMinutes: 1, done: false,
    startHref: "/app/home", tint: "lavender", skippable: true,
  };
}

/** Self-Care Quiz teaser — used when self-care isn't a door pick. */
function selfcareQuizStep(): PathStep {
  return {
    id: "quiz_pick:onboarding",
    kind: "quiz_pick", ref: "onboarding",
    emoji: "🧠", kicker: "Self-care snapshot",
    title: "Take the 60-sec Self-Care Quiz",
    meta: "3 min · personalize your path",
    estMinutes: 3, done: false,
    startHref: "/app/onboarding/selfcare-quiz",
    tint: "peach", skippable: true,
  };
}

/** Planner / What-is-Rilo onboarding teaser. */
function plannerIntroStep(): PathStep {
  return {
    id: "quiz_pick:planner_intro",
    kind: "quiz_pick", ref: "planner_intro",
    emoji: "🗓️", kicker: "Get the Planner",
    title: "Rilo Planner onboarding",
    meta: "2 min · how the Planner works",
    estMinutes: 2, done: false,
    startHref: "/app/onboarding/what-is-rilo",
    tint: "sky", skippable: true,
  };
}

/** Featured-audio → PathStep (uses the same logic as buildStandardPath). */
function audioToStep(a: NonNullable<PathInputs["featuredAudio"]>, opts?: { kicker?: string; tint?: PathStep["tint"] }): PathStep {
  const isTrack = a.kind === "track";
  const mode = a.mode ?? "default";
  const kicker = opts?.kicker ?? (mode === "continue"
    ? a.category ? `Continue · ${a.category}` : "Continue listening"
    : mode === "smart_next"
      ? a.category ? `More like this · ${a.category}` : "Picked for you next"
      : a.category
        ? `${isTrack ? "Track" : "Playlist"} · ${a.category}`
        : isTrack ? "Today's track" : "Today's playlist");
  const href = a.resumeAudioId
    ? `/app/player/${a.resumeAudioId}`
    : isTrack ? `/app/player/${a.id}` : `/app/player/playlist/${a.id}`;
  return {
    id: `${isTrack ? "track" : "playlist"}:${a.id}`,
    kind: "playlist", ref: a.id,
    emoji: a.coverEmoji || (isTrack ? "🎵" : "🎧"),
    kicker, title: a.title,
    meta: mode === "continue" ? "Tap to resume" : isTrack ? "Tap to play · ~5 min" : "Tap to play",
    estMinutes: isTrack ? 5 : 10, done: false,
    startHref: href, tint: opts?.tint ?? "sky", skippable: true,
    coverImageUrl: a.coverImageUrl ?? null,
  };
}

/** Door-aware signature step (the "wow" of the day). */
function signatureStepForDoor(door: DoorKey, inputs: PathInputs): PathStep | null {
  switch (door) {
    case "selfcare":
      return inputs.hasQuizResult
        ? buildResetStep(inputs)
        : selfcareQuizStep();
    case "productivity":
      return inputs.plannerOnboardingDone
        ? browseRoutinesStep()
        : plannerIntroStep();
    case "immigrant":
    case "emotion":
    case "exploring":
      // These doors rely on the door-flavored featuredAudio computed upstream.
      return inputs.featuredAudio
        ? audioToStep(inputs.featuredAudio, {
            kicker:
              door === "immigrant" ? "Bilingual Strength" :
              door === "emotion" ? "For your emotions" :
              "Today's pick",
            tint: door === "emotion" ? "pink" : door === "immigrant" ? "lavender" : "sky",
          })
        : null;
  }
}

/**
 * Door-aware "deeper" / booster step — used for Day 2 primary booster and
 * Day 3 secondary deeper. Always returns something so the spec's
 * "keeps thread alive" promise holds for every door.
 */
function deeperStepForDoor(
  door: DoorKey,
  inputs: PathInputs,
  opts?: { kicker?: string; tint?: PathStep["tint"] }
): PathStep | null {
  switch (door) {
    case "selfcare":
      // Booster = quiz teaser if not yet done, else a door-flavored Check In.
      return inputs.hasQuizResult ? buildResetStep(inputs) : selfcareQuizStep();
    case "productivity":
      // Booster = planner onboarding if not done, else "pick a routine".
      return inputs.plannerOnboardingDone ? browseRoutinesStep() : plannerIntroStep();
    case "immigrant":
    case "emotion":
    case "exploring": {
      // Prefer secondaryAudio (fresh content); fall back to featuredAudio.
      const a = inputs.secondaryAudio ?? inputs.featuredAudio;
      if (!a) return null;
      return audioToStep(
        { ...a, mode: "default" },
        {
          kicker: opts?.kicker ?? (
            door === "immigrant" ? "More Bilingual Strength" :
            door === "emotion" ? "More for your emotions" :
            "More from your door"
          ),
          tint: opts?.tint ?? (door === "emotion" ? "pink" : door === "immigrant" ? "lavender" : "mint"),
        }
      );
    }
  }
}

/**
 * Door-aware path builder.
 *
 * Day 1 = primary signature + door-flavored reset + browse routines.
 * Day 2 = secondary signature + primary booster (audio).
 * Day 3 = habit cement (routine) + secondary deeper.
 *
 * Always injects:
 *  - Self-Care Quiz teaser when neither door is `selfcare` (and quiz not done).
 *  - Planner onboarding teaser when neither door is `productivity` (and not done).
 */
export function buildDoorPath(inputs: PathInputs): PathStep[] {
  // Legacy day-keyed builder. The runtime now goes through
  // `buildStarterPoolPath` (pool model) until graduation, then standard.
  // Retained for tests / fallback.
  const ctx = inputs.doorContext!;
  const day = Math.min(Math.max(inputs.daysSinceSignup ?? 0, 0), 2); // 0,1,2
  const steps: PathStep[] = [];

  const primary = ctx.primary;
  const secondary = ctx.secondary;

  // ── Mood check-in ──
  // Spec: Day 1 puts the primary signature first (the "wow"), then mood.
  // Day 2+ open with mood as the daily anchor.
  const moodStep: PathStep = {
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
  };
  if (day !== 0) steps.push(moodStep);

  // ── Hero by day ────────────────────────────────────────────────────
  if (day === 0) {
    // Day 1 — primary signature FIRST, then mood (spec: signature is the hero).
    const sig = primary ? signatureStepForDoor(primary, inputs) : null;
    if (sig) steps.push(sig);
    steps.push(moodStep);
    steps.push(buildResetStep(inputs));
  } else if (day === 1) {
    // Day 2 — secondary signature + primary booster + continue routine + check in
    const sec = secondary ? signatureStepForDoor(secondary, inputs) : null;
    if (sec) steps.push(sec);
    const primaryBooster = primary
      ? deeperStepForDoor(primary, inputs, { kicker: "More from your door", tint: "mint" })
      : null;
    if (primaryBooster && !steps.some((s) => s.id === primaryBooster.id)) {
      steps.push(primaryBooster);
    }
    steps.push(buildResetStep(inputs));
    // Continue the routine the user started on Day 1 (spec slot #6).
    const day2Routine = inputs.activeRoutines[0];
    if (day2Routine && !steps.some((s) => s.id === `routine:${day2Routine.routineId}`)) {
      steps.push({
        id: `routine:${day2Routine.routineId}`,
        kind: "routine", ref: day2Routine.routineId,
        emoji: day2Routine.emoji || "🔥",
        kicker: "Continue routine", title: day2Routine.title,
        meta: "Pick up where you left off", estMinutes: 5, done: false,
        startHref: "/app/home",
        tint: tintForRoutine(day2Routine.color, 0), skippable: true,
      });
    }
  } else {
    // Day 3 — habit cement: real routine if any, else browse + secondary deeper + audio
    const firstRoutine = inputs.activeRoutines[0];
    if (firstRoutine) {
      steps.push({
        id: `routine:${firstRoutine.routineId}`,
        kind: "routine", ref: firstRoutine.routineId,
        emoji: firstRoutine.emoji || "🔥",
        kicker: "Habit time", title: firstRoutine.title,
        meta: "Follow today's plan", estMinutes: 5, done: false,
        startHref: "/app/home",
        tint: tintForRoutine(firstRoutine.color, 0), skippable: true,
      });
    } else {
      steps.push(browseRoutinesStep());
    }
    // Secondary door deeper step — keeps the secondary thread alive (spec slot #3).
    const secondaryDeeper = secondary
      ? deeperStepForDoor(secondary, inputs, { kicker: "Keep your secondary alive" })
      : null;
    if (secondaryDeeper && !steps.some((s) => s.id === secondaryDeeper.id)) {
      steps.push(secondaryDeeper);
    }
    if (inputs.featuredAudio) steps.push(audioToStep(inputs.featuredAudio));
    steps.push(buildResetStep(inputs));
  }

  // ── Always present on Day 1: Browse routines (pick your first) ─────
  if (day === 0 && !steps.some((s) => s.id === "routine:pick_first")) {
    steps.push(browseRoutinesStep());
  }

  // ── Always-on teasers: quiz + planner onboarding when missing ──────
  const doors = new Set<DoorKey | null>([primary, secondary]);
  const hasSelfcareDoor = doors.has("selfcare");
  const hasProductivityDoor = doors.has("productivity");
  if (!hasSelfcareDoor && !inputs.hasQuizResult && !steps.some((s) => s.id === "quiz_pick:onboarding")) {
    steps.push(selfcareQuizStep());
  }
  // Planner onboarding teaser is intentionally deferred to Day 2+ so Day 1
  // isn't overwhelming (matches admin spec: "moved to Day 2").
  if (day >= 1 && !hasProductivityDoor && !inputs.plannerOnboardingDone && !steps.some((s) => s.id === "quiz_pick:planner_intro")) {
    steps.push(plannerIntroStep());
  }

  // Secondary audio as a low-commitment extra (Day 1 only — keeps Day 2+ focused).
  if (day === 0 && inputs.secondaryAudio) {
    const s = inputs.secondaryAudio;
    const isTrack = s.kind === "track";
    const id = `${isTrack ? "track" : "playlist"}:${s.id}`;
    if (!steps.some((x) => x.id === id)) {
      steps.push({
        id, kind: "playlist", ref: s.id,
        emoji: s.coverEmoji || (isTrack ? "🎵" : "🎧"),
        kicker: s.category ? `${isTrack ? "Track" : "Playlist"} · ${s.category}` : "Also for you",
        title: s.title,
        meta: isTrack ? "Tap to play · ~5 min" : "Tap to play",
        estMinutes: isTrack ? 5 : 10, done: false,
        startHref: isTrack ? `/app/player/${s.id}` : `/app/player/playlist/${s.id}`,
        tint: "lavender", skippable: true,
        coverImageUrl: s.coverImageUrl ?? null,
      });
    }
  }

  steps.push(rewardStep());
  return filterDismissed(steps, inputs.dismissedIds).slice(0, 8);
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

  steps.push(buildResetStep(inputs));

  steps.push({
    id: "routine:pick_first",
    kind: "routine",
    ref: "pick_first",
    emoji: "✨",
    kicker: "Pick your first routine",
    title: "Browse routines",
    meta: "Open your Planner",
    estMinutes: 1,
    done: false,
    startHref: "/app/home",
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

  // After mood: a ready-to-play playlist (priority placement).
  if (inputs.featuredAudio) {
    const a = inputs.featuredAudio;
    const isTrack = a.kind === "track";
    const mode = a.mode ?? "default";
    const kicker =
      mode === "continue"
        ? a.category ? `Continue · ${a.category}` : "Continue listening"
        : mode === "smart_next"
          ? a.category ? `More like this · ${a.category}` : "Picked for you next"
          : a.category
            ? `${isTrack ? "Track" : "Playlist"} · ${a.category}`
            : isTrack ? "Today's track" : "Today's playlist";
    const meta =
      mode === "continue"
        ? "Tap to resume"
        : isTrack ? "Tap to play · ~5 min" : "Tap to play";
    const href = a.resumeAudioId
      ? `/app/player/${a.resumeAudioId}`
      : isTrack
        ? `/app/player/${a.id}`
        : `/app/player/playlist/${a.id}`;
    steps.push({
      id: `${isTrack ? "track" : "playlist"}:${a.id}`,
      kind: "playlist", // reuse rendering bucket
      ref: a.id,
      emoji: a.coverEmoji || (isTrack ? "🎵" : "🎧"),
      kicker,
      title: a.title,
      meta,
      estMinutes: isTrack ? 5 : 10,
      done: false,
      startHref: href,
      tint: "sky",
      skippable: true,
      coverImageUrl: a.coverImageUrl ?? null,
    });
  }

  // Optional locked Plus teaser
  if (inputs.lockedTeaser) {
    const t = inputs.lockedTeaser;
    steps.push({
      id: `playlist:${t.id}`,
      kind: "playlist",
      ref: t.id,
      emoji: "🔒",
      kicker: t.category ? `Plus · ${t.category}` : "Plus · Preview",
      title: t.title,
      meta: "Unlock with Rilo Plus",
      estMinutes: 10,
      done: false,
      startHref: `/app/player/playlist/${t.id}`,
      tint: "lavender",
      skippable: true,
      coverImageUrl: t.coverImageUrl ?? null,
    });
  }

  steps.push(buildResetStep(inputs));

  // Show only the first active routine — it points to the Planner where
  // the user follows their day. Keeps the path short and focused.
  const firstRoutine = inputs.activeRoutines[0];
  if (firstRoutine) {
    steps.push({
      id: `routine:${firstRoutine.routineId}`,
      kind: "routine",
      ref: firstRoutine.routineId,
      emoji: firstRoutine.emoji || "🔥",
      kicker: "Open your Planner",
      title: firstRoutine.title,
      meta: "Follow today's plan",
      estMinutes: 5,
      done: false,
      startHref: "/app/home",
      tint: tintForRoutine(firstRoutine.color, 0),
      skippable: true,
    });
  }

  // Secondary audio pick: a non-educational playlist OR a standalone track
  // (sleep stories, meditations, soundscapes). Placed after the routine so
  // the educational hero gets focus; this is a low-commitment "later" option.
  if (inputs.secondaryAudio) {
    const s = inputs.secondaryAudio;
    const isTrack = s.kind === "track";
    steps.push({
      id: `${isTrack ? "track" : "playlist"}:${s.id}`,
      kind: "playlist",
      ref: s.id,
      emoji: s.coverEmoji || (isTrack ? "🎵" : "🎧"),
      kicker: s.category
        ? `${isTrack ? "Track" : "Playlist"} · ${s.category}`
        : isTrack ? "Quick listen" : "Also for you",
      title: s.title,
      meta: isTrack ? "Tap to play · ~5 min" : "Tap to play",
      estMinutes: isTrack ? 5 : 10,
      done: false,
      startHref: isTrack ? `/app/player/${s.id}` : `/app/player/playlist/${s.id}`,
      tint: "lavender",
      skippable: true,
      coverImageUrl: s.coverImageUrl ?? null,
    });
  }

  steps.push(rewardStep());

  return filterDismissed(steps, inputs.dismissedIds).slice(0, 8);
}

/**
 * Reset step: either a specific breathing exercise OR a specific reflection.
 * Picked upstream in useTodayPath (deterministic per day). Falls back to the
 * generic /app/breathe page if nothing pre-picked.
 */
function buildResetStep(inputs: PathInputs): PathStep {
  const r = inputs.featuredReset;
  if (!r) {
    return {
      id: "breath:default",
      kind: "reset", ref: "default",
      emoji: "🌬️", kicker: "Breathwork",
      title: "2-min reset breath", meta: "2 min · Calm pattern",
      estMinutes: 2, done: false,
      startHref: "/app/breathe", tint: "mint", skippable: true,
    };
  }
  if (r.kind === "breath") {
    return {
      id: `reset:breath:${r.id}`,
      kind: "reset", ref: r.id,
      emoji: r.emoji || "🌬️",
      kicker: r.category ? `Breathwork · ${r.category}` : "Breathwork",
      title: r.title, meta: "2–3 min · guided breath",
      estMinutes: 3, done: false,
      startHref: `/app/breathe?exercise=${r.id}`,
      tint: "mint", skippable: true,
    };
  }
  return {
    id: `reset:reflection:${r.id}`,
    kind: "reset", ref: r.id,
    emoji: r.emoji || "📓",
    kicker: r.category ? `Reflection · ${r.category}` : "Reflection",
    title: r.title, meta: "2 min · journal prompt",
    estMinutes: 2, done: false,
    startHref: `/app/reflections/${r.id}`,
    tint: "lavender", skippable: true,
  };
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
    startHref: "/app/breathe?exercise=4d0790d6-a696-4181-b9cf-8c3760f99533",
    tint: "sky", skippable: true,
  });
  pool.push({
    id: "breath:478",
    kind: "breath", ref: "478", emoji: "💤",
    kicker: "Breathwork", title: "4-7-8 · Wind-down breath",
    meta: "3 min · Calming", estMinutes: 3, done: false,
    startHref: "/app/breathe?exercise=fad4a7cf-6405-4a18-bf9c-9531c1866879",
    tint: "lavender", skippable: true,
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
      meta: "Open in Planner", estMinutes: 5, done: false,
      startHref: "/app/home",
      tint: tintForRoutine(r.color, idx), skippable: true,
    });
  });

  return pool;
}