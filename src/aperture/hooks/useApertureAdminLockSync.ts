import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const ADMIN_KEY = "rilo:admin-lock-on-rilobiz";
const USER_KEY = "rilo:lock-on-rilobiz";

/**
 * Mirrors the server-side `aperture_user_profile.admin_locked` flag into
 * localStorage so the rest of the app (AppRootRedirect, RealAppShell)
 * can treat it as a hard lock without making async checks on every nav.
 */
export function useApertureAdminLockSync() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) {
      try { localStorage.removeItem(ADMIN_KEY); } catch {}
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from("aperture_user_profile")
        .select("admin_locked, user_locked")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const locked = !!data?.admin_locked;
      const userLocked = !!data?.user_locked;
      try {
        if (locked) localStorage.setItem(ADMIN_KEY, "1");
        else localStorage.removeItem(ADMIN_KEY);
        if (userLocked) localStorage.setItem(USER_KEY, "1");
        else localStorage.removeItem(USER_KEY);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [user?.id]);
}

export function isApertureAdminLocked(): boolean {
  try { return localStorage.getItem(ADMIN_KEY) === "1"; } catch { return false; }
}