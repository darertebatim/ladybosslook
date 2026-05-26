import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getLocalDateStr } from "@/lib/localDate";
import {
  buildDayOnePath,
  buildStandardPath,
  buildCandidatePool,
  summarizePath,
  type PathStep,
} from "@/lib/pathEngine";
import { rankCandidates, type ScoringContext } from "@/lib/pathScorer";
import { useUserPreferredLanguage } from "@/hooks/useUserPreferredLanguage";
import { useSubscription } from "@/hooks/useSubscription";

interface TodayPathResult {
  steps: PathStep[];
  isDayOne: boolean;
  summary: ReturnType<typeof summarizePath>;
  streak: number;
  /** Pool of alternate candidates for the Swap sheet. Already scored. */
  candidatesFor: (step: PathStep) => Array<PathStep & { _score: number }>;
}

export function useTodayPath() {
  const { user } = useAuth();
  const preferredLanguage = useUserPreferredLanguage();
  const { isSubscribed } = useSubscription();
  const today = getLocalDateStr();
  const nowIso = new Date().toISOString();
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getLocalDateStr(d);
  })();

  return useQuery<TodayPathResult>({
    queryKey: ["today-path", user?.id, today, preferredLanguage, isSubscribed],
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async () => {
      const userId = user!.id;

      // Fire all source queries in parallel.
      const [moodRes, quizRes, routinesRes, dismissalsRes, streakRes, actionsRes] = await Promise.all([
        supabase
          .from("emotion_logs")
          .select("id, valence, created_at")
          .eq("user_id", userId)
          .eq("category", "mood_checkin")
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("selfcare_quiz_results")
          .select("gap_categories")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("user_routines_bank")
          .select("routine_id, title, emoji, color, added_at")
          .eq("user_id", userId)
          .eq("is_active", true)
          .order("added_at", { ascending: true })
          .limit(4),
        supabase
          .from("path_dismissals")
          .select("step_kind, step_ref")
          .eq("user_id", userId)
          .eq("dismissed_date", today),
        supabase
          .from("user_streaks")
          .select("current_streak")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("path_step_actions")
          .select("action, step_kind, step_ref, effective_until, swap_target, created_at")
          .eq("user_id", userId),
      ]);

      // ── Audio picker ────────────────────────────────────────────────────
      // Pull playlists + hot tracks. Free-first for non-Plus users; Plus users
      // see everything. Pick category by mood/time/quiz; alternate track vs
      // playlist by daily seed so the user sees variety.
      const [playlistRes, hotTracksRes] = await Promise.all([
        supabase
          .from("audio_playlists")
          .select("id, name, category, cover_image_url, language, requires_subscription")
          .eq("available_on_mobile", true)
          .eq("is_hidden", false)
          .order("sort_order", { ascending: true })
          .limit(60),
        (() => {
          let q = supabase
            .from("audio_content")
            .select("id, title, cover_image_url, is_free, is_hot, category, sort_order")
            .eq("is_hot", true)
            .order("sort_order", { ascending: true })
            .limit(30);
          if (!isSubscribed) q = q.eq("is_free", true);
          return q;
        })(),
      ]);
      const allPlaylists = (playlistRes.data ?? []) as Array<{
        id: string; name: string; category: string | null;
        language: string | null; requires_subscription: boolean | null;
      }>;
      const hotTracks = (hotTracksRes.data ?? []) as Array<{
        id: string; title: string; category: string | null;
      }>;
      const accessiblePlaylists = isSubscribed
        ? allPlaylists
        : allPlaylists.filter((p) => !p.requires_subscription);

      // Featured reset: pick ONE of {breathing exercise, reflection} per day.
      // Deterministic by date so it's stable within the day, rotates tomorrow.
      const [breathRes, reflectionRes] = await Promise.all([
        supabase
          .from("breathing_exercises")
          .select("id, name, category, emoji")
          .eq("is_active", true)
          .eq("is_premium", false)
          .order("sort_order", { ascending: true })
          .limit(50),
        supabase
          .from("reflections")
          .select("id, title, category, emoji")
          .eq("is_active", true)
          .eq("is_free", true)
          .order("sort_order", { ascending: true })
          .limit(50),
      ]);
      const breaths = breathRes.data ?? [];
      const reflections = reflectionRes.data ?? [];
      // Deterministic day seed (YYYYMMDD as int)
      const seed = parseInt(today.replace(/-/g, ""), 10) || 0;
      // Alternate kind by parity of seed so user sees variety
      const useBreath = seed % 2 === 0 ? breaths.length > 0 : reflections.length === 0;
      let featuredReset: {
        kind: "breath" | "reflection"; id: string; title: string;
        emoji: string | null; category: string | null;
      } | null = null;
      if (useBreath && breaths.length > 0) {
        const b = breaths[seed % breaths.length] as any;
        featuredReset = { kind: "breath", id: b.id, title: b.name, emoji: b.emoji, category: b.category };
      } else if (reflections.length > 0) {
        const r = reflections[seed % reflections.length] as any;
        featuredReset = { kind: "reflection", id: r.id, title: r.title, emoji: r.emoji, category: r.category };
      }

      const moodLatest = (moodRes.data ?? [])[0] as
        | { id: string; valence: string | null; created_at: string | null }
        | undefined;
      const hasMoodTodayLog =
        !!moodLatest?.created_at &&
        new Date(moodLatest.created_at).toISOString().slice(0, 10) === today;

      // Map valence → coarse mood label used by the scorer.
      const valenceToMood: Record<string, ScoringContext["todayMood"]> = {
        positive: "happy",
        very_positive: "happy",
        calm: "calm",
        neutral: "calm",
        low: "sad",
        very_low: "sad",
        negative: "stressed",
        anxious: "anxious",
        tired: "tired",
      };
      const recentMoodLabel = hasMoodTodayLog && moodLatest?.valence
        ? (valenceToMood[moodLatest.valence] ?? null)
        : null;

      // ── Pick featured audio (track OR playlist) using mood / time / quiz ──
      const hourNow = new Date().getHours();
      let intentCategory: string | null = null;
      let preferTrack = false;
      if (recentMoodLabel === "tired" || hourNow >= 20 || hourNow < 6) {
        intentCategory = "sleepstory"; preferTrack = true;
      } else if (["anxious", "stressed", "sad"].includes(recentMoodLabel ?? "")) {
        intentCategory = "meditate"; preferTrack = true;
      } else if (hourNow >= 6 && hourNow < 11) {
        intentCategory = "soundscape";
      }
      const quizGapsRaw = (quizRes.data?.gap_categories as string[] | null) ?? null;
      const topGap = quizGapsRaw && quizGapsRaw.length > 0 ? quizGapsRaw[0] : null;
      if (!intentCategory && topGap) {
        const map: Record<string, string> = {
          sleep: "sleepstory", rest: "sleepstory",
          calm: "meditate", stress: "meditate", mindfulness: "meditate", anxiety: "meditate",
          focus: "soundscape", energy: "soundscape",
        };
        const m = map[topGap];
        if (m) { intentCategory = m; preferTrack = m !== "soundscape"; }
      }
      // Daily rotation: even days lean track, odd days lean playlist
      const trackByRotation = seed % 2 === 0;
      const useTrack = (preferTrack || trackByRotation) && hotTracks.length > 0;

      type FeaturedAudio =
        | { kind: "track"; id: string; title: string; category: string | null; coverEmoji: string | null }
        | { kind: "playlist"; id: string; title: string; category: string | null; coverEmoji: string | null };
      let featuredAudio: FeaturedAudio | null = null;

      if (useTrack) {
        // Hot tracks don't carry the playlist's mood category, so just rotate
        // deterministically. Admin curates this list.
        const t = hotTracks[seed % hotTracks.length];
        featuredAudio = { kind: "track", id: t.id, title: t.title, category: t.category, coverEmoji: null };
      } else {
        const matched = intentCategory
          ? accessiblePlaylists.filter((p) => p.category === intentCategory)
          : [];
        const pool = matched.length ? matched : accessiblePlaylists;
        const preferred = preferredLanguage
          ? pool.find((p) => p.language === preferredLanguage)
          : null;
        const picked = preferred ?? pool[seed % Math.max(pool.length, 1)] ?? pool[0] ?? null;
        if (picked) {
          featuredAudio = {
            kind: "playlist",
            id: picked.id,
            title: picked.name || "Today's playlist",
            category: picked.category,
            coverEmoji: null,
          };
        }
      }

      // Occasional locked Plus teaser for non-Plus users (every 5th day)
      let lockedTeaser: { id: string; title: string; category: string | null } | null = null;
      if (!isSubscribed && seed % 5 === 0) {
        const lockedPool = allPlaylists.filter((p) => p.requires_subscription);
        if (lockedPool.length > 0) {
          const matched = intentCategory
            ? lockedPool.filter((p) => p.category === intentCategory)
            : lockedPool;
          const t = (matched.length ? matched : lockedPool)[seed % Math.max((matched.length ? matched : lockedPool).length, 1)];
          if (t) lockedTeaser = { id: t.id, title: t.name, category: t.category };
        }
      }

      const hasQuizResult = !!quizGapsRaw && quizGapsRaw.length > 0;
      const quizTopCategory = topGap;

      const activeRoutines = (routinesRes.data ?? []).map((r: any) => ({
        routineId: r.routine_id as string,
        title: (r.title as string) || "Routine",
        emoji: (r.emoji as string | null) ?? null,
        color: (r.color as string | null) ?? null,
      }));

      const dismissed = new Set(
        (dismissalsRes.data ?? []).map((d: any) => `${d.step_kind}:${d.step_ref}`),
      );

      // Apply path_step_actions
      const actions = (actionsRes.data ?? []) as Array<{
        action: "snooze" | "swap" | "skip_tomorrow";
        step_kind: string;
        step_ref: string;
        effective_until: string | null;
        swap_target: string | null;
        created_at: string;
      }>;

      const snoozedActive = new Set<string>();
      const swapMap = new Map<string, string>(); // original id -> swap_target id
      const skipTomorrowToday = new Set<string>();

      for (const a of actions) {
        const id = `${a.step_kind}:${a.step_ref}`;
        if (a.action === "snooze" && a.effective_until && a.effective_until > nowIso) {
          snoozedActive.add(id);
        } else if (a.action === "swap") {
          // Only honor swaps created today
          if (a.created_at.slice(0, 10) === today && a.swap_target) {
            swapMap.set(id, a.swap_target);
          }
        } else if (a.action === "skip_tomorrow" && a.effective_until) {
          // effective_until carries the date being skipped (YYYY-MM-DD)
          if (a.effective_until.slice(0, 10) === today) {
            skipTomorrowToday.add(id);
          }
        }
      }

      const dismissedIds = new Set<string>([
        ...dismissed,
        ...snoozedActive,
        ...skipTomorrowToday,
      ]);

      const isDayOne = activeRoutines.length === 0 && !hasQuizResult;

      const inputs = {
        hasMoodTodayLog,
        hasQuizResult,
        quizTopCategory,
        activeRoutines,
        dismissedIds,
        isDayOne,
        featuredAudio,
        lockedTeaser,
        featuredReset,
      };

      let steps = isDayOne ? buildDayOnePath(inputs) : buildStandardPath(inputs);

      // Apply swaps: replace step with its swap_target from the candidate pool
      if (swapMap.size > 0) {
        const pool = buildCandidatePool(inputs);
        const byId = new Map(pool.map((p) => [p.id, p]));
        steps = steps.map((s) => {
          const target = swapMap.get(s.id);
          if (target) {
            const replacement = byId.get(target);
            if (replacement) return { ...replacement, done: s.done };
          }
          return s;
        });
      }

      const summary = summarizePath(steps);
      const streak = (streakRes.data?.current_streak as number | undefined) ?? 0;

      // Build candidate ranker
      const pool = buildCandidatePool(inputs);
      const hour = new Date().getHours();
      const excludedIds = new Set([
        ...dismissedIds,
        ...steps.filter((s) => s.done).map((s) => s.id),
      ]);

      const candidatesFor = (step: PathStep) =>
        rankCandidates(pool, {
          hourOfDay: hour,
          todayMood: recentMoodLabel ?? null,
          recentCompletions: {},
          excludedIds,
          replacingStepId: step.id,
        }).slice(0, 5);

      return { steps, isDayOne, summary, streak, candidatesFor };
    },
  });
}

