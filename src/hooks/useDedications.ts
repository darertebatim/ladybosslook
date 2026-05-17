import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { UserMoment } from "@/hooks/useMoments";
import type { FriendProfile } from "@/hooks/useFriends";

export interface DedicationRow {
  id: string;
  moment_id: string;
  sender_id: string;
  recipient_id: string;
  message: string | null;
  created_at: string;
  seen_at: string | null;
}

export interface DedicationWithRelations {
  dedication: DedicationRow;
  moment: UserMoment | null;
  other: FriendProfile | null;
  direction: "received" | "sent";
}

/** Dedications received by the current user (newest first). */
export function useReceivedDedications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["dedications-received", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<DedicationWithRelations[]> => {
      if (!user?.id) return [];
      const { data: dedications, error } = await supabase
        .from("dedications" as any)
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      const rows = (dedications ?? []) as unknown as DedicationRow[];
      if (rows.length === 0) return [];
      const momentIds = rows.map((r) => r.moment_id);
      const senderIds = Array.from(new Set(rows.map((r) => r.sender_id)));
      const [{ data: moments }, { data: senders }] = await Promise.all([
        supabase.from("user_moments" as any).select("*").in("id", momentIds),
        supabase.from("profiles").select("id, full_name, avatar_url, friend_code").in("id", senderIds),
      ]);
      const mMap = new Map<string, UserMoment>();
      (moments ?? []).forEach((m: any) => mMap.set(m.id, m as UserMoment));
      const sMap = new Map<string, FriendProfile>();
      (senders ?? []).forEach((p: any) => sMap.set(p.id, p));
      return rows.map((d) => ({
        dedication: d,
        moment: mMap.get(d.moment_id) ?? null,
        other: sMap.get(d.sender_id) ?? null,
        direction: "received" as const,
      }));
    },
  });
}

export function useSendDedication() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { momentId: string; recipientId: string; message?: string }) => {
      if (!user?.id) throw new Error("Sign in required");
      const { error } = await supabase.from("dedications" as any).insert({
        moment_id: args.momentId,
        sender_id: user.id,
        recipient_id: args.recipientId,
        message: args.message?.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["giftable-moments"] });
      qc.invalidateQueries({ queryKey: ["dedications-received"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Could not send dedication"),
  });
}

export function useMarkDedicationSeen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("dedications" as any)
        .update({ seen_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dedications-received"] }),
  });
}