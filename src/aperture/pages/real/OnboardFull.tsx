import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { RealAppShell } from "@/aperture/components/RealAppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureCard, ApertureMonoLabel, ApertureLoading, ApertureButton, ApertureChip,
} from "@/aperture/components/primitives";
import { useApertureOnboardingDB } from "@/aperture/hooks/db/useApertureOnboardingDB";
import { useApertureUserProfile } from "@/aperture/hooks/db/useApertureUserProfile";
import { useApertureMemoryDB } from "@/aperture/hooks/db/useApertureMemoryDB";

/**
 * Full questionnaire — section-by-section wizard. Each section is
 * shown on its own screen; answers fan out to all target buckets.
 * "Skip" on every question, "Skip section" advances to next section.
 */
export default function OnboardFull() {
  const navigate = useNavigate();
  const { questions, loading } = useApertureOnboardingDB("full");
  const { upsert: upsertProfile } = useApertureUserProfile();
  const { saveBucketAnswer } = useApertureMemoryDB();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sectionIdx, setSectionIdx] = useState(0);
  const [busy, setBusy] = useState(false);

  const sections = useMemo(() => {
    const map = new Map<string, typeof questions>();
    for (const q of questions) {
      const key = q.section ?? "General";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(q);
    }
    return [...map.entries()];
  }, [questions]);

  async function persistSection(qs: typeof questions) {
    const writes: Promise<unknown>[] = [];
    for (const q of qs) {
      const v = (answers[q.question_key] ?? "").trim();
      if (!v) continue;
      const targets = q.bucket_slugs && q.bucket_slugs.length > 0 ? q.bucket_slugs : ["basics"];
      for (const target of targets) {
        writes.push(saveBucketAnswer(target, q.question_key, v));
        for (const bqKey of (q.bucket_question_keys ?? [])) {
          writes.push(saveBucketAnswer(target, bqKey, v));
        }
      }
    }
    if (writes.length > 0) await Promise.all(writes);
  }

  async function next() {
    if (busy) return;
    setBusy(true);
    const [, qs] = sections[sectionIdx] ?? [null, [] as any];
    await persistSection(qs);
    setBusy(false);
    if (sectionIdx + 1 >= sections.length) {
      await upsertProfile({ full_onboarded_at: new Date().toISOString() });
      navigate("/aperture/app/memory", { replace: true });
    } else {
      setSectionIdx(sectionIdx + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function skipSection() {
    if (sectionIdx + 1 >= sections.length) {
      upsertProfile({ full_onboarded_at: new Date().toISOString() });
      navigate("/aperture/app/memory", { replace: true });
    } else {
      setSectionIdx(sectionIdx + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const current = sections[sectionIdx];

  return (
    <>
      <Helmet><title>Full Questionnaire · Aperture</title></Helmet>
      <RealAppShell>
        <PageHeader
          index="DEEP DIVE"
          title="Tell me more about your business"
          sub="The more you share, the sharper my answers get. Skip anything that doesn't apply."
          action={sections.length > 0 ? <ApertureChip tone="neutral">Section {sectionIdx + 1} / {sections.length}</ApertureChip> : null}
        />

        {loading || !current ? (
          <ApertureLoading label="Loading…" />
        ) : (
          <ApertureCard padding={20}>
            <ApertureMonoLabel>{current[0]}</ApertureMonoLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 14 }}>
              {current[1].map(q => (
                <div key={q.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 14, color: "var(--ap-ink-1)", fontWeight: 500 }}>
                    {q.prompt}
                  </label>
                  {q.hint && <span style={{ fontSize: 12, color: "var(--ap-ink-3)" }}>{q.hint}</span>}
                  <FullQuestionInput
                    q={q}
                    value={answers[q.question_key] ?? ""}
                    onChange={(v) => setAnswers(a => ({ ...a, [q.question_key]: v }))}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 22, justifyContent: "space-between" }}>
              <ApertureButton variant="ghost" onClick={skipSection} disabled={busy}>Skip section</ApertureButton>
              <ApertureButton variant="accent" onClick={next} disabled={busy}>
                {busy ? "Saving…" : sectionIdx + 1 >= sections.length ? "Finish" : "Next section →"}
              </ApertureButton>
            </div>
          </ApertureCard>
        )}
      </RealAppShell>
    </>
  );
}

function FullQuestionInput({
  q, value, onChange,
}: { q: any; value: string; onChange: (v: string) => void }) {
  const baseStyle: React.CSSProperties = {
    width: "100%", appearance: "none", outline: "none",
    background: "var(--ap-surface-2)",
    border: "1px solid var(--ap-hairline)",
    borderRadius: "var(--ap-radius-sm)",
    padding: "10px 12px",
    fontSize: 14, color: "var(--ap-ink-1)",
    fontFamily: "var(--ap-font-sans)", lineHeight: 1.5,
  };

  if (q.input_kind === "single_choice" && Array.isArray(q.options)) {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {q.options.map((raw: any) => {
          const label = typeof raw === "string" ? raw : raw?.label ?? String(raw?.value ?? "");
          const val = typeof raw === "string" ? raw : raw?.value ?? label;
          const on = value === val;
          return (
            <button key={val} type="button" onClick={() => onChange(val)}
              style={{
                appearance: "none", cursor: "pointer",
                padding: "8px 12px", borderRadius: "var(--ap-radius-sm)",
                border: "1px solid " + (on ? "var(--ap-signal)" : "var(--ap-hairline)"),
                background: on ? "var(--ap-signal)" : "var(--ap-surface-2)",
                color: on ? "#000" : "var(--ap-ink-1)",
                fontSize: 13, fontWeight: 500,
              }}>{label}</button>
          );
        })}
      </div>
    );
  }

  if (q.input_kind === "textarea" || q.input_kind === "long_text") {
    return (
      <textarea rows={3} style={{ ...baseStyle, resize: "vertical" }}
        value={value} onChange={e => onChange(e.target.value)} />
    );
  }

  return (
    <input
      style={baseStyle}
      type={q.input_kind === "url" ? "url" : q.input_kind === "email" ? "email" : "text"}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
}