import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface GiftablePlaylist {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  requires_subscription: boolean;
  trackCount: number;
}

/** Playlists the user has access to AND can gift. */
export function useGiftablePlaylists() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["giftable-playlists", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<GiftablePlaylist[]> => {
      if (!user?.id) return [];

      // Determine if user has Plus
      const { data: sub } = await supabase
        .from("user_subscriptions")
        .select("status, expires_at")
        .eq("user_id", user.id)
        .eq("program_slug", "simora-plus")
        .eq("status", "active")
        .maybeSingle();
      const hasPlus =
        !!sub && (!sub.expires_at || new Date(sub.expires_at) > new Date());

      const playlistsRes: any = await
        supabase
          .from("audio_playlists")
          .select("id, name, description, cover_image_url, requires_subscription, is_active")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });
      const savesRes: any = await supabase
        .from("playlist_saves")
        .select("playlist_id")
        .eq("user_id", user.id);
      const enrollmentsRes: any = await supabase
          .from("course_enrollments")
          .select("round_id, status, program_rounds(audio_playlist_id)")
          .eq("user_id", user.id)
          .eq("status", "active");
      const itemsRes: any = await supabase.from("audio_playlist_items").select("playlist_id");

      const savedIds = new Set((savesRes.data || []).map((s: any) => s.playlist_id));
      const enrolledPlaylistIds = new Set(
        (enrollmentsRes.data || [])
          .map((e: any) => e.program_rounds?.audio_playlist_id)
          .filter(Boolean)
      );
      const counts: Record<string, number> = {};
      for (const it of itemsRes.data || []) {
        counts[(it as any).playlist_id] = (counts[(it as any).playlist_id] || 0) + 1;
      }

      return (playlistsRes.data || [])
        .filter((p: any) => {
          if (!p.requires_subscription) return true;
          if (hasPlus) return true;
          if (savedIds.has(p.id)) return true;
          if (enrolledPlaylistIds.has(p.id)) return true;
          return false;
        })
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          cover_image_url: p.cover_image_url,
          requires_subscription: p.requires_subscription,
          trackCount: counts[p.id] || 0,
        }));
    },
  });
}

/** How many gifts the user has sent this calendar month. */
export function useMonthlyGiftCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["playlist-gifts-month", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<number> => {
      if (!user?.id) return 0;
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("playlist_gifts")
        .select("id", { count: "exact", head: true })
        .eq("sender_id", user.id)
        .gte("created_at", start.toISOString());
      return count ?? 0;
    },
  });
}

export function useCreatePlaylistGift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (playlistId: string): Promise<{ token: string }> => {
      const { data, error } = await supabase.rpc("create_playlist_gift" as any, {
        p_playlist_id: playlistId,
      });
      if (error) throw error;
      const payload = data as any;
      if (!payload?.token) throw new Error("no_token");
      return { token: payload.token };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["playlist-gifts-month"] });
    },
    onError: (e: any) => {
      const msg = e?.message || "";
      if (msg.includes("monthly_limit_reached")) {
        toast.error("You've used all 3 gifts this month — they refill on the 1st.");
      } else if (msg.includes("no_access_to_playlist")) {
        toast.error("You don't have access to that playlist.");
      } else {
        toast.error("Couldn't create gift.");
      }
    },
  });
}

export interface PublicPlaylistGift {
  id: string;
  sender_first_name: string | null;
  sender_avatar_url: string | null;
  playlist_id: string;
  playlist_name: string;
  playlist_description: string | null;
  playlist_cover_image_url: string | null;
  requires_subscription: boolean;
  created_at: string;
  is_claimed: boolean;
}

export function usePublicPlaylistGift(token: string | undefined) {
  return useQuery({
    queryKey: ["public-playlist-gift", token],
    enabled: !!token,
    queryFn: async (): Promise<PublicPlaylistGift | null> => {
      if (!token) return null;
      const { data, error } = await supabase.rpc("get_playlist_gift_by_token" as any, { t: token });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : (data as any);
      return row || null;
    },
  });
}