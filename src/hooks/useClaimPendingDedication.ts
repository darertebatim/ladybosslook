import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { APPSFLYER_ATTRIBUTION_EVENT, getStoredAttribution } from "@/lib/appsflyer";

const STORAGE_KEY = "pendingDedicationToken";

/** Call from anywhere (web or native deep-link) to remember a token until auth. */
export function stashDedicationToken(token: string) {
  try { localStorage.setItem(STORAGE_KEY, token); } catch { /* noop */ }
}

/**
 * Mounted once inside /app providers. When a user becomes authenticated and we
 * have a pending dedication token (URL ?dedication=TOKEN or localStorage),
 * claim it and route to /app/friends?dedication={id}.
 */
export function useClaimPendingDedication() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const ran = useRef(false);
  const [tokenSignal, setTokenSignal] = useState(0);

  useEffect(() => {
    const syncDedicationTokenFromAttribution = () => {
      const attribution = getStoredAttribution();
      if (attribution?.deepLinkValue === "dedication" && attribution.dedicationToken) {
        stashDedicationToken(attribution.dedicationToken);
        ran.current = false;
        setTokenSignal((v) => v + 1);
      }
    };

    syncDedicationTokenFromAttribution();
    window.addEventListener(APPSFLYER_ATTRIBUTION_EVENT, syncDedicationTokenFromAttribution);
    return () => {
      window.removeEventListener(APPSFLYER_ATTRIBUTION_EVENT, syncDedicationTokenFromAttribution);
    };
  }, []);

  useEffect(() => {
    if (!user?.id || ran.current) return;
    let token: string | null = null;
    try {
      const params = new URLSearchParams(window.location.search);
      token = params.get("dedication");
      if (!token) token = localStorage.getItem(STORAGE_KEY);
    } catch { /* noop */ }
    if (!token) return;
    ran.current = true;
    (async () => {
      try {
        const { data, error } = await supabase.rpc("claim_dedication" as any, { t: token });
        if (error) throw error;
        const payload = data as any;
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
        qc.invalidateQueries({ queryKey: ["dedications-received"] });
        qc.invalidateQueries({ queryKey: ["friendships"] });
        toast.success("Care Package unwrapped 💝");
        if (payload?.dedication_id) {
          navigate(`/app/friends?dedication=${payload.dedication_id}`, { replace: true });
        } else {
          navigate(`/app/friends`, { replace: true });
        }
      } catch (e: any) {
        const msg = e?.message || "";
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
        if (msg.includes("self_claim_blocked")) {
          toast.info("That Care Package was from you 💛");
        } else if (msg.includes("already_claimed")) {
          toast.info("This Care Package was already opened.");
        } else if (msg.includes("expired")) {
          toast.info("This Care Package has expired.");
        } else if (msg.includes("not_found")) {
          // silent
        } else {
          console.warn("[claimDedication] failed:", e);
        }
      }
    })();
  }, [user?.id, navigate, qc, tokenSignal]);
}