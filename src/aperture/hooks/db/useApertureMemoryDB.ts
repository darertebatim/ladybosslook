import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { logApertureEvent } from "@/aperture/lib/apertureEvents";

export type MemorySource =
  | "bucket_answer"
  | "ai_extracted"
  | "ai_inferred_pre_onboarding"
  | "freeform"
  | "user_confirmed";

export interface MemoryItem {
  id: string;
  content: string;
  source: MemorySource;
  bucket_slug: string | null;
  question_key: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Reads/writes the unified memory pool (aperture_memory_items).
 * Anything in here is treated as one source of truth by the AI —
 * regardless of whether it came from a bucket question, an AI
 * extraction, or a freeform note.
 */
export function useApertureMemoryDB() {
  const { user } = useAuth();
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("aperture_memory_items")
      .select("id,content,source,bucket_slug,question_key,is_active,created_at,updated_at")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("updated_at", { ascending: false });
    setItems((data ?? []) as MemoryItem[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  /**
   * Upserts a bucket answer. Replaces any prior answer for the same
   * (user, bucket, question) pair via the partial unique index.
   * Pass empty string to delete.
   */
  const saveBucketAnswer = useCallback(async (
    bucketSlug: string, questionKey: string, content: string,
  ) => {
    if (!user) return;
    const trimmed = content.trim();
    if (!trimmed) {
      await supabase.from("aperture_memory_items")
        .delete()
        .eq("user_id", user.id)
        .eq("bucket_slug", bucketSlug)
        .eq("question_key", questionKey);
    } else {
      await supabase.from("aperture_memory_items").upsert({
        user_id: user.id,
        content: trimmed,
        source: "bucket_answer",
        bucket_slug: bucketSlug,
        question_key: questionKey,
      }, { onConflict: "user_id,bucket_slug,question_key" });
      logApertureEvent("memory_item_written", {
        bucket_slug: bucketSlug, question_key: questionKey,
        content: trimmed, source: "bucket_answer",
      });
    }
    await refresh();
  }, [user, refresh]);

  /** Freeform note — not tied to any bucket question. */
  const addFreeformNote = useCallback(async (
    content: string, bucketSlug?: string | null,
  ) => {
    if (!user) return;
    const trimmed = content.trim();
    if (!trimmed) return;
    await supabase.from("aperture_memory_items").insert({
      user_id: user.id,
      content: trimmed,
      source: "freeform",
      bucket_slug: bucketSlug ?? null,
    });
    logApertureEvent("memory_item_written", {
      bucket_slug: bucketSlug ?? null, content: trimmed, source: "freeform",
    });
    await refresh();
  }, [user, refresh]);

  const deleteItem = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from("aperture_memory_items")
      .delete().eq("id", id).eq("user_id", user.id);
    await refresh();
  }, [user, refresh]);

  /** Edit content and/or source of an existing item (owner-scoped). */
  const updateItem = useCallback(async (
    id: string,
    patch: Partial<Pick<MemoryItem, "content" | "source" | "bucket_slug">>,
  ) => {
    if (!user) return;
    await supabase.from("aperture_memory_items")
      .update(patch as any)
      .eq("id", id)
      .eq("user_id", user.id);
    await refresh();
  }, [user, refresh]);

  return {
    items, loading, refresh,
    saveBucketAnswer, addFreeformNote, deleteItem, updateItem,
    /** Convenience lookup by bucket+question — empty string if not set. */
    answerFor(bucketSlug: string, questionKey: string): string {
      return items.find(
        i => i.bucket_slug === bucketSlug && i.question_key === questionKey,
      )?.content ?? "";
    },
    /** All items in a bucket (any source). */
    itemsInBucket(bucketSlug: string | null): MemoryItem[] {
      return items.filter(i => i.bucket_slug === bucketSlug);
    },
  };
}