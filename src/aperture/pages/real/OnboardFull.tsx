import { useEffect, useMemo, useRef, useState } from "react";
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
import { logApertureEvent } from "@/aperture/lib/apertureEvents";
import { supabase } from "@/integrations/supabase/client";
import { BusinessBriefScreen } from "@/aperture/components/BusinessBriefScreen";

/**
 * Full questionnaire — section-by-section wizard. Each section is
 * shown on its own screen; answers fan out to all target buckets.
 * "Skip" on every question, "Skip section" advances to next section.
 */
export default function OnboardFull() {
  const navigate = useNavigate();
  const { questions, loading } = useApertureOnboardingDB("full");
  const { upsert: upsertProfile } = useApertureUserProfile();
  const { saveBucketAnswer, addFreeformNote } = useApertureMemoryDB();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sectionIdx, setSectionIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"sections" | "prefilling" | "closing" | "tailoring" | "brief">("sections");
  const [closingAnswer, setClosingAnswer] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const topRef = useRef<HTMLDivElement | null>(null);

  function scrollToTop() {
    requestAnimationFrame(() => {
      try { topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); } catch {}
      try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch {}
      if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
  }

  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 1800);
    return () => clearTimeout(t);
  }, [justSaved]);

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
    // Dedupe writes by (bucket, question_key) so parallel saves never
    // race on the same unique row.
    const planned = new Map<string, { bucket: string; key: string; value: string }>();
    for (const q of qs) {
      const v = (answers[q.question_key] ?? "").trim();
      if (!v) continue;
      const targets = q.bucket_slugs && q.bucket_slugs.length > 0 ? q.bucket_slugs : ["basics"];
      for (const target of targets) {
        const keys = [q.question_key, ...(q.bucket_question_keys ?? [])];
        for (const k of keys) {
          planned.set(`${target}::${k}`, { bucket: target, key: k, value: v });
        }
      }
    }
    // Serialize to avoid concurrent inserts on the same row from other tabs.
    for (const { bucket, key, value } of planned.values()) {
      try { await saveBucketAnswer(bucket, key, value); }
      catch (e) { console.error("[onboard-full] save failed", bucket, key, e); }
    }
  }

  async function finishSections() {
    await upsertProfile({ full_onboarded_at: new Date().toISOString() });
    // Pass 1 — industry-grounded prefill across buckets
    setPhase("prefilling");
    try {
      await Promise.race([
        supabase.functions.invoke("aperture-pass1-prefill", {}),
        new Promise(resolve => setTimeout(resolve, 15_000)),
      ]);
    } catch (e) {
      console.error("pass1 invoke failed", e);
    }
    setPhase("closing");
  }

  async function finishClosing() {
    if (busy) return;
    setBusy(true);
    const v = closingAnswer.trim();
    if (v) await addFreeformNote(v);
    logApertureEvent("onboarding_answer", {
      phase: "closing", question_key: "closing_help", answer: v || null,
    });
    logApertureEvent("onboarding_completed", { flow: "full" });
    setBusy(false);
    setPhase("tailoring");
    try {
      await Promise.race([
        supabase.functions.invoke("aperture-pass2-suggestions", {
          body: { closing_answer: v },
        }),
        new Promise(resolve => setTimeout(resolve, 12_000)),
      ]);
    } catch (e) {
      console.error("pass2 invoke failed", e);
    }
    setPhase("brief");
  }

  async function next() {
    if (busy) return;
    setBusy(true);
    const [, qs] = sections[sectionIdx] ?? [null, [] as any];
    await persistSection(qs);
    setBusy(false);
    if (sectionIdx + 1 >= sections.length) {
      await finishSections();
    } else {
      setSectionIdx(sectionIdx + 1);
      setJustSaved(true);
      scrollToTop();
    }
  }

  async function skipSection() {
    if (sectionIdx + 1 >= sections.length) {
      await finishSections();
    } else {
      setSectionIdx(sectionIdx + 1);
      scrollToTop();
    }
  }

  const current = sections[sectionIdx];
  const progressPct = sections.length > 0 ? ((sectionIdx + 1) / sections.length) * 100 : 0;

  return (
    <>
      <Helmet><title>Full Questionnaire · Aperture</title></Helmet>
      <RealAppShell>
        {phase === "prefilling" ? (
          <>
            <PageHeader
              index="ONE MOMENT"
              title="Sketching a first draft of your business…"
              sub="I'm using your industry and everything you just shared to pre-fill some guesses. You'll see them clearly marked — confirm or correct them anytime."
            />
            <ApertureLoading sublabel="Drafting industry-grounded defaults across your memory buckets." />
          </>
        ) : phase === "tailoring" ? (
          <>
            <PageHeader
              index="ONE MOMENT"
              title="Tailoring your first moves…"
              sub="I'm using what you just told me to line up the sharpest next steps for your business. This takes a few seconds."
            />
            <ApertureLoading sublabel="Reading your memory, weighing your answer, drafting concrete next actions." />
          </>
        ) : phase === "brief" ? (
          <BusinessBriefScreen
            closingAnswer={closingAnswer}
            flow="full"
            onDone={() => navigate("/aperture/app", { replace: true })}
          />
        ) : phase === "closing" ? (
          <>
            <PageHeader
              index="ONE LAST THING"
              title="How can I help you most right now?"
              sub="If I could take one thing off your plate starting today — what would it be?"
            />
            <ApertureCard padding={20}>
              <textarea
                rows={5}
                value={closingAnswer}
                onChange={e => setClosingAnswer(e.target.value)}
                placeholder="In your own words…"
                style={{
                  width: "100%", resize: "vertical",
                  background: "var(--ap-surface-2)",
                  border: "1px solid var(--ap-hairline)",
                  borderRadius: "var(--ap-radius-sm)",
                  padding: "12px 14px",
                  fontSize: 15, color: "var(--ap-ink-1)",
                  fontFamily: "var(--ap-font-sans)", lineHeight: 1.5,
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
                <ApertureButton variant="ghost" onClick={() => navigate("/aperture/app", { replace: true })}>Skip</ApertureButton>
                <ApertureButton variant="accent" onClick={finishClosing} disabled={busy}>
                  {busy ? "Saving…" : "Enter Aperture →"}
                </ApertureButton>
              </div>
            </ApertureCard>
          </>
        ) : (
        <>
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
        </>
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
        placeholder={fullPlaceholderFor(q)}
        value={value} onChange={e => onChange(e.target.value)} />
    );
  }

  if (q.question_key === "website" || q.question_key === "instagram") {
    return <FullHasItGate q={q} value={value} onChange={onChange} baseStyle={baseStyle} />;
  }

  return (
    <input
      style={baseStyle}
      type={q.input_kind === "url" ? "url" : q.input_kind === "email" ? "email" : "text"}
      placeholder={fullPlaceholderFor(q)}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
}

function fullPlaceholderFor(q: any): string {
  const map: Record<string, string> = {
    owner_name: "e.g. Sara",
    business_name: "e.g. Sara's Bakery",
    website: "e.g. https://yourbusiness.com",
    instagram: "e.g. @yourbusiness",
    find_you: "e.g. Walk-in, Instagram, word of mouth, Google…",
    channels: "e.g. Instagram, TikTok, Google, none…",
  };
  if (map[q.question_key]) return map[q.question_key];
  if (q.input_kind === "url") return "https://…";
  if (q.input_kind === "email") return "you@example.com";
  return q.hint ? `e.g. ${q.hint}` : "Type your answer…";
}

function FullHasItGate({
  q, value, onChange, baseStyle,
}: { q: any; value: string; onChange: (v: string) => void; baseStyle: React.CSSProperties }) {
  const [mode, setMode] = useState<"yes" | "no" | null>(value ? "yes" : null);
  const label = q.question_key === "instagram" ? "Instagram" : "website";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {(["yes", "no"] as const).map(opt => {
          const on = mode === opt;
          return (
            <button key={opt} type="button"
              onClick={() => { setMode(opt); if (opt === "no") onChange(""); }}
              style={{
                appearance: "none", cursor: "pointer",
                padding: "8px 12px", borderRadius: "var(--ap-radius-sm)",
                border: "1px solid " + (on ? "var(--ap-signal)" : "var(--ap-hairline)"),
                background: on ? "var(--ap-signal)" : "var(--ap-surface-2)",
                color: on ? "#000" : "var(--ap-ink-1)",
                fontSize: 13, fontWeight: 500,
              }}>
              {opt === "yes" ? `Yes, I have a ${label}` : "No, skip"}
            </button>
          );
        })}
      </div>
      {mode === "yes" && (
        <input style={baseStyle}
          type={q.question_key === "website" ? "url" : "text"}
          placeholder={fullPlaceholderFor(q)}
          autoFocus
          value={value}
          onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );
}