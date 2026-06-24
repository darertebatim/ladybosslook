import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getLocalDateStr } from "@/lib/localDate";
import { haptic } from "@/lib/haptics";
import confetti from "canvas-confetti";

/**
 * Lifetime count of days where the user fully completed their planner tasks
 * (the "gold" tier). One trophy per (user, date), de-duped by a unique
 * constraint so retries are safe.
 */
export function usePlannerTrophies() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["planner-trophies", user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("planner_trophies")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

/**
 * Side-effect: when the user reaches the gold-badge state today for the first
 * time, insert a trophy row, celebrate, and refetch the lifetime count.
 * Idempotent — relies on the unique (user_id, earned_date) constraint.
 */
export function useAwardPlannerTrophyOnComplete(isGoldToday: boolean) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const awardedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id || !isGoldToday) return;
    const today = getLocalDateStr();
    if (awardedRef.current === `${user.id}:${today}`) return;
    awardedRef.current = `${user.id}:${today}`;

    (async () => {
      const { error } = await supabase
        .from("planner_trophies")
        .insert({ user_id: user.id, earned_date: today });
      if (error) {
        const code = (error as { code?: string }).code;
        if (code !== "23505") {
          console.warn("[planner-trophy] insert failed", error);
        }
        return;
      }
      haptic.success();
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.4 },
          colors: ["#EB5E33", "#F5A623", "#FFD2A1", "#FFE6C9"],
        });
      } catch {}
      qc.invalidateQueries({ queryKey: ["planner-trophies", user.id] });
    })();
  }, [user?.id, isGoldToday, qc]);
}