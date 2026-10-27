import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Award, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePlannerTrophies } from "@/hooks/usePlannerTrophies";
import { haptic } from "@/lib/haptics";

/**
 * Header stats pill — lifetime planner trophies + current streak.
 * Tapping it opens Presence. Matches the pill on Home / My Rilo Path.
 */
export function PresenceStatsPill() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: trophies = 0 } = usePlannerTrophies();

  const { data: streak = 0 } = useQuery({
    queryKey: ["presence-streak", user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_streaks")
        .select("current_streak")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data?.current_streak ?? 0;
    },
  });

  return (
    <button
      type="button"
      onClick={() => {
        haptic.light();
        navigate("/app/presence");
      }}
      className="flex items-center p-0.5 rounded-full active:scale-95 transition-transform bg-white"
      style={{
        border: "1px solid hsl(var(--brand-primary) / 0.25)",
        boxShadow: "0 2px 8px rgba(235,94,51,0.18)",
      }}
      aria-label={`Trophies: ${trophies} · Streak: ${streak} days · open Presence`}
    >
      <span
        className="flex items-center gap-1 pl-2 pr-2.5 py-0.5"
        style={{ color: "hsl(var(--brand-primary))" }}
      >
        <Award className="w-4 h-4" strokeWidth={2.25} />
        <span className="text-[13px] font-bold text-fg-warm">{trophies}</span>
      </span>
      <span
        className="flex items-center gap-1 pl-2 pr-2.5 py-1 rounded-full text-white"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--brand-primary-light)), hsl(var(--brand-primary)))",
          boxShadow: "0 2px 8px rgba(235,94,51,0.35)",
        }}
      >
        <Flame className="w-3.5 h-3.5 fill-current" />
        <span className="text-[13px] font-bold">{streak}</span>
      </span>
    </button>
  );
}
