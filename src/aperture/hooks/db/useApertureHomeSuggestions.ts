import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface HomeSuggestion {
  title: string;
  why: string;
  prompt: string;
}

interface CachedPayload {
  day: number;
  memorySig: string;
  suggestions: HomeSuggestion[];
}

/**
 * AI-personalized next-actions for Home. Cached per (user, day, memory
 * signature) in localStorage so we don't burn credits on every Home
 * visit. `memorySig` is a stable string hash of meaningful user-authored
 * facts — NOT a raw item count — so noisy background writes (e.g.
 * ai_extracted facts from chat) don't bust the daily cache.
 * Pass `refresh()` to force a fresh generation.
 */
export function useApertureHomeSuggestions(memorySig: string) {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<HomeSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = user ? `aperture:home-suggestions:${user.id}` : null;
  const today = Math.floor(Date.now() / 86_400_000);

  // Hydrate from cache.
  useEffect(() => {
    if (!cacheKey) return;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return;
      const cached = JSON.parse(raw) as CachedPayload;
      if (cached.day === today && cached.memorySig === memorySig) {
        setSuggestions(cached.suggestions ?? []);
      }
    } catch { /* ignore */ }
  }, [cacheKey, today, memorySig]);

  const fetchNow = useCallback(async (force = false) => {
    if (!user || !cacheKey) return;
    if (!memorySig || memorySig === "empty") { setSuggestions([]); return; }
    if (!force) {
      try {
        const raw = localStorage.getItem(cacheKey);
        if (raw) {
          const cached = JSON.parse(raw) as CachedPayload;
          if (cached.day === today && cached.memorySig === memorySig && cached.suggestions?.length) {
            setSuggestions(cached.suggestions);
            return;
          }
        }
      } catch { /* ignore */ }
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.functions.invoke("aperture-home-suggestions");
      if (err) throw err;
      const list = Array.isArray((data as any)?.suggestions) ? (data as any).suggestions : [];
      setSuggestions(list);
      localStorage.setItem(cacheKey, JSON.stringify({
        day: today, memorySig, suggestions: list,
      } satisfies CachedPayload));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load suggestions.");
    } finally {
      setLoading(false);
    }
  }, [user, cacheKey, today, memorySig]);

  // Auto-fetch once per day per memory snapshot.
  useEffect(() => {
    if (!user || !memorySig || memorySig === "empty") return;
    fetchNow(false);
  }, [user, memorySig, fetchNow]);

  return { suggestions, loading, error, refresh: () => fetchNow(true) };
}