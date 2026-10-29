import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Award, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePlannerTrophies } from "@/hooks/usePlannerTrophies";
import { haptic } from "@/lib/haptics";
import { Button } from "@/components/ui/button";

/**
 * Header stats pill — lifetime planner trophies + current streak.
 * Tapping it opens Presence. Matches the pill on Home / My Rilo Path.
 */
export function PresenceStatsPill({ trophies: trophyOverride, streak: streakOverride }: { trophies?: number; streak?: number } = {}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: trophies = 0 } = usePlannerTrophies();

  const { data: streak = 0 } = useQuery({
    queryKey: ["presence-streak", user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      if (!user) return 0;
      const { data, error } = await supabase
        .from("user_streaks")
        .select("current_streak")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data?.current_streak ?? 0;
    },
  });

  return (
    <Button
      variant="ghost"
      type="button"
      onClick={() => {
        haptic.light();
        navigate("/app/presence");
      }}
      className="flex h-11 shrink-0 items-center gap-0 p-1 rounded-full active:scale-95 transition-transform bg-card-warm active:bg-card-warm shadow-ios [&_svg]:size-4"
      aria-label={`Trophies: ${trophyOverride ?? trophies} · Streak: ${streakOverride ?? streak} days · open Presence`}
    >
      <span
        className="flex items-center gap-1 px-2 py-0.5 text-brand"
      >
        <Award className="w-4 h-4" strokeWidth={2.25} />
        <span className="text-[13px] font-bold tabular-nums text-fg-warm">{trophyOverride ?? trophies}</span>
      </span>
      <span
        className="flex h-9 items-center gap-1 px-2.5 rounded-full text-primary-foreground bg-gradient-streak shadow-ios"
      >
        <Flame className="w-3.5 h-3.5 fill-current" />
        <span className="text-[13px] font-bold tabular-nums">{streakOverride ?? streak}</span>
      </span>
    </Button>
  );
}
