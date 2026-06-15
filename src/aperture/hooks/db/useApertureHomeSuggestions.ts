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
  memorySig: number;
  suggestions: HomeSuggestion[];
}

/**
 * AI-personalized next-actions for Home. Cached per (user, day, memory
 * size) in localStorage so we don't burn credits on every Home visit.
 * Pass `refresh()` to force a fresh generation.
 */
export function useApertureHomeSuggestions(memoryCount: number) {
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
      if (cached.day === today && cached.memorySig === memoryCount) {
        setSuggestions(cached.suggestions ?? []);
      }
    } catch { /* ignore */ }
  }, [cacheKey, today, memoryCount]);

  const fetchNow = useCallback(async (force = false) => {
    if (!user || !cacheKey) return;
    if (memoryCount === 0) { setSuggestions([]); return; }
    if (!force) {
      try {
        const raw = localStorage.getItem(cacheKey);
        if (raw) {
          const cached = JSON.parse(raw) as CachedPayload;
          if (cached.day === today && cached.memorySig === memoryCount && cached.suggestions?.length) {
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
        day: today, memorySig: memoryCount, suggestions: list,
      } satisfies CachedPayload));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load suggestions.");
    } finally {
      setLoading(false);
    }
  }, [user, cacheKey, today, memoryCount]);

  // Auto-fetch once per day per memory snapshot.
  useEffect(() => {
    if (!user || memoryCount === 0) return;
    fetchNow(false);
  }, [user, memoryCount, fetchNow]);

  return { suggestions, loading, error, refresh: () => fetchNow(true) };
}