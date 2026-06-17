import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface StoredSuggestion {
  id: string;
  title: string;
  why: string;
  prompt: string;
}

/**
 * Suggestion lifecycle states (text column, no DB enum):
 *   - active     → currently visible on Home
 *   - acted_on   → user tapped the suggestion (kept current behaviour)
 *   - completed  → underlying task done; suggestion no longer relevant
 *   - dismissed  → user explicitly swiped/closed it
 *   - expired    → past scheduled_for / expires_at window
 * Helpers below let callers move a suggestion through any of those.
 */
export type SuggestionStatus =
  | "active" | "acted_on" | "completed" | "dismissed" | "expired";

/**
 * Reads persisted home suggestions from `aperture_generated_items`
 * (kind='home_suggestion', status='active'). These are written by the
 * Pass 2 post-onboarding generator, so Home has tailored cards on the
 * very first render — no AI roundtrip needed.
 */
export function useApertureStoredSuggestions() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<StoredSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNow = useCallback(async () => {
    if (!user) { setSuggestions([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("aperture_generated_items")
      .select("id,payload")
      .eq("user_id", user.id)
      .eq("kind", "home_suggestion")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) {
      console.error("stored suggestions error", error);
      setSuggestions([]);
    } else {
      setSuggestions((data ?? []).map((row: any) => ({
        id: row.id,
        title: String(row.payload?.title ?? ""),
        why: String(row.payload?.why ?? ""),
        prompt: String(row.payload?.prompt ?? ""),
      })).filter(s => s.title && s.prompt));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { void fetchNow(); }, [fetchNow]);

  /** Mark a suggestion as acted_on (after the user taps it). */
  const markActed = useCallback(async (id: string) => {
    if (!user) return;
    await setStatus(id, "acted_on");
  }, [user]);

  /** Generic status setter — drops the card from the local list. */
  const setStatus = useCallback(async (id: string, status: SuggestionStatus) => {
    if (!user) return;
    await supabase
      .from("aperture_generated_items")
      .update({ status, status_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);
    setSuggestions(s => s.filter(x => x.id !== id));
  }, [user]);

  const markDismissed = useCallback((id: string) => setStatus(id, "dismissed"), [setStatus]);
  const markCompleted = useCallback((id: string) => setStatus(id, "completed"), [setStatus]);

  return { suggestions, loading, refresh: fetchNow, markActed, markDismissed, markCompleted, setStatus };
}