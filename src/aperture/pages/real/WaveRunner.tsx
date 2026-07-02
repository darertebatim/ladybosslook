import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useParams } from "react-router-dom";
import { RealAppShell } from "@/aperture/components/RealAppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureCard, ApertureMonoLabel, ApertureLoading, ApertureButton, ApertureChip,
} from "@/aperture/components/primitives";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useApertureMemoryDB } from "@/aperture/hooks/db/useApertureMemoryDB";
import { logApertureEvent } from "@/aperture/lib/apertureEvents";

/**
 * WaveRunner — renders a memory-filling wave one question per screen.
 *
 * On mount: reads (or asks the aperture-wave-selector edge function to build)
 * the row in `aperture_waves` for this (user, wave_number). The wave payload
 * is an ordered list of questions with optional [OPTIONS] chips.
 *
 * Each answered question is written to `aperture_memory_items` tagged with
 * `source='ai_extracted'`, `wave_number`, and (if provided) `bucket_slug`.
 */
type WaveQuestion = {
  id: string;
  bucket: string | null;
  bucket_slug?: string | null;
  layer?: string | null;
  role_in_sequence?: "opening" | "middle" | "closing";
  question_text: string;
  options?: string[];
  open_field?: boolean;
  reason?: string;
};

type WavePayload = {
  wave_number: number;
  selected_question_count: number;
  active_layers: string[];
  reasoning_summary: string;
  questions: WaveQuestion[];
};

