import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface FriendProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  friend_code: string | null;
}

export interface FriendshipRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined" | "blocked";
  created_at: string;
  accepted_at: string | null;
}

export interface FriendshipWithProfile {
  friendship: FriendshipRow;
  other: FriendProfile;
}

/** All friendships involving the current user, joined with the other profile. */
export function useFriendships() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["friendships", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<FriendshipWithProfile[]> => {
      if (!user?.id) return [];
      const { data: rows, error } = await supabase
        .from("friendships" as any)
        .select("*")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const friendships = (rows ?? []) as unknown as FriendshipRow[];
      const otherIds = Array.from(new Set(
        friendships.map((f) => f.requester_id === user.id ? f.addressee_id : f.requester_id)
      ));
      if (otherIds.length === 0) return [];
      const { data: profiles } = await supabase
        .rpc("get_safe_profiles" as any, { _ids: otherIds });
      const map = new Map<string, FriendProfile>();
      (profiles ?? []).forEach((p: any) => map.set(p.id, p));
      return friendships.map((f) => ({
        friendship: f,
        other: map.get(f.requester_id === user.id ? f.addressee_id : f.requester_id) ?? {
          id: "", full_name: null, avatar_url: null, friend_code: null,
        },
      })).filter((r) => r.other.id);
    },
  });
}

export function useMyFriendCode() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-friend-code", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("friend_code")
        .eq("id", user.id)
        .maybeSingle();
      return (data as any)?.friend_code as string | null;
    },
  });
}

/** Send a friend request by code. Returns the created friendship. */
export function useSendFriendRequest() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rawCode: string) => {
      if (!user?.id) throw new Error("Sign in required");
      const code = rawCode.trim().toUpperCase();
      if (!code) throw new Error("Enter a friend code");

      const { data: matches } = await supabase
        .rpc("find_profile_by_code" as any, { _code: code });
      const target = Array.isArray(matches) ? matches[0] : matches;
      if (!target) throw new Error("No one found with that code");
      if ((target as any).id === user.id) throw new Error("That's your own code");

      // Pre-check existing friendship
      const { data: existing } = await supabase
        .from("friendships" as any)
        .select("*")
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${(target as any).id}),and(requester_id.eq.${(target as any).id},addressee_id.eq.${user.id})`)
        .maybeSingle();
      if (existing) {
        const status = (existing as any).status;
        if (status === "accepted") throw new Error("You're already friends");
        if (status === "pending") throw new Error("Request already sent");
      }

      const { data, error } = await supabase
        .from("friendships" as any)
        .insert({
          requester_id: user.id,
          addressee_id: (target as any).id,
          status: "pending",
        })
        .select("*")
        .single();
      if (error) throw error;
      return { friendship: data, target };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friendships"] });
      toast.success("Request sent ✨");
    },
    onError: (e: any) => toast.error(e.message ?? "Could not send request"),
  });
}

export function useRespondToFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; accept: boolean }) => {
      const { error } = await supabase
        .from("friendships" as any)
        .update({
          status: args.accept ? "accepted" : "declined",
          accepted_at: args.accept ? new Date().toISOString() : null,
        })
        .eq("id", args.id);
      if (error) throw error;
      return args;
    },
    onSuccess: (args) => {
      qc.invalidateQueries({ queryKey: ["friendships"] });
      if (args.accept) toast.success("You're now friends 💝");
    },
    onError: (e: any) => toast.error(e.message ?? "Could not update request"),
  });
}

export function useRemoveFriendship() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("friendships" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["friendships"] }),
  });
}