import { Helmet } from "react-helmet-async";
import { Link, useParams, Navigate } from "react-router-dom";
import { AppShell } from "@/aperture/components/AppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureChip, ApertureMonoLabel, ApertureCard, ApertureButton,
} from "@/aperture/components/primitives";
import { getBucket } from "@/aperture/data/buckets";
import { useApertureMemory } from "@/aperture/hooks/useApertureMemory";
import { useEffect, useState } from "react";

/**
 * Bucket detail — the questionnaire interface. Two fill modes are visible
 * in the UI: (1) the user types answers directly, and (2) an "AI noticed"
 * suggestion card surfaces a gap question the AI generated from prior chats.
 */
export default function BucketPage() {
  const { slug } = useParams();
  const bucket = slug ? getBucket(slug) : undefined;
  const { getBucket: getState, saveAnswer, clearBucket } = useApertureMemory();

  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!bucket) return;
    const state = getState(bucket.slug);
    setDrafts(state.answers);
  }, [bucket?.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!bucket) return <Navigate to="/aperture/brand/mockup/memory" replace />;

  const state = getState(bucket.slug);

  function commit(qid: string, value: string) {
    saveAnswer(bucket!.slug, qid, value);
  }

  return (
    <>
      <Helmet>
        <title>{bucket.title} · Memory · RiloBiz</title>
        <meta name="description" content={bucket.longBlurb} />
      </Helmet>
      <AppShell>
        <div style={{ marginBottom: 8 }}>
          <Link to="/aperture/brand/mockup/memory" style={{ fontSize: 11, color: "var(--ap-ink-3)", textDecoration: "none", fontFamily: "var(--ap-font-mono)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            ← All buckets
          </Link>
        </div>
        <PageHeader
          index={`${bucket.index} · BUCKET`}
          title={bucket.title}
          sub={bucket.longBlurb}
          action={<ApertureChip tone={state.status === "full" ? "live" : state.status === "empty" ? "neutral" : "signal"}>
            {state.status === "empty" ? "Empty" : `${state.filled} / ${state.total} filled`}
          </ApertureChip>}
        />

        {/* AI-surfaced gap question — third fill mechanism */}
        {bucket.aiSurfaced && state.status !== "full" && (
          <ApertureCard padding={16} style={{ marginBottom: 20, borderColor: "var(--ap-signal-soft)" }}>
            <div style={{ display: "flex", gap: 12 }}>
              <span className="ap-pulse" style={{ width: 8, height: 8, borderRadius: 999, background: "var(--ap-signal)", marginTop: 6, flexShrink: 0 }} />
              <div>
                <ApertureMonoLabel color="var(--ap-signal)">RiloBiz noticed</ApertureMonoLabel>
                <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--ap-ink-1)", lineHeight: 1.5 }}>
                  {bucket.aiSurfaced}
                </p>
              </div>
            </div>
          </ApertureCard>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {bucket.questions.map(q => {
            const value = drafts[q.id] ?? "";
            const saved = state.answers[q.id] ?? "";
            const dirty = value !== saved;
            return (
              <ApertureCard key={q.id} padding={16}>
                <label style={{ display: "block", fontSize: 14, color: "var(--ap-ink-1)", fontWeight: 500, marginBottom: 8 }}>
                  {q.label}
                </label>
                {q.hint && (
                  <p style={{ margin: "0 0 8px", fontSize: 12, color: "var(--ap-ink-3)" }}>{q.hint}</p>
                )}
                {q.multiline ? (
                  <textarea
                    value={value}
                    onChange={e => setDrafts(d => ({ ...d, [q.id]: e.target.value }))}
                    onBlur={() => dirty && commit(q.id, value)}
                    placeholder={q.placeholder}
                    rows={3}
                    style={{
                      width: "100%", resize: "vertical",
                      appearance: "none", outline: "none",
                      background: "var(--ap-surface-2)",
                      border: "1px solid var(--ap-hairline)",
                      borderRadius: "var(--ap-radius-sm)",
                      padding: "10px 12px",
                      fontSize: 14, color: "var(--ap-ink-1)",
                      fontFamily: "var(--ap-font-sans)", lineHeight: 1.5,
                    }}
                  />
                ) : (
                  <input
                    value={value}
                    onChange={e => setDrafts(d => ({ ...d, [q.id]: e.target.value }))}
                    onBlur={() => dirty && commit(q.id, value)}
                    placeholder={q.placeholder}
                    style={{
                      width: "100%", appearance: "none", outline: "none",
                      background: "var(--ap-surface-2)",
                      border: "1px solid var(--ap-hairline)",
                      borderRadius: "var(--ap-radius-sm)",
                      padding: "10px 12px",
                      fontSize: 14, color: "var(--ap-ink-1)",
                      fontFamily: "var(--ap-font-sans)",
                    }}
                  />
                )}
                <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <ApertureMonoLabel>
                    {saved ? (dirty ? "Edited · tap out to save" : "Saved to memory") : "Empty"}
                  </ApertureMonoLabel>
                  {saved && !dirty && (
                    <ApertureMonoLabel color="var(--ap-ink-3)">
                      ✦ AI can use this
                    </ApertureMonoLabel>
                  )}
                </div>
              </ApertureCard>
            );
          })}
        </div>

        {state.filled > 0 && (
          <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
            <ApertureButton variant="ghost" onClick={() => { clearBucket(bucket.slug); setDrafts({}); }}>
              Clear this bucket
            </ApertureButton>
          </div>
        )}
      </AppShell>
    </>
  );
}