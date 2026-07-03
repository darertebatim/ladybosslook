import { useMemo, useState, useEffect, useRef } from "react";
import { IndustryPicker } from "@/aperture/components/IndustryPicker";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { RealAppShell } from "@/aperture/components/RealAppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureCard, ApertureMonoLabel, ApertureLoading, ApertureButton, ApertureChip,
} from "@/aperture/components/primitives";
import { ApertureProgressOverlay, ApertureProgressStatus } from "@/aperture/components/ApertureProgressOverlay";
import { useApertureOnboardingDB, useApertureIndustriesDB } from "@/aperture/hooks/db/useApertureOnboardingDB";
import { useApertureUserProfile } from "@/aperture/hooks/db/useApertureUserProfile";
import { useApertureMemoryDB } from "@/aperture/hooks/db/useApertureMemoryDB";
import { supabase } from "@/integrations/supabase/client";
import { logApertureEvent } from "@/aperture/lib/apertureEvents";
import { useAuth } from "@/hooks/useAuth";

/**
 * Essential Onboarding — 5-phase, single-flow. Replaces quick + full.
 * Phases:
 *   1 Identifiers (name + business name)
 *   2 Core (21 fact-signal questions — feed the Wave 2 selector)
 *   3 Research (Instagram + website, optional)
 *   4 Contact (phone / email / location)
 *   5 Closing (open-text "how can I help most right now?")
 *
 * Answers are written to memory tagged with wave_number=1 and signal_key,
 * so the Wave 2 selector can read them as onboarding signals.
 */
