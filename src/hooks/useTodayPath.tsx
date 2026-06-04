import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { endOfDay, startOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getLocalDateStr } from "@/lib/localDate";
import {
  buildDayOnePath,
  buildStandardPath,
  buildDoorPath,
  buildCandidatePool,
  buildStarterPoolPath,
  isStarterPoolGraduated,
  countRemainingPoolSlots,
  buildHybridPath,
  markStarterPoolSlotCompleted,
  getPoolSlotForStepId,
  summarizePath,
  type PathStep,
  type DoorKey,
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

/**
 * Local "tap = done" log for path steps that don't have a natural DB signal
 * (e.g. the "Open your planner" routine card). Mirrors how pro-link
 * shortcuts treat a tap as completion. Scoped per local day.
 */
const tappedStorageKey = (day: string) => `simora_path_tapped_${day}`;
export function getTappedStepIds(day: string = getLocalDateStr()): Set<string> {
  try {
    const raw = localStorage.getItem(tappedStorageKey(day));
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}
export function markStepTapped(stepId: string, day: string = getLocalDateStr()) {
  try {
    const set = getTappedStepIds(day);
    if (set.has(stepId)) return;
    set.add(stepId);
    localStorage.setItem(tappedStorageKey(day), JSON.stringify([...set]));
    // If this step corresponds to a starter-pool slot, persist completion
    // cross-day so the slot never resurfaces.
    const slot = getPoolSlotForStepId(stepId);
    if (slot) markStarterPoolSlotCompleted(slot);
  } catch {}
}

/**
 * Daily plan lock. Once today's path is built for the first time, snapshot the
 * step list (sans `done`) so subsequent loads in the same day reuse the same
 * suggestions — the user sees a stable "today's list" instead of a hero
 * playlist that mutates as they listen. Same-day swaps, snoozes, dismissals,
 * and completion marking are still applied on top.
 */
const planStorageKey = (userId: string, day: string) =>
  `simora_path_plan_${userId}_${day}`;

function readFrozenPlan(userId: string, day: string): PathStep[] | null {
  try {
    const raw = localStorage.getItem(planStorageKey(userId, day));
    if (!raw) return null;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return arr.map((s: any) => ({ ...s, done: false })) as PathStep[];
  } catch {
    return null;
  }
}

function writeFrozenPlan(userId: string, day: string, steps: PathStep[]) {
  try {
    // Strip `done` — completion is recomputed live each load.
    const stripped = steps.map(({ done, ...rest }: any) => rest);
    localStorage.setItem(planStorageKey(userId, day), JSON.stringify(stripped));
    // Purge previous days' plan snapshots to avoid unbounded growth.
    const prefix = `simora_path_plan_${userId}_`;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix) && k !== planStorageKey(userId, day)) {
        localStorage.removeItem(k);
      }
    }
  } catch {}
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
      const [moodRes, quizRes, routinesRes, dismissalsRes, streakRes, actionsRes, doorAnsRes, plannerOnbRes] = await Promise.all([
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
        supabase
          .from("onboarding_answers")
          .select("step_id, answer, created_at")
          .eq("user_id", userId)
          .eq("flow_id", "rilo-doors")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("onboarding_answers")
          .select("step_id")
          .eq("user_id", userId)
          .eq("flow_id", "what-is-rilo")
          .limit(1),
      ]);

      // Personality quiz completion is tracked separately so the path
      // can mark the "Take the Self-Care Personality Quiz" step as done.
      const personalityRes = await supabase
        .from("selfcare_personality_results")
        .select("id")
        .eq("user_id", userId)
        .order("taken_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const hasPersonalityResult = !!personalityRes.data;

      // ── Rilo Doors context ─────────────────────────────────────────────
      // Latest answer per step_id (rows are returned newest-first).
      const doorAnswers: Record<string, string[]> = {};
      for (const row of (doorAnsRes.data ?? []) as Array<{ step_id: string; answer: any }>) {
        if (doorAnswers[row.step_id]) continue;
        const v = Array.isArray(row.answer) ? row.answer : row.answer != null ? [row.answer] : [];
        doorAnswers[row.step_id] = v.map((x: any) => String(x));
      }
      const doorPrimary = (doorAnswers["rd-door-primary"]?.[0] ?? null) as DoorKey | null;
      const doorSecondary = (doorAnswers["rd-door-secondary"]?.[0] ?? null) as DoorKey | null;
      const emotionKeys = (doorAnswers["rd-sharp-emotion"] ?? []).filter((k) => k && k !== "unknown");
      const immigrantKeys = (doorAnswers["rd-sharp-immigrant"] ?? []).filter((k) => k && k !== "unknown");
      const hasDoorContext = !!doorPrimary;
      const plannerOnboardingDone =
        ((plannerOnbRes.data ?? []) as any[]).length > 0 ||
        (typeof localStorage !== "undefined" &&
          localStorage.getItem("simora_onboarding_completed_what-is-rilo") === "true");

      // Days since signup (capped at 2 → Day 3+ behaves the same).
      const signupIso = (user as any)?.created_at as string | undefined;
      const daysSinceSignup = signupIso
        ? Math.min(
            Math.max(
              Math.floor((Date.now() - new Date(signupIso).getTime()) / (24 * 60 * 60 * 1000)),
              0,
            ),
            2,
          )
        : 0;

      // ── Audio picker ────────────────────────────────────────────────────
      // Pull playlists + hot tracks. Free-first for non-Plus users; Plus users
      // see everything. Pick category by mood/time/quiz; alternate track vs
      // playlist by daily seed so the user sees variety.
      const [playlistRes, hotTracksRes] = await Promise.all([
        supabase
          .from("audio_playlists")
          .select("id, name, category, cover_image_url, language, requires_subscription, tracks_standalone")
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
        tracks_standalone: boolean | null;
      }>;
      const hotTracks = (hotTracksRes.data ?? []) as Array<{
        id: string; title: string; category: string | null;
      }>;
      const accessiblePlaylists = isSubscribed
        ? allPlaylists
        : allPlaylists.filter((p) => !p.requires_subscription);

      // Language-aware picker for "Path role" tagged playlists. Looks up the
      // `path-role/primary` and `path-role/secondary` tags from the tag schema
      // and filters accessible playlists by their tag links. Prefers a row
      // matching the user's preferred language; falls back to any tagged row.
      let taggedPrimary: typeof accessiblePlaylists[number] | null = null;
      let taggedSecondary: typeof accessiblePlaylists[number] | null = null;
      if (accessiblePlaylists.length > 0) {
        const { data: pathRoleTags } = await supabase
          .from("tags")
          .select("id, slug, dimension_id, tag_dimensions!inner(slug)")
          .in("slug", ["primary", "secondary"])
          .eq("tag_dimensions.slug", "path-role");
        const roleTagIds = ((pathRoleTags ?? []) as Array<{ id: string; slug: string }>);
        if (roleTagIds.length > 0) {
          const tagIds = roleTagIds.map((t) => t.id);
          const { data: roleLinks } = await supabase
            .from("content_tags")
            .select("content_id, tag_id")
            .eq("content_type", "playlist")
            .in("tag_id", tagIds);
          const tagBySlug = new Map(roleTagIds.map((t) => [t.slug, t.id]));
          const playlistsByRole: Record<"primary" | "secondary", Set<string>> = {
            primary: new Set(),
            secondary: new Set(),
          };
          for (const link of (roleLinks ?? []) as Array<{ content_id: string; tag_id: string }>) {
            if (link.tag_id === tagBySlug.get("primary")) playlistsByRole.primary.add(link.content_id);
            if (link.tag_id === tagBySlug.get("secondary")) playlistsByRole.secondary.add(link.content_id);
          }
          const pickByRole = (role: "primary" | "secondary") => {
            const matches = accessiblePlaylists.filter((p) => playlistsByRole[role].has(p.id));
            if (matches.length === 0) return null;
            if (preferredLanguage) {
              const langMatch = matches.find((p) => p.language === preferredLanguage);
              if (langMatch) return langMatch;
            }
            return matches[0] ?? null;
          };
          taggedPrimary = pickByRole("primary");
          taggedSecondary = pickByRole("secondary");
        }
      }

      // ── Door-flavored audio override (emotion/immigrant) ──────────────
      // For the emotion door: prefer playlists tagged with the user's picked
      // emotion slugs (strict match; we fall back to general calm below).
      // For the immigrant door: prefer "Bilingual Strength" series.
      let doorAudioOverride: typeof accessiblePlaylists[number] | null = null;
      // Productivity door has no door-audio hero (its hero is planner intro /
      // routines), but we still want to surface a productivity-themed playlist
      // — "Wellness Planning" — in the SECONDARY slot.
      let doorSecondaryAudioOverride: typeof accessiblePlaylists[number] | null = null;
      if (hasDoorContext && doorPrimary === "emotion" && emotionKeys.length > 0) {
        // Picker keys ARE tag slugs (see RiloDoorsScreens · EMOTION_TOP5/REST).
        const wantedSlugs = new Set<string>(emotionKeys);
        if (wantedSlugs.size > 0 && accessiblePlaylists.length > 0) {
          const { data: tagRows } = await supabase
            .from("tags")
            .select("id, slug")
            .in("slug", [...wantedSlugs]);
          const tagIds = ((tagRows ?? []) as Array<{ id: string }>).map((t) => t.id);
          if (tagIds.length > 0) {
            const { data: linkRows } = await supabase
              .from("content_tags")
              .select("content_id")
              .eq("content_type", "playlist")
              .in("tag_id", tagIds);
            const matchedIds = new Set(
              ((linkRows ?? []) as Array<{ content_id: string }>).map((l) => l.content_id),
            );
            doorAudioOverride =
              accessiblePlaylists.find((p) => matchedIds.has(p.id)) ?? null;
          }
        }
      } else if (hasDoorContext && doorPrimary === "immigrant") {
        doorAudioOverride =
          accessiblePlaylists.find((p) => /bilingual/i.test(p.name)) ?? null;
      }
      // Productivity door (primary OR secondary) → prefer Wellness Planning
      // as the secondary audio pick.
      if (
        hasDoorContext &&
        (doorPrimary === "productivity" || doorSecondary === "productivity")
      ) {
        doorSecondaryAudioOverride =
          accessiblePlaylists.find((p) => /wellness\s*planning/i.test(p.name)) ?? null;
      }

      // ── Continuity signals from audio_progress ────────────────────────
      // Pull recent listening so we can: (a) resurface an in-progress playlist
      // as "Continue", and (b) suggest a follow-up similar to the last
      // completed playlist when nothing is in-progress.
      const sinceIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const progressRes = await supabase
        .from("audio_progress")
        .select("audio_id, completed, current_position_seconds, last_played_at")
        .eq("user_id", userId)
        .gte("last_played_at", sinceIso)
        .order("last_played_at", { ascending: false })
        .limit(50);
      const progressRows = (progressRes.data ?? []) as Array<{
        audio_id: string; completed: boolean | null;
        current_position_seconds: number | null; last_played_at: string | null;
      }>;

      // Map audio_id → playlist_id(s)
      const audioIds = progressRows.map((r) => r.audio_id);
      const itemsRes = audioIds.length
        ? await supabase
            .from("audio_playlist_items")
            .select("audio_id, playlist_id")
            .in("audio_id", audioIds)
        : { data: [] as Array<{ audio_id: string; playlist_id: string }> };
      const audioToPlaylists = new Map<string, string[]>();
      for (const it of (itemsRes.data ?? []) as Array<{ audio_id: string; playlist_id: string }>) {
        const arr = audioToPlaylists.get(it.audio_id) ?? [];
        arr.push(it.playlist_id);
        audioToPlaylists.set(it.audio_id, arr);
      }
      const accessibleById = new Map(accessiblePlaylists.map((p) => [p.id, p]));

      // (a) In-progress: most recent row that's not completed and has real progress
      let continuePick: { playlistId: string; audioId: string } | null = null;
      for (const row of progressRows) {
        if (row.completed) continue;
        if ((row.current_position_seconds ?? 0) < 30) continue;
        const plIds = audioToPlaylists.get(row.audio_id) ?? [];
        const accessiblePl = plIds.find((id) => accessibleById.has(id));
        if (accessiblePl) {
          continuePick = { playlistId: accessiblePl, audioId: row.audio_id };
          break;
        }
      }

      // (b) Smart next: most recent completed row's playlist → find a similar one
      let smartNextPick: { playlist: typeof accessiblePlaylists[number] } | null = null;
      if (!continuePick) {
        const lastCompleted = progressRows.find((r) => r.completed);
        if (lastCompleted) {
          const plIds = audioToPlaylists.get(lastCompleted.audio_id) ?? [];
          const seedPlaylistIds = plIds.filter((id) => accessibleById.has(id));
          if (seedPlaylistIds.length) {
            // Fetch tag links for the seed playlist(s)
            const tagRes = await supabase
              .from("content_tags")
              .select("content_id, tag_id")
              .eq("content_type", "playlist")
              .in("content_id", seedPlaylistIds);
            const seedTagIds = new Set(
              ((tagRes.data ?? []) as Array<{ tag_id: string }>).map((t) => t.tag_id),
            );
            const seedCategories = new Set(
              seedPlaylistIds
                .map((id) => accessibleById.get(id)?.category)
                .filter(Boolean) as string[],
            );
            // Candidate pool: accessible, not the seed playlist itself, not
            // already in user's recent progress (so we suggest something new)
            const recentPlaylistIds = new Set<string>();
            for (const r of progressRows) {
              for (const pid of audioToPlaylists.get(r.audio_id) ?? []) {
                recentPlaylistIds.add(pid);
              }
            }
            const candidatePool = accessiblePlaylists.filter(
              (p) => !seedPlaylistIds.includes(p.id) && !recentPlaylistIds.has(p.id),
            );
            // Score: +2 shared tag, +1 same category
            let candidateTagMap = new Map<string, Set<string>>();
            if (seedTagIds.size > 0 && candidatePool.length > 0) {
              const candTagRes = await supabase
                .from("content_tags")
                .select("content_id, tag_id")
                .eq("content_type", "playlist")
                .in("content_id", candidatePool.map((p) => p.id));
              for (const t of (candTagRes.data ?? []) as Array<{ content_id: string; tag_id: string }>) {
                const set = candidateTagMap.get(t.content_id) ?? new Set<string>();
                set.add(t.tag_id);
                candidateTagMap.set(t.content_id, set);
              }
            }
            let best: { p: typeof accessiblePlaylists[number]; score: number } | null = null;
            for (const p of candidatePool) {
              let score = 0;
              if (p.category && seedCategories.has(p.category)) score += 1;
              const tags = candidateTagMap.get(p.id);
              if (tags) for (const t of tags) if (seedTagIds.has(t)) score += 2;
              if (score > 0 && (!best || score > best.score)) best = { p, score };
            }
            if (best) smartNextPick = { playlist: best.p };
          }
        }
      }

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

      // Door-flavored reset: emotion/immigrant doors prefer `emotion-based`
      // category breath/reflection content; fall back to the rotation below.
      const wantEmotionFlavor = hasDoorContext &&
        (doorPrimary === "emotion" || doorPrimary === "immigrant");
      const flavoredBreaths = wantEmotionFlavor
        ? (breaths as any[]).filter((b) => b.category === "emotion-based")
        : [];
      const flavoredReflections = wantEmotionFlavor
        ? (reflections as any[]).filter((r) => r.category === "emotion-based")
        : [];
      // Deterministic day seed (YYYYMMDD as int)
      const seed = parseInt(today.replace(/-/g, ""), 10) || 0;
      // Alternate kind by parity of seed so user sees variety
      const useBreath = seed % 2 === 0 ? breaths.length > 0 : reflections.length === 0;
      let featuredReset: {
        kind: "breath" | "reflection"; id: string; title: string;
        emoji: string | null; category: string | null;
      } | null = null;
      // Non-emotion-door users get a Check In from the GENERIC pool only —
      // emotion-based content is reserved for the emotion/immigrant doors.
      const genericBreaths = (breaths as any[]).filter((b) => b.category !== "emotion-based");
      const genericReflections = (reflections as any[]).filter((r) => r.category !== "emotion-based");
      const breathPool = flavoredBreaths.length > 0
        ? flavoredBreaths
        : (genericBreaths.length > 0 ? genericBreaths : (breaths as any[]));
      const reflectionPool = flavoredReflections.length > 0
        ? flavoredReflections
        : (genericReflections.length > 0 ? genericReflections : (reflections as any[]));
      if (useBreath && breathPool.length > 0) {
        const b = breathPool[seed % breathPool.length];
        featuredReset = { kind: "breath", id: b.id, title: b.name, emoji: b.emoji, category: b.category };
      } else if (reflectionPool.length > 0) {
        const r = reflectionPool[seed % reflectionPool.length];
        featuredReset = { kind: "reflection", id: r.id, title: r.title, emoji: r.emoji, category: r.category };
      }

      const moodLatest = (moodRes.data ?? [])[0] as
        | { id: string; valence: string | null; created_at: string | null }
        | undefined;
      const hasMoodTodayLog =
        !!moodLatest?.created_at &&
        getLocalDateStr(new Date(moodLatest.created_at)) === today;

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
        | { kind: "track"; id: string; title: string; category: string | null; coverEmoji: string | null; coverImageUrl: string | null; mode?: "continue" | "smart_next" | "default"; resumeAudioId?: string | null }
        | { kind: "playlist"; id: string; title: string; category: string | null; coverEmoji: string | null; coverImageUrl: string | null; mode?: "continue" | "smart_next" | "default"; resumeAudioId?: string | null };
      let featuredAudio: FeaturedAudio | null = null;
      type SecondaryAudio =
        | { kind: "track"; id: string; title: string; category: string | null; coverEmoji: string | null; coverImageUrl: string | null }
        | { kind: "playlist"; id: string; title: string; category: string | null; coverEmoji: string | null; coverImageUrl: string | null };
      let secondaryAudio: SecondaryAudio | null = null;

      // Educational categories get the hero slot; everything else is fair game
      // for the secondary slot (and can be surfaced as a standalone track when
      // the playlist is flagged tracks_standalone).
      const EDU_CATEGORIES = new Set(["course", "audiobook", "podcast", "masterclass"]);
      const eduPlaylists = accessiblePlaylists.filter(
        (p) => p.category && EDU_CATEGORIES.has(p.category),
      );
      const otherPlaylists = accessiblePlaylists.filter(
        (p) => !p.category || !EDU_CATEGORIES.has(p.category),
      );

      if (continuePick) {
        const pl = accessibleById.get(continuePick.playlistId)!;
        featuredAudio = {
          kind: "playlist",
          id: pl.id,
          title: pl.name || "Continue listening",
          category: pl.category,
          coverEmoji: null,
          coverImageUrl: (pl as any).cover_image_url ?? null,
          mode: "continue",
          resumeAudioId: continuePick.audioId,
        };
      } else if (smartNextPick) {
        const pl = smartNextPick.playlist;
        featuredAudio = {
          kind: "playlist",
          id: pl.id,
          title: pl.name || "Picked for you",
          category: pl.category,
          coverEmoji: null,
          coverImageUrl: (pl as any).cover_image_url ?? null,
          mode: "smart_next",
        };
      } else {
        // Hero: prefer educational playlists. Fall back to any accessible
        // playlist when no education content is available yet.
        const eduPool = eduPlaylists.length ? eduPlaylists : accessiblePlaylists;
        const eduPreferred = preferredLanguage
          ? eduPool.find((p) => p.language === preferredLanguage)
          : null;
        // Priority: door override → tagged "primary" (language-aware) →
        // educational pick (language preferred) → daily-rotation fallback.
        const picked =
          doorAudioOverride ??
          taggedPrimary ??
          eduPreferred ??
          eduPool[seed % Math.max(eduPool.length, 1)] ??
          null;
        if (picked) {
          featuredAudio = {
            kind: "playlist",
            id: picked.id,
            title: picked.name || "Today's playlist",
            category: picked.category,
            coverEmoji: null,
            coverImageUrl: (picked as any).cover_image_url ?? null,
          };
        }
      }

      // Secondary: a non-educational pick. Prefer intent category (mood/time),
      // and rotate between playlist and standalone-track each day. Standalone
      // tracks only come from playlists flagged tracks_standalone.
      const heroId = featuredAudio?.id ?? null;
      // Productivity door override wins for the secondary slot when present
      // and not already used as the hero.
      if (
        doorSecondaryAudioOverride &&
        doorSecondaryAudioOverride.id !== heroId
      ) {
        const pl = doorSecondaryAudioOverride;
        secondaryAudio = {
          kind: "playlist",
          id: pl.id,
          title: pl.name,
          category: pl.category,
          coverEmoji: null,
          coverImageUrl: (pl as any).cover_image_url ?? null,
        };
      }
      // Next priority: a playlist tagged "secondary" (language-aware), as
      // long as it isn't already the hero.
      if (!secondaryAudio && taggedSecondary && taggedSecondary.id !== heroId) {
        const pl = taggedSecondary;
        secondaryAudio = {
          kind: "playlist",
          id: pl.id,
          title: pl.name,
          category: pl.category,
          coverEmoji: null,
          coverImageUrl: (pl as any).cover_image_url ?? null,
        };
      }
      const secPool = (() => {
        const intentMatch = intentCategory
          ? otherPlaylists.filter((p) => p.category === intentCategory)
          : [];
        const pool = intentMatch.length ? intentMatch : otherPlaylists;
        return pool.filter((p) => p.id !== heroId);
      })();
      if (!secondaryAudio && secPool.length > 0) {
        const standalonePool = secPool.filter((p) => p.tracks_standalone);
        const wantTrack = (preferTrack || trackByRotation) && standalonePool.length > 0;
        if (wantTrack) {
          // Prefer a standalone playlist matching the user's preferred language;
          // fall back to date-seed pick across the full standalone pool.
          const preferredStandalone = preferredLanguage
            ? standalonePool.find((p) => p.language === preferredLanguage)
            : null;
          const pl = preferredStandalone ?? standalonePool[seed % standalonePool.length];
          // Pick one track from that playlist (free for non-Plus)
          let tq = supabase
            .from("audio_playlist_items")
            .select("audio_content:audio_id (id, title, is_free, cover_image_url)")
            .eq("playlist_id", pl.id)
            .order("position", { ascending: true })
            .limit(20);
          const tRes = await tq;
          const tracks = ((tRes.data ?? []) as any[])
            .map((r) => r.audio_content)
            .filter((a) => a && (isSubscribed || a.is_free));
          if (tracks.length > 0) {
            const t = tracks[seed % tracks.length];
            secondaryAudio = {
              kind: "track",
              id: t.id,
              title: t.title,
              category: pl.category,
              coverEmoji: null,
              coverImageUrl: (t as any).cover_image_url ?? (pl as any).cover_image_url ?? null,
            };
          } else {
            secondaryAudio = {
              kind: "playlist",
              id: pl.id,
              title: pl.name,
              category: pl.category,
              coverEmoji: null,
              coverImageUrl: (pl as any).cover_image_url ?? null,
            };
          }
        } else {
          const preferred = preferredLanguage
            ? secPool.find((p) => p.language === preferredLanguage)
            : null;
          const pl = preferred ?? secPool[seed % secPool.length];
          secondaryAudio = {
            kind: "playlist",
            id: pl.id,
            title: pl.name,
            category: pl.category,
            coverEmoji: null,
            coverImageUrl: (pl as any).cover_image_url ?? null,
          };
        }
      } else if (!secondaryAudio && useTrack && hotTracks.length > 0) {
        // Last-resort: surface a hot track if we couldn't build a secondary
        const t = hotTracks[seed % hotTracks.length];
        if (t.id !== heroId) {
          secondaryAudio = {
            kind: "track", id: t.id, title: t.title,
            category: t.category, coverEmoji: null,
            coverImageUrl: (t as any).cover_image_url ?? null,
          };
        }
      }

      // Occasional locked Plus teaser for non-Plus users (every 5th day)
      let lockedTeaser: { id: string; title: string; category: string | null; coverImageUrl: string | null } | null = null;
      if (!isSubscribed && seed % 5 === 0) {
        const lockedPool = allPlaylists.filter((p) => p.requires_subscription);
        if (lockedPool.length > 0) {
          const matched = intentCategory
            ? lockedPool.filter((p) => p.category === intentCategory)
            : lockedPool;
          const t = (matched.length ? matched : lockedPool)[seed % Math.max((matched.length ? matched : lockedPool).length, 1)];
          if (t) lockedTeaser = { id: t.id, title: t.name, category: t.category, coverImageUrl: (t as any).cover_image_url ?? null };
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
      const actions = ((actionsRes.data ?? []) as Array<{
        action: "snooze" | "swap" | "skip_tomorrow";
        step_kind: string;
        step_ref: string;
        effective_until: string | null;
        swap_target: string | null;
        created_at: string;
      }>).slice().sort((a, b) => b.created_at.localeCompare(a.created_at));

      const snoozedActive = new Set<string>();
      const swapMap = new Map<string, string>(); // original id -> swap_target id
      const skipTomorrowToday = new Set<string>();
      // Steps deferred today via "Snooze later" — moved to end of list, not hidden.
      const deferredToday = new Set<string>();

      for (const a of actions) {
        const id = `${a.step_kind}:${a.step_ref}`;
        // Compare in the user's LOCAL timezone — `created_at` is UTC, so a
        // naive slice(0,10) drops same-day actions for users west of UTC
        // (e.g. PT user swaps at 8pm → UTC date is already tomorrow).
        const createdLocalDay = getLocalDateStr(new Date(a.created_at));
        if (a.action === "snooze") {
          // New semantics: snooze = defer to end of list for today.
          // Honor any snooze action created today (ignore stale rows from
          // previous days, regardless of effective_until format).
          if (createdLocalDay === today) {
            deferredToday.add(id);
          }
        } else if (a.action === "swap") {
          // Only honor swaps created today
          // Actions are sorted newest-first, so keep only the most recent
          // swap per step (don't let an older row overwrite it).
          if (createdLocalDay === today && a.swap_target && !swapMap.has(id)) {
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
        ...skipTomorrowToday,
      ]);

      const isDayOne = activeRoutines.length === 0 && !hasQuizResult;

      // Spec: users who skipped Rilo Doors are treated as the "Exploring" door
      // so they still get the door-aware Day 1–3 path (curated tour + teasers)
      // instead of the legacy flat builders.
      const effectiveDoorContext = hasDoorContext
        ? {
            primary: doorPrimary,
            secondary: doorSecondary,
            emotionKeys,
            immigrantKeys,
          }
        : {
            primary: "exploring" as const,
            secondary: null,
            emotionKeys: [] as string[],
            immigrantKeys: [] as string[],
          };

      const inputs = {
        hasMoodTodayLog,
        hasQuizResult,
        hasPersonalityResult,
        quizTopCategory,
        activeRoutines,
        dismissedIds,
        isDayOne,
        featuredAudio,
        secondaryAudio,
        lockedTeaser,
        featuredReset,
        breathAlternates: (breaths as any[]).map((b) => ({
          id: b.id, title: b.name, emoji: b.emoji, category: b.category,
        })),
        reflectionAlternates: (reflections as any[]).map((r) => ({
          id: r.id, title: r.title, emoji: r.emoji, category: r.category,
        })),
        doorContext: effectiveDoorContext,
        daysSinceSignup,
        plannerOnboardingDone,
      };

      // Starter pool model with hybrid blend:
      //   • 4+ pool slots left → pure pool (3 picks/day)
      //   • 1–3 left           → hybrid (remaining pool + standard fillers)
      //   • 0 left             → pure Standard Flow
      // Skipped-door users still get the pool (via "exploring" door above).
      const remainingPool = countRemainingPoolSlots(inputs);
      let steps: PathStep[];
      const frozenPlan = readFrozenPlan(userId, today);
      if (frozenPlan) {
        // Reuse today's locked plan so suggestions stay stable through the day.
        steps = frozenPlan;
        // Dismissals (skip / skip-tomorrow) are applied AFTER restoring the
        // snapshot so same-day skips still remove the step from view.
        if (dismissedIds.size > 0) {
          steps = steps.filter((s) => !dismissedIds.has(`${s.kind}:${s.ref}`));
        }
      } else {
        steps =
          remainingPool === 0
            ? buildStandardPath(inputs)
            : remainingPool < 4
              ? buildHybridPath(inputs)
              : buildStarterPoolPath(inputs);
        // Freeze the freshly-built plan for the rest of today.
        writeFrozenPlan(userId, today, steps);
      }

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

      // Apply "Snooze later" deferrals: move matched steps to the end of the
      // list (but keep the reward step pinned as the absolute last item).
      if (deferredToday.size > 0) {
        const kept: typeof steps = [];
        const deferred: typeof steps = [];
        let reward: (typeof steps)[number] | null = null;
        for (const s of steps) {
          if (s.kind === "reward") { reward = s; continue; }
          if (deferredToday.has(s.id)) deferred.push(s);
          else kept.push(s);
        }
        steps = [...kept, ...deferred];
        if (reward) steps.push(reward);
      }

      // ── Mark path steps as done from activity tables ──────────────────
      // Reuses the same signals the pro-link/shortcut completion tracker uses
      // (breathing_sessions, reflections, audio_progress, task_completions).
      // Each path suggestion behaves like a pro-task: complete the underlying
      // activity today and the step ticks off automatically.
      const todayStartIso = startOfDay(new Date()).toISOString();
      const todayEndIso = endOfDay(new Date()).toISOString();
      const [breatheRes, reflResRes, freeReflRes, taskCompRes] = await Promise.all([
        supabase
          .from("breathing_sessions")
          .select("id, exercise_id")
          .eq("user_id", userId)
          .gte("completed_at", todayStartIso)
          .lte("completed_at", todayEndIso),
        supabase
          .from("user_reflection_responses" as any)
          .select("id, reflection_id")
          .eq("user_id", userId)
          .gte("completed_at", todayStartIso)
          .lte("completed_at", todayEndIso),
        supabase
          .from("free_form_reflections")
          .select("id")
          .eq("user_id", userId)
          .gte("created_at", todayStartIso)
          .lte("created_at", todayEndIso)
          .limit(1),
        supabase
          .from("task_completions")
          .select("task_id")
          .eq("user_id", userId)
          .eq("completed_date", today),
      ]);
      const completedBreathExerciseIds = new Set<string>(
        (breatheRes.data ?? []).map((r: any) => r.exercise_id).filter(Boolean),
      );
      const completedReflectionIds = new Set<string>(
        ((reflResRes.data ?? []) as any[]).map((r: any) => r.reflection_id).filter(Boolean),
      );
      const freeReflectionDoneToday = (freeReflRes.data ?? []).length > 0;

      // Routine completion: resolve completed task_ids → source_routine_id
      const completedRoutineIds = new Set<string>();
      const completedTaskIds = (taskCompRes.data ?? []).map((c: any) => c.task_id);
      if (completedTaskIds.length > 0) {
        const { data: taskRows } = await supabase
          .from("user_tasks")
          .select("source_routine_id")
          .eq("user_id", userId)
          .in("id", completedTaskIds);
        for (const r of (taskRows ?? []) as Array<{ source_routine_id: string | null }>) {
          if (r.source_routine_id) completedRoutineIds.add(r.source_routine_id);
        }
      }

      // Audio completion: counts as done when the user actually listened
      // today — either finished the track (`completed`) OR played past 30s.
      // This matches how pro-task playlist steps tick off after a real listen.
      const completedAudioIds = new Set<string>();
      const completedPlaylistIds = new Set<string>();
      for (const r of progressRows) {
        if (!r.last_played_at || getLocalDateStr(new Date(r.last_played_at)) !== today) continue;
        const meaningfulListen =
          r.completed === true || (r.current_position_seconds ?? 0) >= 30;
        if (!meaningfulListen) continue;
        completedAudioIds.add(r.audio_id);
        for (const pid of audioToPlaylists.get(r.audio_id) ?? []) {
          completedPlaylistIds.add(pid);
        }
      }

      const tappedToday = getTappedStepIds(today);

      steps = steps.map((s) => {
        if (s.done) return s;
        let done = false;
        switch (s.kind) {
          case "breath":
            // Generic built-in breath presets (ref like "box4", "478") aren't
            // stored in breathing_exercises, so they only complete via tap.
            break;
          case "reset":
            // Step id is `reset:breath:<id>` or `reset:reflection:<id>`
            if (s.id.startsWith("reset:breath:")) {
              done = !!s.ref && completedBreathExerciseIds.has(s.ref);
            } else if (s.id.startsWith("reset:reflection:")) {
              done = !!s.ref && completedReflectionIds.has(s.ref);
            }
            break;
          case "routine":
            if (s.ref && s.ref !== "pick_first") {
              done = completedRoutineIds.has(s.ref);
            }
            break;
          case "playlist":
            // Step id encodes "track:<id>" or "playlist:<id>"
            if (s.id.startsWith("track:")) done = completedAudioIds.has(s.ref);
            else if (s.id.startsWith("playlist:")) done = completedPlaylistIds.has(s.ref);
            break;
          case "quiz_pick":
            if (s.ref === "onboarding") done = hasPersonalityResult;
            break;
          default:
            break;
        }
        // "Tap = done" fallback: any step the user opened today counts as
        // completed, mirroring pro-link shortcut behaviour.
        if (!done && tappedToday.has(s.id)) done = true;
        return done ? { ...s, done: true } : s;
      });

      // Reward auto-completes when every REQUIRED non-reward step is done.
      // Skippable extras (secondary audio, Plus teaser, etc.) don't block the
      // trophy — otherwise the path feels like "unfinished business" even
      // after the user finishes the core list.
      const nonReward = steps.filter((s) => s.kind !== "reward");
      const required = nonReward.filter((s) => !s.skippable);
      const gating = required.length > 0 ? required : nonReward;
      const allDone = gating.length > 0 && gating.every((s) => s.done);
      if (allDone) {
        steps = steps.map((s) => (s.kind === "reward" ? { ...s, done: true } : s));
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
      // Starter pool: a skip on a pool slot retires that slot cross-day.
      const slot = (step as any).poolSlot ?? getPoolSlotForStepId(step.id);
      if (slot) markStarterPoolSlotCompleted(slot);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-path", user?.id, today] });
    },
  });
}

/** "Snooze later": defer a step to the end of today's list (no timer). */
export function useSnoozePathStep() {
  const { user } = useAuth();
  const today = getLocalDateStr();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ step }: { step: PathStep; minutes?: number }) => {
      if (!user?.id) throw new Error("Not authenticated");
      // Persist for the rest of today; the path builder filters by created_at
      // date, so any same-day "snooze" row is treated as "move to end".
      const until = endOfDay(new Date()).toISOString();
      const { error } = await supabase.from("path_step_actions").insert({
        user_id: user.id,
        action: "snooze",
        step_kind: step.kind,
        step_ref: step.ref,
        effective_until: until,
      });
      if (error) throw error;
    },
    onMutate: async ({ step }) => {
      await queryClient.cancelQueries({ queryKey: ["today-path"] });
      const snapshots: Array<[readonly unknown[], TodayPathResult | undefined]> = [];
      queryClient
        .getQueriesData<TodayPathResult>({ queryKey: ["today-path"] })
        .forEach(([key, value]) => {
          if (!value) return;
          snapshots.push([key, value]);
          // Move the step to the end (before reward), like the builder does.
          const kept: PathStep[] = [];
          const deferred: PathStep[] = [];
          let reward: PathStep | null = null;
          for (const s of value.steps) {
            if (s.kind === "reward") { reward = s; continue; }
            if (s.id === step.id) deferred.push(s);
            else kept.push(s);
          }
          const newSteps = [...kept, ...deferred, ...(reward ? [reward] : [])];
          queryClient.setQueryData<TodayPathResult>(key, {
            ...value,
            steps: newSteps,
            summary: summarizePath(newSteps),
          });
        });
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, value]) => {
        if (value) queryClient.setQueryData(key, value);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["today-path"] });
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
    // Optimistic: rewrite the cached path so the hero updates instantly
    // instead of waiting for the network refetch (which can be masked by
    // the persisted IndexedDB cache returning the prior snapshot first).
    onMutate: async ({ step, target }) => {
      await queryClient.cancelQueries({ queryKey: ["today-path"] });
      const snapshots: Array<[readonly unknown[], TodayPathResult | undefined]> = [];
      queryClient
        .getQueriesData<TodayPathResult>({ queryKey: ["today-path"] })
        .forEach(([key, value]) => {
          if (!value) return;
          snapshots.push([key, value]);
          const newSteps = value.steps.map((s) =>
            s.id === step.id ? { ...target, done: s.done } : s,
          );
          queryClient.setQueryData<TodayPathResult>(key, {
            ...value,
            steps: newSteps,
            summary: summarizePath(newSteps),
          });
        });
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, value]) => {
        if (value) queryClient.setQueryData(key, value);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["today-path"] });
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