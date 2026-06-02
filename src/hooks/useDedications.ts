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
        supabase.rpc("get_safe_profiles" as any, { _ids: senderIds }),
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

/** Create a non-user (token-based) dedication. Returns the generated token. */
export function useSendTokenDedication() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { momentId: string; message?: string; recipientHint?: string }) => {
      if (!user?.id) throw new Error("Sign in required");
      // Generate token client-side: 16-char base32 (matches DB unique constraint)
      const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      let token = "";
      for (let i = 0; i < 16; i++) token += alphabet[bytes[i] % alphabet.length];
      const { error } = await supabase.from("dedications" as any).insert({
        moment_id: args.momentId,
        sender_id: user.id,
        recipient_token: token,
        recipient_hint: args.recipientHint?.trim() || null,
        message: args.message?.trim() || null,
      });
      if (error) throw error;
      return { token };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["giftable-moments"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Could not create Care Package"),
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

/** Marks a received dedication as "tried" — the recipient tapped Try it. */
export function useMarkDedicationTried() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("dedications" as any)
        .update({ tried_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dedications-received"] }),
  });
}