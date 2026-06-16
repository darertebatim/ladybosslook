import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { RealAppShell } from "@/aperture/components/RealAppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureCard, ApertureMonoLabel, ApertureButton, ApertureChip,
} from "@/aperture/components/primitives";
import { useApertureOnboardingDB, useApertureIndustriesDB } from "@/aperture/hooks/db/useApertureOnboardingDB";
import { useApertureUserProfile } from "@/aperture/hooks/db/useApertureUserProfile";
import { useApertureMemoryDB } from "@/aperture/hooks/db/useApertureMemoryDB";
import { supabase } from "@/integrations/supabase/client";

/**
 * Quick onboarding — phased, DB-driven. After the last question
 * we mark profile.quick_onboarded_at and bounce to /aperture/app.
 * Each answer is stored as a bucket_answer in memory using the
 * question's first bucket target (defaults to "basics").
 */
export default function OnboardQuick() {
  const navigate = useNavigate();
  const { questions, loading } = useApertureOnboardingDB("quick");
  const { industries } = useApertureIndustriesDB();
  const { upsert: upsertProfile } = useApertureUserProfile();
  const { saveBucketAnswer, addFreeformNote } = useApertureMemoryDB();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  // Closing question is asked AFTER Phase-3 confirmation, not here.
  const flowQuestions = useMemo(
    () => questions.filter(q => q.question_key !== "closing_help"),
    [questions]
  );
  const q = flowQuestions[i];
  const total = flowQuestions.length;
  const done = i >= total;

  const phaseLabel = useMemo(() => {
    if (!q) return "";
    const phase = q.step;
    return phase === 1 ? "About you" : phase === 2 ? "Your business" : "Online presence";
  }, [q]);

  async function persistAnswer(qq: typeof q, value: string) {
    if (!qq) return;
    const v = value.trim();
    if (!v) return;
    // profile shortcuts
    if (qq.question_key === "business_name") await upsertProfile({ business_name: v });
    if (qq.question_key === "website") await upsertProfile({ website: v });
    if (qq.question_key === "instagram") await upsertProfile({ instagram: v });
    if (qq.question_key === "industry") await upsertProfile({ industry_slug: v });
    // memory write
    const target = (qq.bucket_slugs && qq.bucket_slugs[0]) ?? "basics";
    if (target === "__notes__") await addFreeformNote(v);
    else await saveBucketAnswer(target, qq.question_key, v);

    // Also tick off any matching aperture_bucket_questions rows so the
    // AI never re-asks something the user already answered in onboarding.
    const targetBuckets = (qq.bucket_slugs && qq.bucket_slugs.length > 0)
      ? qq.bucket_slugs.filter(s => s !== "__notes__")
      : [];
    const mappedKeys = (qq.bucket_question_keys ?? []);
    for (const bucket of targetBuckets) {
      for (const bqKey of mappedKeys) {
        await saveBucketAnswer(bucket, bqKey, v);
      }
    }
  }

  async function next() {
    if (busy) return;
    setBusy(true);
    const value = answers[q.question_key] ?? "";
    await persistAnswer(q, value);
    setBusy(false);
    if (i + 1 >= total) {
      await upsertProfile({ quick_onboarded_at: new Date().toISOString() });
      const website = answers["website"];
      const instagram = answers["instagram"];
      const businessName = answers["business_name"];
      if (website || instagram) {
        supabase.functions.invoke("aperture-onboarding-research", {
          body: { website, instagram, businessName },
        }).catch(() => {});
      }
      // Always go to confirm — it owns the Phase-3 review AND the closing question.
      navigate("/aperture/app/onboard/confirm", { replace: true });
    } else {
      setI(i + 1);
    }
  }

  async function skip() {
    if (i + 1 >= total) {
      await upsertProfile({ quick_onboarded_at: new Date().toISOString() });
      navigate("/aperture/app/onboard/confirm", { replace: true });
    } else setI(i + 1);
  }

  function set(value: string) {
    if (!q) return;
    setAnswers(a => ({ ...a, [q.question_key]: value }));
  }

  return (
    <>
      <Helmet><title>Welcome · Aperture</title></Helmet>
      <RealAppShell>
        <PageHeader
          index="QUICK START"
          title="Let's get the basics down"
          sub="A short intake so I have just enough context to be useful. Skip anything you don't want to answer."
          action={total > 0 ? <ApertureChip tone="neutral">{Math.min(i + 1, total)} / {total}</ApertureChip> : null}
        />

        {loading || !q ? (
          <ApertureCard padding={20}><ApertureMonoLabel>Loading…</ApertureMonoLabel></ApertureCard>
        ) : (
          <ApertureCard padding={20}>
            <ApertureMonoLabel>{phaseLabel}</ApertureMonoLabel>
            <h2 style={{ margin: "8px 0 4px", fontSize: 20, color: "var(--ap-ink-1)", fontWeight: 600, letterSpacing: "-0.015em" }}>
              {q.prompt}
            </h2>
            {q.hint && <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--ap-ink-2)" }}>{q.hint}</p>}

            <QuestionInput
              q={q}
              value={answers[q.question_key] ?? ""}
              onChange={set}
              industries={industries}
            />

            <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
              <ApertureButton variant="ghost" onClick={skip}>Skip</ApertureButton>
              <ApertureButton variant="accent" onClick={next} disabled={busy}>
                {i + 1 >= total ? "Finish" : "Next →"}
              </ApertureButton>
            </div>
          </ApertureCard>
        )}
      </RealAppShell>
    </>
  );
}

function QuestionInput({
  q, value, onChange, industries,
}: {
  q: any; value: string; onChange: (v: string) => void;
  industries: Array<{ slug: string; label: string; group_label: string | null }>;
}) {
  const baseStyle: React.CSSProperties = {
    width: "100%", appearance: "none", outline: "none",
    background: "var(--ap-surface-2)",
    border: "1px solid var(--ap-hairline)",
    borderRadius: "var(--ap-radius-sm)",
    padding: "12px 14px",
    fontSize: 15, color: "var(--ap-ink-1)",
    fontFamily: "var(--ap-font-sans)", lineHeight: 1.5,
  };

  if (q.question_key === "industry") {
    return (
      <select style={baseStyle} value={value} onChange={e => onChange(e.target.value)}>
        <option value="">— Pick one —</option>
        {industries.map(ind => (
          <option key={ind.slug} value={ind.slug}>
            {ind.group_label ? `${ind.group_label} · ${ind.label}` : ind.label}
          </option>
        ))}
      </select>
    );
  }

  if (q.input_kind === "single_choice" && Array.isArray(q.options)) {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {q.options.map((o: string) => {
          const on = value === o;
          return (
            <button key={o} type="button" onClick={() => onChange(o)}
              style={{
                appearance: "none", cursor: "pointer",
                padding: "10px 14px", borderRadius: "var(--ap-radius-sm)",
                border: "1px solid " + (on ? "var(--ap-signal)" : "var(--ap-hairline)"),
                background: on ? "var(--ap-signal)" : "var(--ap-surface-2)",
                color: on ? "#000" : "var(--ap-ink-1)",
                fontSize: 14, fontWeight: 500,
              }}>{o}</button>
          );
        })}
      </div>
    );
  }

  if (q.input_kind === "long_text") {
    return (
      <textarea rows={4} style={{ ...baseStyle, resize: "vertical" }}
        value={value} onChange={e => onChange(e.target.value)} />
    );
  }

  return (
    <input style={baseStyle} type={q.input_kind === "url" ? "url" : q.input_kind === "email" ? "email" : "text"}
      value={value} onChange={e => onChange(e.target.value)} />
  );
}