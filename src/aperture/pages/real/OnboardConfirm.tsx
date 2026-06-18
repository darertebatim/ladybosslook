import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { RealAppShell } from "@/aperture/components/RealAppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureCard, ApertureMonoLabel, ApertureButton, ApertureChip, ApertureLoading,
} from "@/aperture/components/primitives";
import { useApertureBucketsDB } from "@/aperture/hooks/db/useApertureBucketsDB";
import { useApertureMemoryDB } from "@/aperture/hooks/db/useApertureMemoryDB";
import { logApertureEvent } from "@/aperture/lib/apertureEvents";
import { supabase } from "@/integrations/supabase/client";


/**
 * Phase 3 confirmation — after the website/IG research extraction,
 * show the owner everything the AI pulled out (grouped by bucket)
 * and let them keep/edit/remove each fact. Confirmed items get
 * source='user_confirmed'. Removed items are deleted.
 */
export default function OnboardConfirm() {
  const navigate = useNavigate();
  const { buckets } = useApertureBucketsDB();
  const { items, loading, refresh, deleteItem, updateItem, addFreeformNote } = useApertureMemoryDB();
  const [saving, setSaving] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [removed, setRemoved] = useState<Record<string, boolean>>({});
  const [phase, setPhase] = useState<"review" | "closing">("review");
  const [closingAnswer, setClosingAnswer] = useState("");
  const [tailoring, setTailoring] = useState(false);
  const [prefilling, setPrefilling] = useState(false);
  // Stay in "researching" until the edge function has had a real chance
  // to write facts. Prevents the "Nothing yet" flash before results arrive.
  const [researching, setResearching] = useState(true);

  // Poll a couple of times while the edge function is still writing facts.
  useEffect(() => {
    let cancelled = false;
    let tries = 0;
    const MAX_TRIES = 12; // ~36s total
    const tick = async () => {
      if (cancelled) return;
      await refresh();
      tries += 1;
      if (tries < MAX_TRIES) setTimeout(tick, 3000);
      else setResearching(false);
    };
    tick();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aiItems = useMemo(
    () => items.filter(i => i.source === "ai_extracted"),
    [items],
  );

  // As soon as the research function has written anything, stop showing
  // the loading state — we have real content to review.
  useEffect(() => {
    if (aiItems.length > 0 && researching) setResearching(false);
  }, [aiItems.length, researching]);

  const grouped = useMemo(() => {
    const m: Record<string, typeof aiItems> = {};
    for (const it of aiItems) {
      const k = it.bucket_slug ?? "other";
      (m[k] ||= []).push(it);
    }
    return m;
  }, [aiItems]);

  async function confirmAll() {
    if (saving) return;
    setSaving(true);
    for (const it of aiItems) {
      if (removed[it.id]) {
        await deleteItem(it.id);
        continue;
      }
      const nextContent = (edits[it.id] ?? it.content).trim();
      if (!nextContent) {
        await deleteItem(it.id);
        continue;
      }
      await updateItem(it.id, {
        content: nextContent,
        source: "user_confirmed" as any,
      });
    }
    setSaving(false);

    // Pass 1 — pre-fill empty bucket questions with industry-grounded
    // guesses (source='ai_inferred_pre_onboarding'). Bounded to ~15s so
    // a slow model never strands the user on the confirm screen.
    setPrefilling(true);
    try {
      await Promise.race([
        supabase.functions.invoke("aperture-pass1-prefill", {}),
        new Promise(resolve => setTimeout(resolve, 15_000)),
      ]);
    } catch (e) {
      console.error("pass1 invoke failed", e);
    }
    setPrefilling(false);
    setPhase("closing");
  }

  async function skipAll() {
    // Even if the owner skips reviewing, still run Pass 1 against
    // whatever onboarding answers we have so memory isn't empty.
    setPrefilling(true);
    try {
      await Promise.race([
        supabase.functions.invoke("aperture-pass1-prefill", {}),
        new Promise(resolve => setTimeout(resolve, 15_000)),
      ]);
    } catch (e) {
      console.error("pass1 invoke failed", e);
    }
    setPrefilling(false);
    setPhase("closing");
  }

  async function finishClosing() {
    if (saving) return;
    setSaving(true);
    const v = closingAnswer.trim();
    if (v) await addFreeformNote(v);
    logApertureEvent("onboarding_answer", {
      phase: "closing", question_key: "closing_help", answer: v || null,
    });
    logApertureEvent("onboarding_completed", { flow: "quick" });
    setSaving(false);

    // Pass 2 — generate tailored home suggestions before showing Home.
    // Bounded so a slow/failed AI call never blocks the user past ~12s.
    setTailoring(true);
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
    navigate("/aperture/app", { replace: true });
  }

  const bucketTitleMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const b of buckets) m[b.slug] = b.title;
    return m;
  }, [buckets]);

  const total = aiItems.length;
  const kept = aiItems.filter(i => !removed[i.id]).length;

  return (
    <>
      <Helmet><title>Review what I found · Aperture</title></Helmet>
      <RealAppShell>
        {prefilling ? (
          <>
            <PageHeader
              index="ONE MOMENT"
              title="Sketching a first draft of your business…"
              sub="I'm using your industry and what you just confirmed to pre-fill some guesses. You'll see them clearly marked as guesses — confirm or correct them anytime."
            />
            <ApertureLoading sublabel="Drafting industry-grounded defaults across your memory buckets." />
          </>
        ) : tailoring ? (
          <>
            <PageHeader
              index="ONE MOMENT"
              title="Tailoring your first moves…"
              sub="I'm using what you just told me to line up the sharpest next steps for your business. This takes a few seconds."
            />
            <ApertureLoading sublabel="Reading your memory, weighing your answer, drafting concrete next actions." />
          </>
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
                <ApertureButton variant="accent" onClick={finishClosing} disabled={saving}>
                  {saving ? "Saving…" : "Enter Aperture →"}
                </ApertureButton>
              </div>
            </ApertureCard>
          </>
        ) : (
        <>
        <PageHeader
          index="REVIEW"
          title="Here's what I pulled from your links"
          sub="I scraped your website and Instagram. Confirm what's accurate, fix what's wrong, remove what isn't you. Anything you keep becomes part of my memory."
          action={total > 0 ? <ApertureChip tone="signal">{kept} kept</ApertureChip> : null}
        />

        {researching && total === 0 ? (
          <ApertureLoading sublabel="Reading your site and Instagram. This usually takes 10–30 seconds." />
        ) : total === 0 ? (
          <ApertureCard padding={20}>
            <ApertureMonoLabel>Nothing yet</ApertureMonoLabel>
            <p style={{ margin: "8px 0 14px", fontSize: 13, color: "var(--ap-ink-2)" }}>
              I couldn't extract anything from the links you gave me — they might be private,
              empty, or blocked. You can skip ahead and fill things in yourself.
            </p>
            <ApertureButton variant="accent" onClick={skipAll}>Continue →</ApertureButton>
          </ApertureCard>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {Object.entries(grouped).map(([slug, list]) => (
                <ApertureCard key={slug} padding={16}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                    <ApertureMonoLabel>{bucketTitleMap[slug] ?? slug}</ApertureMonoLabel>
                    <ApertureChip tone="neutral">{list.length} facts</ApertureChip>
                  </div>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                    {list.map(it => {
                      const isRemoved = !!removed[it.id];
                      const value = edits[it.id] ?? it.content;
                      return (
                        <li key={it.id} style={{
                          opacity: isRemoved ? 0.35 : 1,
                          display: "flex", alignItems: "flex-start", gap: 10,
                          paddingTop: 8, borderTop: "1px solid var(--ap-hairline)",
                        }}>
                          <textarea
                            value={value}
                            disabled={isRemoved}
                            onChange={e => setEdits(s => ({ ...s, [it.id]: e.target.value }))}
                            rows={Math.min(4, Math.max(1, Math.ceil(value.length / 70)))}
                            style={{
                              flex: 1, resize: "vertical",
                              fontFamily: "var(--ap-font-sans)", fontSize: 13.5,
                              color: "var(--ap-ink-1)", background: "transparent",
                              border: "1px solid transparent", borderRadius: 6,
                              padding: "4px 6px", outline: "none",
                              textDecoration: isRemoved ? "line-through" : "none",
                            }}
                            onFocus={e => { e.currentTarget.style.border = "1px solid var(--ap-hairline)"; }}
                            onBlur={e => { e.currentTarget.style.border = "1px solid transparent"; }}
                          />
                          <button
                            type="button"
                            onClick={() => setRemoved(r => ({ ...r, [it.id]: !r[it.id] }))}
                            style={{
                              appearance: "none", cursor: "pointer", flexShrink: 0,
                              fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
                              padding: "4px 8px", borderRadius: 4,
                              border: "1px solid var(--ap-hairline)",
                              background: "transparent",
                              color: isRemoved ? "var(--ap-ink-1)" : "var(--ap-ink-3)",
                            }}
                          >{isRemoved ? "Keep" : "Remove"}</button>
                        </li>
                      );
                    })}
                  </ul>
                </ApertureCard>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18 }}>
              <ApertureButton variant="ghost" onClick={skipAll}>Skip</ApertureButton>
              <ApertureButton variant="accent" onClick={confirmAll} disabled={saving}>
                {saving ? "Saving…" : `Confirm ${kept} →`}
              </ApertureButton>
            </div>
          </>
        )}
        </>
        )}
      </RealAppShell>
    </>
  );
}