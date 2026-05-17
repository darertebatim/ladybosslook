import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublicDedication {
  id: string;
  sender_first_name: string;
  sender_avatar_url: string | null;
  recipient_hint: string | null;
  message: string | null;
  moment_kind: string;
  moment_title: string;
  moment_emoji: string | null;
  moment_payload: Record<string, unknown> | null;
  created_at: string;
  expires_token_at: string;
  is_claimed: boolean;
}

export function usePublicDedication(token: string | undefined) {
  return useQuery({
    queryKey: ["public-dedication", token],
    enabled: !!token,
    retry: false,
    queryFn: async (): Promise<PublicDedication | null> => {
      if (!token) return null;
      const { data, error } = await supabase.rpc("get_dedication_by_token" as any, { t: token });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row ?? null) as PublicDedication | null;
    },
  });
}