export function useSkipPathStep() {
  const { user } = useAuth();
  const today = getLocalDateStr();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (step: PathStep) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase.from("path_dismissals").insert({
        user_id: user.id,
        dismissed_date: today,
        step_kind: step.kind,
        step_ref: step.ref,
      });
      if (error && error.code !== "23505") throw error; // ignore unique-violation
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-path", user?.id, today] });
    },
  });
}

/** Snooze a step for N minutes (default 15). */
export function useSnoozePathStep() {
  const { user } = useAuth();
  const today = getLocalDateStr();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ step, minutes = 15 }: { step: PathStep; minutes?: number }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const until = new Date(Date.now() + minutes * 60_000).toISOString();
      const { error } = await supabase.from("path_step_actions").insert({
        user_id: user.id,
        action: "snooze",
        step_kind: step.kind,
        step_ref: step.ref,
        effective_until: until,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-path", user?.id, today] });
    },
  });
}

/** Swap a step for one of the ranked candidates. */
export function useSwapPathStep() {
  const { user } = useAuth();
  const today = getLocalDateStr();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ step, target }: { step: PathStep; target: PathStep }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase.from("path_step_actions").insert({
        user_id: user.id,
        action: "swap",
        step_kind: step.kind,
        step_ref: step.ref,
        swap_target: target.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-path", user?.id, today] });
    },
  });
}

/** Mark a step to be auto-skipped tomorrow too. */
export function useSkipTomorrowPathStep() {
  const { user } = useAuth();
  const today = getLocalDateStr();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (step: PathStep) => {
      if (!user?.id) throw new Error("Not authenticated");
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = getLocalDateStr(tomorrow);
      // Store tomorrow's local date in effective_until as a midnight UTC marker.
      const { error } = await supabase.from("path_step_actions").insert({
        user_id: user.id,
        action: "skip_tomorrow",
        step_kind: step.kind,
        step_ref: step.ref,
        effective_until: `${tomorrowDate}T00:00:00Z`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-path", user?.id, today] });
    },
  });
}