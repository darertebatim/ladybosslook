import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ApertureBucketRow {
  slug: string;
  title: string;
  blurb: string | null;
  glyph: string | null;
  sort_order: number;
  source: string;
  user_id: string | null;
  target_count: number;
  kind: string;
  industry_group_slug: string | null;
  metadata: any;
}

export interface ApertureQuestionRow {
  id: string;
  bucket_slug: string;
  question_key: string;
  prompt: string;
  hint: string | null;
  input_kind: string;
  sort_order: number;
  user_id: string | null;
  layer: string | null;
}

/**
 * Lists every bucket the current user can see: shared catalog buckets
 * (user_id IS NULL) plus their own (user_id = auth.uid()).
 * Defaults are intentionally empty for now — the real default set will
 * arrive later. UI must handle the empty case gracefully.
 */
export function useApertureBucketsDB() {
  const { user } = useAuth();
  const [buckets, setBuckets] = useState<ApertureBucketRow[]>([]);
  const [questions, setQuestions] = useState<ApertureQuestionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setBuckets([]); setQuestions([]); setLoading(false); return; }
    setLoading(true);
    const [b, q, profileRes, industriesRes] = await Promise.all([
      supabase.from("aperture_buckets")
        .select("slug,title,blurb,glyph,sort_order,source,user_id,target_count,kind,industry_group_slug,metadata")
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .order("sort_order", { ascending: true }),
      supabase.from("aperture_bucket_questions")
        .select("id,bucket_slug,question_key,prompt,hint,input_kind,sort_order,user_id,layer")
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .order("sort_order", { ascending: true }),
      supabase.from("aperture_user_profile")
        .select("industry_slug").eq("user_id", user.id).maybeSingle(),
      supabase.from("aperture_industries").select("slug,group_slug"),
    ]);
    const userIndustrySlug = (profileRes.data as any)?.industry_slug ?? null;
    const industryRow = (industriesRes.data ?? []).find(
      (i: any) => i.slug === userIndustrySlug,
    );
    const userGroupSlug = (industryRow as any)?.group_slug ?? null;

    // Hide industry buckets that don't match the user's industry group.
    // Default buckets (kind='default') always show; user-owned buckets always show.
    const allBuckets = (b.data ?? []) as ApertureBucketRow[];
    const visibleBuckets = allBuckets.filter(bk => {
      if (bk.kind !== "industry") return true;
      if (!userGroupSlug) return false;
      return bk.industry_group_slug === userGroupSlug;
    });
    const visibleSlugs = new Set(visibleBuckets.map(bk => bk.slug));
    const allQs = (q.data ?? []) as ApertureQuestionRow[];
    const visibleQs = allQs.filter(qq => visibleSlugs.has(qq.bucket_slug));

    setBuckets(visibleBuckets);
    setQuestions(visibleQs);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const questionsFor = useCallback(
    (slug: string) => questions.filter(q => q.bucket_slug === slug),
    [questions],
  );

  return { buckets, questions, questionsFor, loading, refresh };
}