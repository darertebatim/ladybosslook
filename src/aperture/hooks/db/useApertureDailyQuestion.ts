import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DailyBucketQuestion {
  id: string;
  bucket_slug: string;
  question_key: string;
  prompt: string;
  layer: string | null;
  audience: string | null;
}

/**
 * Picks one bucket question per calendar day that the user hasn't
 * already answered. Deterministic per (user, day) so it doesn't shift
 * mid-day, but rotates daily.
 */
export function useApertureDailyQuestion() {
  const { user } = useAuth();
  const [question, setQuestion] = useState<DailyBucketQuestion | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setQuestion(null); setLoading(false); return; }
    setLoading(true);

    const [{ data: qs }, { data: answered }] = await Promise.all([
      supabase
        .from("aperture_bucket_questions")
        .select("id,bucket_slug,question_key,prompt,layer,audience")
        .eq("is_active", true),
      supabase
        .from("aperture_memory_items")
        .select("bucket_slug,question_key")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .not("question_key", "is", null),
    ]);

    const answeredKeys = new Set(
      (answered ?? []).map(a => `${a.bucket_slug}:${a.question_key}`),
    );
    const pool = (qs ?? []).filter(
      q => !answeredKeys.has(`${q.bucket_slug}:${q.question_key}`),
    );

    if (pool.length === 0) {
      setQuestion(null);
      setLoading(false);
      return;
    }

    // Deterministic daily pick — stable per (user, day).
    const day = Math.floor(Date.now() / 86_400_000);
    const seed = hashString(`${user.id}:${day}`);
    const idx = seed % pool.length;
    setQuestion(pool[idx] as DailyBucketQuestion);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { question, loading, refresh };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}