export default function OnboardEssential() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { questions: rawQuestions, loading } = useApertureOnboardingDB("essential");
  const { industries } = useApertureIndustriesDB();
  const { profile, upsert: upsertProfile } = useApertureUserProfile();
  const { saveBucketAnswer, addFreeformNote } = useApertureMemoryDB();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [showPhaseIntro, setShowPhaseIntro] = useState(false);
  const lastPhaseRef = useRef<number | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [finishStatus, setFinishStatus] = useState<ApertureProgressStatus>("running");
  const [finishError, setFinishError] = useState<string | null>(null);

  // Skip contact questions we already know from the signed-in account.
  const knownEmail = user?.email ?? null;
  const knownPhone = (user as any)?.phone ?? profile?.["phone" as keyof typeof profile] ?? null;
  const questions = useMemo(() => {
    return rawQuestions.filter(q => {
      if (q.question_key === "email" && knownEmail) return false;
      if (q.question_key === "phone" && knownPhone) return false;
      return true;
    });
  }, [rawQuestions, knownEmail, knownPhone]);

  // Auto-persist known email/phone so memory has them even though we skip the questions.
  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      if (knownEmail) {
        try { await saveBucketAnswer("basics", "email", knownEmail); } catch {}
      }
      if (knownPhone) {
        try { await saveBucketAnswer("basics", "phone", String(knownPhone)); } catch {}
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id, knownEmail, knownPhone]);

  const q = questions[i];
  const total = questions.length;

  const phaseMeta = (p: number) => {
    switch (p) {
      case 1: return { title: "Let's start with you",       sub: "Just the basics — takes a second." };
      case 2: return { title: "Your business — the essentials", sub: "About 20 quick questions. Tap answers, skip anything you don't want." };
      case 3: return { title: "Your online presence",       sub: "Drop your links so I can read up on you. Optional." };
      case 4: return { title: "How to reach you",           sub: "For your records inside RiloBiz. Nothing gets sent anywhere." };
      default: return { title: "One last thing",            sub: "In your own words." };
    }
  };
  const phaseLabel = q ? phaseMeta(q.step).title : "";

  useEffect(() => {
    if (!q) return;
    if (lastPhaseRef.current === null) { lastPhaseRef.current = q.step; return; }
    if (lastPhaseRef.current !== q.step) {
      lastPhaseRef.current = q.step;
      setShowPhaseIntro(true);
    }
  }, [q?.step]);

  async function persistAnswer(qq: typeof q, value: string) {
    if (!qq) return;
    const v = value.trim();
    if (!v) return;
    // Profile shortcuts
    if (qq.question_key === "owner_name") await upsertProfile({ owner_name: v });
    if (qq.question_key === "business_name") await upsertProfile({ business_name: v });
    if (qq.question_key === "website") await upsertProfile({ website: v });
    if (qq.question_key === "instagram") {
      const handle = v.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/$/, "").trim();
      await upsertProfile({ instagram: handle ? `@${handle}` : null });
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
    if (qq.question_key === "industry") {
      await upsertProfile({ industry_slug: v });
      // Also save human-readable industry label + group as memory facts, so
      // GPT sees e.g. "Café" + "Food & Hospitality" instead of raw slugs.
      const ind = industries.find(i => i.slug === v);
      const specificLabel = ind?.label ?? v;
      const groupLabel = ind?.group_label ?? "";
      try {
        await saveBucketAnswer("basics", "specific_industry", specificLabel);
        if (groupLabel) await saveBucketAnswer("basics", "industry_group", groupLabel);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from("aperture_memory_items")
            .update({ wave_number: 1 } as any)
            .eq("user_id", user.id)
            .eq("bucket_slug", "basics")
            .in("question_key", ["specific_industry", "industry_group"]);
        }
      } catch { /* non-critical */ }
      return; // industry handled fully above; skip generic slug save.
    }

    // Memory write — tag with wave_number=1 and signal_key so selector can find it.
    const target = (qq.bucket_slugs && qq.bucket_slugs[0]) ?? "basics";
    if (target === "__notes__") {
      await addFreeformNote(v);
    } else {
      await saveBucketAnswer(target, qq.question_key, v);
      // Best-effort: tag the row we just wrote with wave_number + signal_key.
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from("aperture_memory_items")
            .update({ wave_number: 1, ...(qq.signal_key ? {} : {}) } as any)
            .eq("user_id", user.id)
            .eq("bucket_slug", target)
            .eq("question_key", qq.question_key);
        }
      } catch { /* non-critical */ }
    }
  }

  async function next() {
    if (busy || !q) return;
    setBusy(true);
    const value = answers[q.question_key] ?? "";
    await persistAnswer(q, value);
    logApertureEvent("onboarding_answer", {
      phase: "essential", step: q.step, question_key: q.question_key, answer: value,
    });
    setBusy(false);
    if (i + 1 >= total) return finish();
    setI(i + 1);
  }

  async function skip() {
    if (q) {
      logApertureEvent("onboarding_answer", {
        phase: "essential", step: q.step, question_key: q.question_key, answer: null, skipped: true,
      });
    }
    if (i + 1 >= total) return finish();
    setI(i + 1);
  }

  async function finish() {
    setFinishing(true);
    setFinishStatus("running");
    setFinishError(null);
    try {
      const now = new Date().toISOString();
      await upsertProfile({
        essential_onboarded_at: now,
        quick_onboarded_at: now,
      });

      const website = answers["website"];
      const instagram = answers["instagram"];
      const businessName = answers["business_name"];
      if (website || instagram) {
        supabase.functions.invoke("aperture-onboarding-research", {
          body: { website, instagram, businessName },
        }).catch(() => {});
      }
      try { window.localStorage.setItem("rilobiz.showBriefOnHome", "essential"); } catch {}

      const { error } = await supabase.functions.invoke("aperture-regenerate-memory-card", {});
      if (error) throw error;

      setFinishStatus("done");
      await new Promise(r => setTimeout(r, 1100));
      navigate("/app/rilobiz/app", { replace: true });
    } catch (e: any) {
      setFinishError(e?.message ?? "We couldn't finish building your home. Please try again.");
      setFinishStatus("error");
    }
  }

  function set(value: string) {
    if (!q) return;
    setAnswers(a => ({ ...a, [q.question_key]: value }));
  }

  const currentPhase = q?.step ?? 1;
  const phases = [1, 2, 3, 4, 5];

  return (
    <>
      <Helmet><title>Welcome · RiloBiz</title></Helmet>
      <RealAppShell>
        <PageHeader
          index="ESSENTIAL"
          title="Let's build your memory"
          sub="Short questions. Skip anything you don't want to answer — you can always add it later."
          action={total > 0 ? <ApertureChip tone="neutral">{Math.min(i + 1, total)} / {total}</ApertureChip> : null}
        />

        {q && !finishing && (
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {phases.map(p => {
              const state = currentPhase === p ? "active" : currentPhase > p ? "done" : "todo";
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

        {finishing ? (
          <ApertureProgressOverlay
            open
            status={finishStatus}
            title="Building your customized home"
            description="I'm saving your memory and pulling together what I know so your home page is ready when you land."
            estimateMs={12000}
            hardTimeoutMs={30000}
            steps={[
              { at: 5, label: "Saving your answers…" },
              { at: 35, label: "Reading up on your business…" },
              { at: 70, label: "Building your customized home…" },
            ]}
            errorMessage={finishError ?? undefined}
            onRetry={() => { setFinishError(null); finish(); }}
            onDismiss={() => { setFinishing(false); }}
            onHardTimeout={() => {
              setFinishError("This is taking longer than expected. Please try again.");
              setFinishStatus("error");
            }}
          />
        ) : loading || !q ? (
          <ApertureLoading label="Loading…" />
        ) : showPhaseIntro ? (
          <ApertureCard padding={24}>
            <ApertureMonoLabel>Phase {q.step} of 5</ApertureMonoLabel>
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
              {q.hint && /^optional/i.test(q.hint) && (
                <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 500, color: "var(--ap-ink-2)", letterSpacing: 0 }}>
                  (optional)
                </span>
              )}
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

  if (q.question_key === "industry" || q.input_kind === "industry_picker") {
    return <IndustryPicker industries={industries} value={value} onChange={onChange} />;
  }

  if (q.input_kind === "single_choice" && Array.isArray(q.options)) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {q.options.map((raw: any) => {
          const label = typeof raw === "string" ? raw : raw?.label ?? String(raw?.value ?? "");
          const val = typeof raw === "string" ? raw : raw?.value ?? label;
          const on = value === val;
          return (
            <button key={val} type="button" onClick={() => onChange(val)}
              style={{
                appearance: "none", cursor: "pointer", textAlign: "left",
                padding: "12px 14px", borderRadius: "var(--ap-radius-sm)",
                border: "1px solid " + (on ? "var(--ap-signal)" : "var(--ap-hairline)"),
                background: on ? "var(--ap-signal)" : "var(--ap-surface-2)",
                color: on ? "#000" : "var(--ap-ink-1)",
                fontSize: 14, fontWeight: 500, lineHeight: 1.4,
              }}>{label}</button>
          );
        })}
      </div>
    );
  }

  if (q.input_kind === "long_text" || q.input_kind === "textarea") {
    return (
      <textarea rows={5} style={{ ...baseStyle, resize: "vertical" }}
        placeholder={q.hint ? `e.g. ${q.hint}` : "Type your answer…"}
        value={value} onChange={e => onChange(e.target.value)} />
    );
  }

  // Per-question placeholder overrides — concrete examples beat repeating the hint.
  const placeholderOverride: Record<string, string> = {
    instagram: "alilotfivip",
    website: "ladybosslook.com",
  };
  const placeholder =
    placeholderOverride[q.question_key] ??
    (q.hint ? `e.g. ${q.hint}` : q.input_kind === "url" ? "https://…" : q.input_kind === "email" ? "you@example.com" : "Type your answer…");

  return (
    <input style={baseStyle}
      type={q.input_kind === "url" ? "url" : q.input_kind === "email" ? "email" : "text"}
      placeholder={placeholder}
      value={value} onChange={e => onChange(e.target.value)} />
  );
}