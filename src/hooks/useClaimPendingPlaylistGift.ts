import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const STORAGE_KEY = "pendingPlaylistGiftToken";

export function stashPlaylistGiftToken(token: string) {
  try { localStorage.setItem(STORAGE_KEY, token); } catch { /* noop */ }
}

export function useClaimPendingPlaylistGift() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const ran = useRef(false);

  useEffect(() => {
    if (!user?.id || ran.current) return;
    let token: string | null = null;
    try {
      const params = new URLSearchParams(window.location.search);
      token = params.get("playlist_gift");
      if (!token) token = localStorage.getItem(STORAGE_KEY);
    } catch { /* noop */ }
    if (!token) return;
    ran.current = true;
    (async () => {
      try {
        const { data, error } = await supabase.rpc("claim_playlist_gift" as any, { t: token });
        if (error) throw error;
        const payload = data as any;
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
        qc.invalidateQueries({ queryKey: ["player-data"] });
        toast.success("Playlist unlocked — it's yours forever 💫");
        if (payload?.playlist_id) {
          navigate(`/app/listen/playlist/${payload.playlist_id}`, { replace: true });
        } else {
          navigate(`/app/listen`, { replace: true });
        }
      } catch (e: any) {
        const msg = e?.message || "";
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
        if (msg.includes("self_claim_blocked")) toast.info("That gift was from you 💛");
        else if (msg.includes("already_claimed")) toast.info("This gift was already opened.");
        else if (msg.includes("not_found")) { /* silent */ }
        else console.warn("[claimPlaylistGift] failed:", e);
      }
    })();
  }, [user?.id, navigate, qc]);
}