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
  const [skipCount, setSkipCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) { setQuestion(null); setLoading(false); return; }
    setLoading(true);

    const [{ data: qs }, { data: answered }, { data: gaps }, { data: anyItems }] = await Promise.all([
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
      // Skipped + "I don't know" gaps — we keep these out of the pool for a
      // cool-down window so we don't nag the user, BUT we let them resurface
      // earlier if the bucket has been dormant the whole time.
      supabase
        .from("aperture_memory_items")
        .select("bucket_slug,content,source,created_at")
        .eq("user_id", user.id)
        .in("source", ["skipped", "unknown"])
        .order("created_at", { ascending: false }),
      // Any activity per bucket — used to decide if a bucket is "dormant".
      supabase
        .from("aperture_memory_items")
        .select("bucket_slug,created_at,source")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    const answeredKeys = new Set(
      (answered ?? []).map(a => `${a.bucket_slug}:${a.question_key}`),
    );

    // Build deferral set: prompt-text → earliest allowed timestamp.
    const now = Date.now();
    const DAY = 86_400_000;
    const deferredPrompts = new Map<string, number>(); // key: `${slug}:${promptLower}`
    (gaps ?? []).forEach((g: any) => {
      const ageDays = (now - new Date(g.created_at).getTime()) / DAY;
      const window = g.source === "skipped" ? 21 : 30;
      // "content" stores the question prompt (skipped) or "Owner doesn't know: <prompt>" (unknown).
      const promptText = String(g.content ?? "")
        .replace(/^Owner doesn't know:\s*/i, "")
        .trim().toLowerCase();
      if (!promptText) return;
      // Dormant-bucket override: if no activity in this bucket since the gap
      // was logged, allow the question to resurface immediately.
      const bucketActiveSince = (anyItems ?? []).some((it: any) =>
        it.bucket_slug === g.bucket_slug &&
        it.source !== "skipped" && it.source !== "unknown" &&
        new Date(it.created_at).getTime() > new Date(g.created_at).getTime(),
      );
      if (ageDays >= window || !bucketActiveSince === false) {
        // either past the window OR the bucket has been active since (skip the defer)
      }
      const allowResurface = ageDays >= window || !bucketActiveSince;
      if (!allowResurface) {
        const key = `${g.bucket_slug}:${promptText}`;
        // keep the most recent (largest) defer time
        const until = new Date(g.created_at).getTime() + window * DAY;
        if (!deferredPrompts.has(key) || (deferredPrompts.get(key) ?? 0) < until) {
          deferredPrompts.set(key, until);
        }
      }
    });

    const pool = (qs ?? []).filter(
      q => !answeredKeys.has(`${q.bucket_slug}:${q.question_key}`),
    ).filter(
      q => !deferredPrompts.has(`${q.bucket_slug}:${String(q.prompt ?? "").trim().toLowerCase()}`),
    );

    if (pool.length === 0) {
      setQuestion(null);
      setLoading(false);
      return;
    }

    // Deterministic daily pick — stable per (user, day). Bump skipCount
    // to advance to a different question within the same day.
    const day = Math.floor(Date.now() / 86_400_000);
    const seed = hashString(`${user.id}:${day}:${skipCount}`);
    const idx = seed % pool.length;
    setQuestion(pool[idx] as DailyBucketQuestion);
    setLoading(false);
  }, [user, skipCount]);

  useEffect(() => { refresh(); }, [refresh]);

  const skip = useCallback(() => setSkipCount(c => c + 1), []);

  return { question, loading, refresh, skip };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}