export default function WaveRunner() {
  const { waveNumber } = useParams<{ waveNumber: string }>();
  const waveNum = Math.max(1, Number(waveNumber || "2"));
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addFreeformNote, saveBucketAnswer, refresh: refreshMem } = useApertureMemoryDB();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<WavePayload | null>(null);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const questions = payload?.questions ?? [];
  const q = questions[i];
  const total = questions.length;
  const done = total > 0 && i >= total;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      // 1. Try to load existing wave row.
      const { data: existing } = await supabase
        .from("aperture_waves")
        .select("*")
        .eq("user_id", user.id)
        .eq("wave_number", waveNum)
        .maybeSingle();
      if (cancelled) return;
      if (existing && existing.question_payload) {
        setPayload(existing.question_payload as unknown as WavePayload);
        setI(Math.min((existing.answered_count as number) ?? 0, ((existing.question_payload as any)?.questions?.length ?? 0)));
        setLoading(false);
        return;
      }
      // 2. Otherwise ask the selector to build one.
      try {
        const { data, error: fnErr } = await supabase.functions.invoke("aperture-wave-selector", {
          body: { wave_number: waveNum },
        });
        if (fnErr) throw fnErr;
        if (cancelled) return;
        if (!data || !data.payload) throw new Error("Selector returned no payload.");
        setPayload(data.payload as WavePayload);
        setI(0);
      } catch (e: any) {
        console.error("[wave] selector failed", e);
        if (!cancelled) setError(e?.message || "Couldn't prepare this wave.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, waveNum]);

  async function persist(qq: WaveQuestion, value: string) {
    if (!user) return;
    const v = value.trim();
    if (!v) return;
    const slug = qq.bucket_slug || slugForBucket(qq.bucket) || "__notes__";
    if (slug === "__notes__") {
      await addFreeformNote(`${qq.question_text} — ${v}`);
    } else {
      await saveBucketAnswer(slug, qq.id, v);
    }
    // Tag the row(s) we just wrote as ai_extracted + wave_number for auditability.
    try {
      await supabase
        .from("aperture_memory_items")
        .update({ source: "ai_extracted", wave_number: waveNum } as any)
        .eq("user_id", user.id)
        .eq("question_key", qq.id);
    } catch { /* non-critical */ }
  }

  async function persistWaveRow(nextAnswered: number, complete: boolean) {
    if (!user || !payload) return;
    await supabase.from("aperture_waves").upsert({
      user_id: user.id,
      wave_number: waveNum,
      status: complete ? "complete" : "in_progress",
      active_layers: payload.active_layers,
      reasoning_summary: payload.reasoning_summary,
      question_payload: payload as any,
      answered_count: nextAnswered,
      selected_at: new Date().toISOString(),
      ...(complete ? { completed_at: new Date().toISOString() } : {}),
    } as any, { onConflict: "user_id,wave_number" });
  }

  async function next() {
    if (!q || busy) return;
    setBusy(true);
    const v = answers[q.id] ?? "";
    await persist(q, v);
    logApertureEvent("wave_answer", { wave_number: waveNum, question_id: q.id, answer: v });
    const nextIdx = i + 1;
    await persistWaveRow(nextIdx, nextIdx >= total);
    setBusy(false);
    if (nextIdx >= total) {
      await refreshMem();
      navigate("/app/rilobiz/app/memory", { replace: true });
      return;
    }
    setI(nextIdx);
  }

  async function skip() {
    if (!q || busy) return;
    logApertureEvent("wave_answer", { wave_number: waveNum, question_id: q.id, answer: null, skipped: true });
    const nextIdx = i + 1;
    await persistWaveRow(nextIdx, nextIdx >= total);
    if (nextIdx >= total) {
      await refreshMem();
      navigate("/app/rilobiz/app/memory", { replace: true });
      return;
    }
    setI(nextIdx);
  }

  async function idk() {
    if (!q || busy || !user) return;
    // Log an "unknown" memory row so the selector doesn't re-ask this next wave.
    try {
      await supabase.from("aperture_memory_items").insert({
        user_id: user.id,
        content: `Owner doesn't know: ${q.question_text}`,
        source: "unknown",
        bucket_slug: q.bucket_slug ?? slugForBucket(q.bucket) ?? null,
        question_key: q.id,
        wave_number: waveNum,
        is_active: true,
      } as any);
    } catch { /* non-critical */ }
    logApertureEvent("wave_answer", { wave_number: waveNum, question_id: q.id, answer: null, unknown: true });
    const nextIdx = i + 1;
    await persistWaveRow(nextIdx, nextIdx >= total);
    if (nextIdx >= total) {
      await refreshMem();
      navigate("/app/rilobiz/app/memory", { replace: true });
      return;
    }
    setI(nextIdx);
  }

  function set(v: string) {
    if (!q) return;
    setAnswers(a => ({ ...a, [q.id]: v }));
  }

  const layersLabel = useMemo(
    () => (payload?.active_layers ?? []).join(" · "),
    [payload?.active_layers],
  );

  return (
    <>
      <Helmet><title>{`Wave ${waveNum} · RiloBiz`}</title></Helmet>
      <RealAppShell>
        <PageHeader
          index={`WAVE ${waveNum}`}
          title={`Wave ${waveNum} — building memory`}
          sub={layersLabel ? `Focus: ${layersLabel}` : "A short round of focused questions."}
          action={total > 0 ? <ApertureChip tone="signal">{Math.min(i + 1, total)} / {total}</ApertureChip> : null}
        />

        {loading ? (
          <ApertureLoading label="Preparing your wave…" />
        ) : error ? (
          <ApertureCard padding={20}>
            <ApertureMonoLabel style={{ color: "var(--ap-danger, #d33)" }}>Couldn't build the wave</ApertureMonoLabel>
            <p style={{ margin: "8px 0 14px", fontSize: 14, color: "var(--ap-ink-2)" }}>{error}</p>
            <ApertureButton variant="ghost" onClick={() => navigate("/app/rilobiz/app/memory")}>Back to memory</ApertureButton>
          </ApertureCard>
        ) : !q ? (
          <ApertureCard padding={20}>
            <p style={{ margin: 0, fontSize: 14, color: "var(--ap-ink-2)" }}>No questions in this wave.</p>
          </ApertureCard>
        ) : (
          <ApertureCard padding={20}>
            <ApertureMonoLabel>{q.bucket || q.layer || "Question"}</ApertureMonoLabel>
            <h2 style={{ margin: "8px 0 14px", fontSize: 20, color: "var(--ap-ink-1)", fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.35 }}>
              {q.question_text}
            </h2>

            {q.open_field || !q.options || q.options.length === 0 ? (
              <textarea rows={4}
                style={{
                  width: "100%", appearance: "none", outline: "none",
                  background: "var(--ap-surface-2)",
                  border: "1px solid var(--ap-hairline)",
                  borderRadius: "var(--ap-radius-sm)",
                  padding: "12px 14px",
                  fontSize: 15, color: "var(--ap-ink-1)",
                  fontFamily: "var(--ap-font-sans)", lineHeight: 1.5, resize: "vertical",
                }}
                placeholder="Type your answer…"
                value={answers[q.id] ?? ""} onChange={e => set(e.target.value)} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {q.options.map(opt => {
                  const on = (answers[q.id] ?? "") === opt;
                  return (
                    <button key={opt} type="button" onClick={() => set(opt)}
                      style={{
                        appearance: "none", cursor: "pointer", textAlign: "left",
                        padding: "12px 14px", borderRadius: "var(--ap-radius-sm)",
                        border: "1px solid " + (on ? "var(--ap-signal)" : "var(--ap-hairline)"),
                        background: on ? "var(--ap-signal)" : "var(--ap-surface-2)",
                        color: on ? "#000" : "var(--ap-ink-1)",
                        fontSize: 14, fontWeight: 500, lineHeight: 1.4,
                      }}>{opt}</button>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
              <ApertureButton variant="ghost" onClick={idk} disabled={busy}>I don't know</ApertureButton>
              <ApertureButton variant="ghost" onClick={skip} disabled={busy}>Skip</ApertureButton>
              <ApertureButton variant="accent" onClick={next} disabled={busy}>
                {busy ? "Saving…" : i + 1 >= total ? "Finish wave" : "Next →"}
              </ApertureButton>
            </div>
          </ApertureCard>
        )}
      </RealAppShell>
    </>
  );
}

/**
 * Very light mapping from the human bucket labels returned by the selector
 * to canonical bucket slugs. Only covers the 14 defaults; industry buckets
 * are stored as freeform notes via the `__notes__` fallback.
 */
function slugForBucket(label: string | null | undefined): string | null {
  if (!label) return null;
  const l = label.toLowerCase();
  if (l.includes("marketing") || l.includes("visibility")) return "marketing";
  if (l.includes("content") || l.includes("media")) return "content";
  if (l.includes("sales")) return "sales";
  if (l.includes("customer") || l.includes("icp")) return "customers";
  if (l.includes("product")) return "products";
  if (l.includes("operation")) return "operations";
  if (l.includes("team") || l.includes("people")) return "team";
  if (l.includes("partner")) return "partners";
  if (l.includes("money") || l.includes("finance") || l.includes("revenue")) return "money";
  if (l.includes("competitor")) return "competitors";
  if (l.includes("tool")) return "tools";
  if (l.includes("vision") || l.includes("direction")) return "vision";
  if (l.includes("basic")) return "basics";
  return null;
}