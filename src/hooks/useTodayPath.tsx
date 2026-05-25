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
  const today = getLocalDateStr();
  const nowIso = new Date().toISOString();
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getLocalDateStr(d);
  })();

  return useQuery<TodayPathResult>({
    queryKey: ["today-path", user?.id, today, preferredLanguage],
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

      // Fetch featured playlists (mobile + visible). Order: language match first,
      // then sort_order. Pick the top of the list.
      const playlistRes = await supabase
        .from("audio_playlists")
        .select("id, name, category, cover_image_url, language")
        .eq("available_on_mobile", true)
        .eq("is_hidden", false)
        .order("sort_order", { ascending: true })
        .limit(12);
      const playlists = (playlistRes.data ?? []) as Array<{
        id: string; name: string; category: string | null; language: string | null;
      }>;
      const preferred = preferredLanguage
        ? playlists.find((p) => p.language === preferredLanguage)
        : null;
      const picked = preferred ?? playlists[0] ?? null;
      const featuredPlaylist = picked
        ? {
            id: picked.id,
            name: picked.name || "Today's playlist",
            category: picked.category,
            coverEmoji: null,
          }
        : null;

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

      const quizGaps = (quizRes.data?.gap_categories as string[] | null) ?? null;
      const hasQuizResult = !!quizGaps && quizGaps.length > 0;
      const quizTopCategory = hasQuizResult ? quizGaps![0] : null;

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
        featuredPlaylist,
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