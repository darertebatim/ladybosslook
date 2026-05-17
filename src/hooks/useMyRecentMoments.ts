import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { UserMoment } from "@/hooks/useMoments";

/**
 * My moments from the last 24 hours, regardless of whether they've
 * been dedicated already. Used in the Hub's "fresh from you" row so
 * the user feels proud and can dedicate undated ones to friends.
 */
export function useMyRecentMoments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-recent-moments", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<UserMoment[]> => {
      if (!user?.id) return [];
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("user_moments" as any)
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as unknown as UserMoment[];
    },
    staleTime: 30_000,
  });
}