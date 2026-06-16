import { Helmet } from "react-helmet-async";
import { Link, useParams, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { RealAppShell } from "@/aperture/components/RealAppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureCard, ApertureMonoLabel,
} from "@/aperture/components/primitives";
import { useApertureBucketsDB } from "@/aperture/hooks/db/useApertureBucketsDB";
import { useApertureMemoryDB } from "@/aperture/hooks/db/useApertureMemoryDB";

/**
 * Bucket detail — a focused entry point that asks one bucket's questions
 * and lets the user see / edit the freeform items in the same bucket.
 * Answers and notes both land in the unified pool.
 */
export default function RealBucketPage() {
  const { slug } = useParams();
  const { buckets, questionsFor, loading: bLoading } = useApertureBucketsDB();
  const { items, loading, saveBucketAnswer, answerFor, sourceFor } = useApertureMemoryDB();

  const bucket = slug ? buckets.find(b => b.slug === slug) : undefined;
  const questions = slug ? questionsFor(slug) : [];
  const freeform = items.filter(i => i.bucket_slug === slug && i.source !== "bucket_answer");

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!slug) return;
    const next: Record<string, string> = {};
    for (const q of questions) next[q.question_key] = answerFor(slug, q.question_key);
    setDrafts(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, questions.length, items.length]);

  if (bLoading) return <RealAppShell><ApertureMonoLabel>Loading…</ApertureMonoLabel></RealAppShell>;
  if (!slug) return <Navigate to="/aperture/app/memory" replace />;
  if (!bucket) return <Navigate to="/aperture/app/memory" replace />;

  function commit(qkey: string, value: string) {
    saveBucketAnswer(bucket!.slug, qkey, value);
  }

  const filled = questions.filter(q => (answerFor(bucket.slug, q.question_key) ?? "").trim().length > 0).length;

  return (
    <>
      <Helmet><title>{bucket.title} · Memory · Aperture</title></Helmet>
      <RealAppShell>
        <div style={{ marginBottom: 8 }}>
          <Link to="/aperture/app/memory" style={{ fontSize: 11, color: "var(--ap-ink-3)", textDecoration: "none", fontFamily: "var(--ap-font-mono)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            ← All buckets
          </Link>
        </div>
        <PageHeader
          index={`BUCKET · ${bucket.source.toUpperCase()}`}
          title={bucket.title}
          sub={bucket.blurb ?? ""}
        />

        {loading ? (
          <ApertureMonoLabel>Loading…</ApertureMonoLabel>
        ) : (
          <>
            {questions.length === 0 ? (
              <ApertureCard padding={20}>
                <p style={{ margin: 0, fontSize: 13.5, color: "var(--ap-ink-2)", lineHeight: 1.55 }}>
                  No pre-set questions for this bucket yet. Items I learn about it from our chats will show up below.
                </p>
              </ApertureCard>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {questions.map(q => {
                  const value = drafts[q.question_key] ?? "";
                  const saved = answerFor(bucket.slug, q.question_key);
                  const dirty = value !== saved;
                  const src = sourceFor(bucket.slug, q.question_key);
                  const isGuess = src === "ai_inferred_pre_onboarding";
                  return (
                    <ApertureCard key={q.id} padding={16}>
                      {isGuess && !dirty && (
                        <div style={{
                          display: "inline-block", marginBottom: 8,
                          fontFamily: "var(--ap-font-mono)", fontSize: 10,
                          letterSpacing: "0.14em", textTransform: "uppercase",
                          color: "var(--ap-ink-3)",
                          border: "1px dashed var(--ap-hairline)",
                          borderRadius: 4, padding: "3px 8px",
                        }}>
                          Guess · confirm or edit
                        </div>
                      )}
                      <label style={{ display: "block", fontSize: 14, color: "var(--ap-ink-1)", fontWeight: 500, marginBottom: 8 }}>
                        {q.prompt}
                      </label>
                      {q.hint && <p style={{ margin: "0 0 8px", fontSize: 12, color: "var(--ap-ink-3)" }}>{q.hint}</p>}
                      <textarea
                        value={value}
                        onChange={e => setDrafts(d => ({ ...d, [q.question_key]: e.target.value }))}
                        onBlur={() => { if (dirty) commit(q.question_key, value); }}
                        rows={2}
                        style={{
                          width: "100%", resize: "vertical",
                          appearance: "none", outline: "none",
                          background: "var(--ap-surface-2)",
                          border: `1px ${isGuess && !dirty ? "dashed" : "solid"} var(--ap-hairline)`,
                          opacity: isGuess && !dirty ? 0.78 : 1,
                          borderRadius: "var(--ap-radius-sm)",
                          padding: "10px 12px",
                          fontSize: 14, color: "var(--ap-ink-1)",
                          fontFamily: "var(--ap-font-sans)", lineHeight: 1.5,
                        }}
                      />
                      <div style={{ marginTop: 8 }}>
                        <ApertureMonoLabel>
                          {saved
                            ? dirty
                              ? "Edited · tap out to save"
                              : isGuess
                                ? "Pre-filled guess · tap to confirm"
                                : "Saved to memory"
                            : "Empty"}
                        </ApertureMonoLabel>
                      </div>
                    </ApertureCard>
                  );
                })}
              </div>
            )}

            {freeform.length > 0 && (
              <section style={{ marginTop: 24 }}>
                <ApertureMonoLabel>Also in this bucket</ApertureMonoLabel>
                <ApertureCard padding={0} style={{ marginTop: 8 }}>
                  {freeform.map((it, idx) => (
                    <div key={it.id} style={{
                      display: "grid", gridTemplateColumns: "auto 1fr",
                      gap: 12, padding: "12px 14px",
                      borderTop: idx === 0 ? "none" : "1px solid var(--ap-hairline)",
                      opacity: it.source === "ai_inferred_pre_onboarding" ? 0.78 : 1,
                    }}>
                      <ApertureMonoLabel color={it.source === "ai_extracted" ? "var(--ap-signal)" : undefined}>
                        {it.source === "ai_extracted"
                          ? "Noticed"
                          : it.source === "ai_inferred_pre_onboarding"
                            ? "Guess"
                            : "Note"}
                      </ApertureMonoLabel>
                      <span style={{ fontSize: 13.5, color: "var(--ap-ink-1)", lineHeight: 1.5 }}>{it.content}</span>
                    </div>
                  ))}
                </ApertureCard>
              </section>
            )}

            {questions.length > 0 && (
              <p style={{ marginTop: 18, fontSize: 12, color: "var(--ap-ink-3)" }}>
                {filled} of {questions.length} questions answered.
              </p>
            )}
          </>
        )}
      </RealAppShell>
    </>
  );
}