import { useCallback, useEffect, useState } from "react";
import { BUCKETS, type BucketSlug } from "@/aperture/data/buckets";

/**
 * Aperture memory store — localStorage only (design demo).
 *
 * Shape:
 *   answers: Record<BucketSlug, Record<questionId, string>>
 *
 * A bucket's "fill" is the share of its questions that have a non-empty answer.
 * Buckets are categorized:
 *   empty   — 0 answers
 *   partial — some answers
 *   full    — every question answered
 */

const STORAGE_KEY = "aperture.memory.v1";

export type BucketStatus = "empty" | "partial" | "full";

export interface BucketState {
  slug: BucketSlug;
  answers: Record<string, string>;
  filled: number;
  total: number;
  status: BucketStatus;
}

type MemoryShape = Record<BucketSlug, Record<string, string>>;

function readStore(): MemoryShape {
  if (typeof window === "undefined") return {} as MemoryShape;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {} as MemoryShape;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as MemoryShape;
    return {} as MemoryShape;
  } catch {
    return {} as MemoryShape;
  }
}

function writeStore(next: MemoryShape) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("aperture:memory-changed"));
  } catch {
    /* noop */
  }
}

function computeBucketState(slug: BucketSlug, store: MemoryShape): BucketState {
  const bucket = BUCKETS.find(b => b.slug === slug)!;
  const answers = store[slug] ?? {};
  const total = bucket.questions.length;
  const filled = bucket.questions.filter(q => (answers[q.id] ?? "").trim().length > 0).length;
  const status: BucketStatus = filled === 0 ? "empty" : filled === total ? "full" : "partial";
  return { slug, answers, filled, total, status };
}

export function useApertureMemory() {
  const [store, setStore] = useState<MemoryShape>(() => readStore());

  useEffect(() => {
    const onChange = () => setStore(readStore());
    window.addEventListener("aperture:memory-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("aperture:memory-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const buckets = BUCKETS.map(b => computeBucketState(b.slug, store));
  const totalQuestions = BUCKETS.reduce((sum, b) => sum + b.questions.length, 0);
  const totalAnswered = buckets.reduce((sum, b) => sum + b.filled, 0);
  const completion = totalQuestions === 0 ? 0 : Math.round((totalAnswered / totalQuestions) * 100);

  const getBucket = useCallback((slug: BucketSlug) => computeBucketState(slug, store), [store]);

  const saveAnswer = useCallback((slug: BucketSlug, questionId: string, value: string) => {
    const current = readStore();
    const bucket = { ...(current[slug] ?? {}) };
    if (value.trim().length === 0) delete bucket[questionId];
    else bucket[questionId] = value;
    const next: MemoryShape = { ...current, [slug]: bucket };
    writeStore(next);
    setStore(next);
  }, []);

  const clearBucket = useCallback((slug: BucketSlug) => {
    const current = readStore();
    const next: MemoryShape = { ...current };
    delete next[slug];
    writeStore(next);
    setStore(next);
  }, []);

  /** Convenience — flattened "what we know" facts for chat header & rail. */
  const facts = buckets.flatMap(b => {
    const bucket = BUCKETS.find(x => x.slug === b.slug)!;
    return Object.entries(b.answers).map(([qid, value]) => {
      const q = bucket.questions.find(x => x.id === qid);
      return { bucket: bucket.title, label: q?.label ?? qid, value };
    });
  });

  return { buckets, getBucket, saveAnswer, clearBucket, completion, totalAnswered, totalQuestions, facts };
}