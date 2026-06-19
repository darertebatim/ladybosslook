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
      // Update-then-insert. Race-safe against parallel writes for the same
      // (user, bucket, question) tuple: if update affects 0 rows, insert;
      // if insert hits the unique constraint, fall back to update.
      const { data: updated, error: updateErr } = await supabase
        .from("aperture_memory_items")
        .update({ content: trimmed, source: "bucket_answer", is_active: true })
        .eq("user_id", user.id)
        .eq("bucket_slug", bucketSlug)
        .eq("question_key", questionKey)
        .select("id");
      if (updateErr) {
        console.error("[memory] update failed", updateErr);
        throw updateErr;
      }
      if (!updated || updated.length === 0) {
        const { error: insertErr } = await supabase
          .from("aperture_memory_items")
          .insert({
            user_id: user.id,
            content: trimmed,
            source: "bucket_answer",
            bucket_slug: bucketSlug,
            question_key: questionKey,
          });
        if (insertErr && insertErr.code === "23505") {
          // Concurrent writer beat us — retry as update.
          await supabase.from("aperture_memory_items")
            .update({ content: trimmed, source: "bucket_answer", is_active: true })
            .eq("user_id", user.id)
            .eq("bucket_slug", bucketSlug)
            .eq("question_key", questionKey);
        } else if (insertErr) {
          console.error("[memory] insert failed", insertErr);
          throw insertErr;
        }
      }
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

  /**
   * Memory is additive — corrections write a NEW timestamped row and
   * deactivate the old one. Old rows stay in the table (is_active=false)
   * so the Fact View can show a History expander.
   */
  const writeReplacement = useCallback(async (
    oldId: string,
    nextContent: string,
    nextSource: MemorySource,
  ): Promise<void> => {
    if (!user) return;
    const { data: old } = await supabase
      .from("aperture_memory_items")
      .select("id,bucket_slug,question_key,content")
      .eq("id", oldId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!old) return;
    const trimmed = nextContent.trim();
    if (!trimmed) return;

    const { error: insErr } = await supabase
      .from("aperture_memory_items")
      .insert({
        user_id: user.id,
        content: trimmed,
        source: nextSource,
        bucket_slug: (old as any).bucket_slug,
        question_key: (old as any).question_key,
        is_active: true,
      });
    if (insErr) {
      // 23505 = unique conflict on (user, bucket, question_key) — fall back
      // to in-place update so we never end up with two active rows for
      // the same answer slot.
      if ((insErr as any).code === "23505") {
        await supabase.from("aperture_memory_items")
          .update({ content: trimmed, source: nextSource, is_active: true })
          .eq("user_id", user.id)
          .eq("bucket_slug", (old as any).bucket_slug)
          .eq("question_key", (old as any).question_key);
      } else {
        console.error("[memory] replacement insert failed", insErr);
        throw insErr;
      }
    }

    // Deactivate the old row (kept for history).
    await supabase.from("aperture_memory_items")
      .update({ is_active: false })
      .eq("id", oldId)
      .eq("user_id", user.id);

    logApertureEvent("memory_item_written", {
      bucket_slug: (old as any).bucket_slug,
      question_key: (old as any).question_key,
      content: trimmed,
      source: nextSource,
      replaces: oldId,
    });

    await refresh();
  }, [user, refresh]);

  /** Flip an `ai_inferred_pre_onboarding` guess to `user_confirmed`. */
  const confirmGuess = useCallback(async (id: string) => {
    const target = items.find(i => i.id === id);
    if (!target) return;
    await writeReplacement(id, target.content, "user_confirmed");
  }, [items, writeReplacement]);

  /** Edit a fact's content. Writes a new row, deactivates the old. */
  const editFact = useCallback(async (id: string, nextContent: string) => {
    const target = items.find(i => i.id === id);
    if (!target) return;
    // Preserve the original source class, except guesses become confirmed
    // once the user has actively edited them.
    const nextSource: MemorySource =
      target.source === "ai_inferred_pre_onboarding"
        ? "user_confirmed"
        : target.source;
    await writeReplacement(id, nextContent, nextSource);
  }, [items, writeReplacement]);

  /** Soft-delete (kept in history). */
  const deactivateFact = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from("aperture_memory_items")
      .update({ is_active: false })
      .eq("id", id)
      .eq("user_id", user.id);
    await refresh();
  }, [user, refresh]);

  /**
   * Returns every row (active + inactive) that shares this bucket+question
   * slot, ordered newest first. Used by the Fact View's History expander.
   * Falls back to content-match when question_key is null (freeform notes).
   */
  const historyFor = useCallback(async (
    bucketSlug: string,
    questionKey: string | null,
  ): Promise<MemoryItem[]> => {
    if (!user) return [];
    let q = supabase.from("aperture_memory_items")
      .select("id,content,source,bucket_slug,question_key,is_active,created_at,updated_at")
      .eq("user_id", user.id)
      .eq("bucket_slug", bucketSlug)
      .order("updated_at", { ascending: false });
    if (questionKey) q = q.eq("question_key", questionKey);
    else q = q.is("question_key", null);
    const { data } = await q;
    return (data ?? []) as MemoryItem[];
  }, [user]);

  return {
    items, loading, refresh,
    saveBucketAnswer, addFreeformNote, deleteItem, updateItem,
    confirmGuess, editFact, deactivateFact, historyFor,
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
    /** Source tag for a bucket+question answer (or null). */
    sourceFor(bucketSlug: string, questionKey: string): MemorySource | null {
      const m = items.find(
        i => i.bucket_slug === bucketSlug && i.question_key === questionKey,
      );
      return (m?.source as MemorySource | undefined) ?? null;
    },
  };
}