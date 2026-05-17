import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { MomentKind } from "@/lib/moments";

export interface UserMoment {
  id: string;
  user_id: string;
  kind: MomentKind;
  title: string;
  emoji: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
  expires_at: string;
  dedicated_at: string | null;
}

/** My giftable moments — not yet dedicated, not expired. */
export function useGiftableMoments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["giftable-moments", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<UserMoment[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("user_moments" as any)
        .select("*")
        .eq("user_id", user.id)
        .is("dedicated_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as UserMoment[];
    },
    staleTime: 30_000,
  });
}