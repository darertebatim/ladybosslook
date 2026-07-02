import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ApertureUserProfileRow {
  user_id: string;
  quick_onboarded_at: string | null;
  full_onboarded_at: string | null;
  essential_onboarded_at: string | null;
  industry_slug: string | null;
  owner_name: string | null;
  business_name: string | null;
  website: string | null;
  instagram: string | null;
}

export function useApertureUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ApertureUserProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setProfile(null); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("aperture_user_profile")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setProfile((data ?? null) as ApertureUserProfileRow | null);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const upsert = useCallback(async (patch: Partial<ApertureUserProfileRow>) => {
    if (!user) return;
    const { data } = await supabase
      .from("aperture_user_profile")
      .upsert({ user_id: user.id, ...patch }, { onConflict: "user_id" })
      .select("*")
      .maybeSingle();
    if (data) setProfile(data as ApertureUserProfileRow);
  }, [user]);

  return { profile, loading, refresh, upsert };
}