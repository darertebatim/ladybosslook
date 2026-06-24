import { useMemo, useState, useEffect, useRef } from "react";
import { IndustryPicker } from "@/aperture/components/IndustryPicker";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { RealAppShell } from "@/aperture/components/RealAppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureCard, ApertureMonoLabel, ApertureLoading, ApertureButton, ApertureChip,
} from "@/aperture/components/primitives";
import { useApertureOnboardingDB, useApertureIndustriesDB } from "@/aperture/hooks/db/useApertureOnboardingDB";
import { useApertureUserProfile } from "@/aperture/hooks/db/useApertureUserProfile";
import { useApertureMemoryDB } from "@/aperture/hooks/db/useApertureMemoryDB";
import { supabase } from "@/integrations/supabase/client";
import { logApertureEvent } from "@/aperture/lib/apertureEvents";

/**
 * Quick onboarding — phased, DB-driven. After the last question
 * we mark profile.quick_onboarded_at and bounce to /app/rilobiz/app.
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
  const [showPhaseIntro, setShowPhaseIntro] = useState(false);
  const lastPhaseRef = useRef<number | null>(null);

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
    return phase === 1 ? "Your business" : phase === 2 ? "Details" : "One last thing";
  }, [q]);

  // Show a short interstitial when we cross into a new phase.
  useEffect(() => {
    if (!q) return;
    if (lastPhaseRef.current === null) {
      lastPhaseRef.current = q.step;
      return;
    }
    if (lastPhaseRef.current !== q.step) {
      lastPhaseRef.current = q.step;
      setShowPhaseIntro(true);
    }
  }, [q?.step]);

  const phaseMeta = (p: number) => p === 1
    ? { title: "Your business", sub: "The essentials so I know who I'm working with." }
    : p === 2
    ? { title: "Your online presence", sub: "Drop your links so I can read up on you." }
    : { title: "One last thing", sub: "A quick note on how I can help most." };

  async function persistAnswer(qq: typeof q, value: string) {
    if (!qq) return;
    const v = value.trim();
    if (!v) return;
    // profile shortcuts
    if (qq.question_key === "owner_name") await upsertProfile({ owner_name: v });
    if (qq.question_key === "business_name") await upsertProfile({ business_name: v });
    if (qq.question_key === "website") await upsertProfile({ website: v });
    if (qq.question_key === "instagram") {
      const handle = v.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/$/, "").trim();
      await upsertProfile({ instagram: handle ? `@${handle}` : null });
      // Also mark Instagram as an active tool in the user's stack so it
      // shows up checked on the Tools page (Marketing & Social category).
      if (handle) {
        await supabase.from("aperture_user_tools").upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          tool_slug: "instagram__marketing_social",
          tool_name: "Instagram",
          category: "Marketing & Social",
          custom: false,
          is_active: true,
        } as any, { onConflict: "user_id,tool_slug" });
      }
    }
    if (qq.question_key === "industry") await upsertProfile({ industry_slug: v });
    // memory write
    const target = (qq.bucket_slugs && qq.bucket_slugs[0]) ?? "basics";
    if (target === "__notes__") await addFreeformNote(v);
    else await saveBucketAnswer(target, qq.question_key, v);

    // Also mirror the answer into any additional target buckets under
    // its OWN question_key. We intentionally do NOT fan out into
    // `bucket_question_keys` — those are different questions with
    // different option sets, and copying one short slug into many
    // unrelated slots pollutes the user's memory with mis-matched
    // answers (the same bug the export had to filter around).
    const extraBuckets = (qq.bucket_slugs && qq.bucket_slugs.length > 1)
      ? qq.bucket_slugs.slice(1).filter(s => s !== "__notes__" && s !== target)
      : [];
    if (extraBuckets.length > 0) {
      await Promise.all(extraBuckets.map(b => saveBucketAnswer(b, qq.question_key, v)));
    }
  }

  async function next() {
    if (busy) return;
    setBusy(true);
    const value = answers[q.question_key] ?? "";
    await persistAnswer(q, value);
    logApertureEvent("onboarding_answer", {
      phase: "quick", step: q.step, question_key: q.question_key, answer: value,
    });
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
      navigate("/app/rilobiz/app/onboard/confirm", { replace: true });
    } else {
      setI(i + 1);
    }
  }

  async function skip() {
    if (q) {
      logApertureEvent("onboarding_answer", {
        phase: "quick", step: q.step, question_key: q.question_key,
        answer: null, skipped: true,
      });
    }
    if (i + 1 >= total) {
      await upsertProfile({ quick_onboarded_at: new Date().toISOString() });
      navigate("/app/rilobiz/app/onboard/confirm", { replace: true });
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

        {q && (
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {[1, 2, 3].map(p => {
              const state = q.step === p ? "active" : q.step > p ? "done" : "todo";
              return (
                <div key={p} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{
                    height: 4, borderRadius: 999,
                    background: state === "todo" ? "var(--ap-hairline)" : "var(--ap-signal)",
                    opacity: state === "active" ? 1 : state === "done" ? 0.55 : 1,
                  }} />
                  <div style={{
                    fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
                    color: state === "active" ? "var(--ap-ink-1)" : "var(--ap-ink-2)",
                    fontWeight: state === "active" ? 600 : 500,
                  }}>
                    Phase {p}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {loading || !q ? (
          <ApertureLoading label="Loading…" />
        ) : showPhaseIntro ? (
          <ApertureCard padding={24}>
            <ApertureMonoLabel>Phase {q.step} of 3</ApertureMonoLabel>
            <h2 style={{ margin: "10px 0 8px", fontSize: 24, color: "var(--ap-ink-1)", fontWeight: 600, letterSpacing: "-0.02em" }}>
              {phaseMeta(q.step).title}
            </h2>
            <p style={{ margin: "0 0 18px", fontSize: 14, color: "var(--ap-ink-2)" }}>
              {phaseMeta(q.step).sub}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <ApertureButton variant="accent" onClick={() => setShowPhaseIntro(false)}>Continue →</ApertureButton>
            </div>
          </ApertureCard>
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
              <ApertureButton variant="ghost" onClick={skip} disabled={busy}>Skip</ApertureButton>
              <ApertureButton variant="accent" onClick={next} disabled={busy}>
                {busy ? "Saving…" : i + 1 >= total ? "Finish" : "Next →"}
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
      <IndustryPicker industries={industries} value={value} onChange={onChange} />
    );
  }

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
                padding: "10px 14px", borderRadius: "var(--ap-radius-sm)",
                border: "1px solid " + (on ? "var(--ap-signal)" : "var(--ap-hairline)"),
                background: on ? "var(--ap-signal)" : "var(--ap-surface-2)",
                color: on ? "#000" : "var(--ap-ink-1)",
                fontSize: 14, fontWeight: 500,
              }}>{label}</button>
          );
        })}
      </div>
    );
  }

  if (q.input_kind === "long_text" || q.input_kind === "textarea") {
    return (
      <textarea rows={4} style={{ ...baseStyle, resize: "vertical" }}
        placeholder={placeholderFor(q)}
        value={value} onChange={e => onChange(e.target.value)} />
    );
  }

  if (q.question_key === "website" || q.question_key === "instagram") {
    return (
      <HasItGate q={q} value={value} onChange={onChange} baseStyle={baseStyle} />
    );
  }

  return (
    <input style={baseStyle}
      type={q.input_kind === "url" ? "url" : q.input_kind === "email" ? "email" : "text"}
      placeholder={placeholderFor(q)}
      value={value} onChange={e => onChange(e.target.value)} />
  );
}

function placeholderFor(q: any): string {
  const map: Record<string, string> = {
    owner_name: "e.g. Sara",
    business_name: "e.g. Sara's Bakery",
    website: "e.g. https://yourbusiness.com",
    instagram: "e.g. @yourbusiness",
    find_you: "e.g. Walk-in, Instagram, word of mouth, Google…",
    channels: "e.g. Instagram, TikTok, Google, none…",
    closing_help: "e.g. more revenue and customers, business credit or a loan, more Instagram followers, posting consistently…",
  };
  if (map[q.question_key]) return map[q.question_key];
  if (q.input_kind === "url") return "https://…";
  if (q.input_kind === "email") return "you@example.com";
  return q.hint ? `e.g. ${q.hint}` : "Type your answer…";
}

function HasItGate({
  q, value, onChange, baseStyle,
}: {
  q: any; value: string; onChange: (v: string) => void; baseStyle: React.CSSProperties;
}) {
  // If a value already exists, treat as "yes". Otherwise undecided until user picks.
  const [mode, setMode] = useState<"yes" | "no" | null>(value ? "yes" : null);
  const label = q.question_key === "instagram" ? "Instagram" : "website";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {(["yes", "no"] as const).map(opt => {
          const on = mode === opt;
          return (
            <button key={opt} type="button"
              onClick={() => {
                setMode(opt);
                if (opt === "no") onChange("");
              }}
              style={{
                appearance: "none", cursor: "pointer",
                padding: "10px 16px", borderRadius: "var(--ap-radius-sm)",
                border: "1px solid " + (on ? "var(--ap-signal)" : "var(--ap-hairline)"),
                background: on ? "var(--ap-signal)" : "var(--ap-surface-2)",
                color: on ? "#000" : "var(--ap-ink-1)",
                fontSize: 14, fontWeight: 500,
              }}>
              {opt === "yes" ? `Yes, I have a ${label}` : "No, skip"}
            </button>
          );
        })}
      </div>
      {mode === "yes" && (
        <input
          style={baseStyle}
          type={q.question_key === "website" ? "url" : "text"}
          placeholder={placeholderFor(q)}
          autoFocus
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </div>
  );
}