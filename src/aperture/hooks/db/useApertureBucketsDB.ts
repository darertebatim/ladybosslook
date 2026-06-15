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
    const [b, q] = await Promise.all([
      supabase.from("aperture_buckets")
        .select("slug,title,blurb,glyph,sort_order,source,user_id,target_count")
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .order("sort_order", { ascending: true }),
      supabase.from("aperture_bucket_questions")
        .select("id,bucket_slug,question_key,prompt,hint,input_kind,sort_order,user_id")
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .order("sort_order", { ascending: true }),
    ]);
    setBuckets((b.data ?? []) as ApertureBucketRow[]);
    setQuestions((q.data ?? []) as ApertureQuestionRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const questionsFor = useCallback(
    (slug: string) => questions.filter(q => q.bucket_slug === slug),
    [questions],
  );

  return { buckets, questions, questionsFor, loading, refresh };
}