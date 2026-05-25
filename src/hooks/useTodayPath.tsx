import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getLocalDateStr } from "@/lib/localDate";
import {
  buildDayOnePath,
  buildStandardPath,
  summarizePath,
  type PathStep,
} from "@/lib/pathEngine";

interface TodayPathResult {
  steps: PathStep[];
  isDayOne: boolean;
  summary: ReturnType<typeof summarizePath>;
  streak: number;
}

export function useTodayPath() {
  const { user } = useAuth();
  const today = getLocalDateStr();

  return useQuery<TodayPathResult>({
    queryKey: ["today-path", user?.id, today],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const userId = user!.id;

      // Fire all source queries in parallel.
      const [moodRes, quizRes, routinesRes, dismissalsRes, streakRes] = await Promise.all([
        supabase
          .from("emotion_logs")
          .select("id")
          .eq("user_id", userId)
          .eq("category", "mood_checkin")
          .gte("created_at", `${today}T00:00:00`)
          .lte("created_at", `${today}T23:59:59`)
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
      ]);

      const hasMoodTodayLog = (moodRes.data?.length ?? 0) > 0;
      const quizGaps = (quizRes.data?.gap_categories as string[] | null) ?? null;
      const hasQuizResult = !!quizGaps && quizGaps.length > 0;
      const quizTopCategory = hasQuizResult ? quizGaps![0] : null;

      const activeRoutines = (routinesRes.data ?? []).map((r: any) => ({
        routineId: r.routine_id as string,
        title: (r.title as string) || "Routine",
        emoji: (r.emoji as string | null) ?? null,
        color: (r.color as string | null) ?? null,
      }));

      const dismissedIds = new Set(
        (dismissalsRes.data ?? []).map((d: any) => `${d.step_kind}:${d.step_ref}`),
      );

      const isDayOne = activeRoutines.length === 0 && !hasQuizResult;

      const inputs = {
        hasMoodTodayLog,
        hasQuizResult,
        quizTopCategory,
        activeRoutines,
        dismissedIds,
        isDayOne,
      };

      const steps = isDayOne ? buildDayOnePath(inputs) : buildStandardPath(inputs);
      const summary = summarizePath(steps);
      const streak = (streakRes.data?.current_streak as number | undefined) ?? 0;

      return { steps, isDayOne, summary, streak };
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