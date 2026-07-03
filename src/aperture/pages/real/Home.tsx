import { Helmet } from "react-helmet-async";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { RealAppShell } from "@/aperture/components/RealAppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureCard, ApertureChip, ApertureMonoLabel, ApertureButton,
} from "@/aperture/components/primitives";
import { useApertureMemoryDB } from "@/aperture/hooks/db/useApertureMemoryDB";
import { useApertureChatsDB } from "@/aperture/hooks/db/useApertureChatsDB";
import { useApertureUserProfile } from "@/aperture/hooks/db/useApertureUserProfile";
import { useApertureDailyQuestion } from "@/aperture/hooks/db/useApertureDailyQuestion";
import { useApertureHomeSuggestions, computeMemorySignature } from "@/aperture/hooks/db/useApertureHomeSuggestions";
import { useApertureStoredSuggestions } from "@/aperture/hooks/db/useApertureStoredSuggestions";
import { toast } from "@/hooks/use-toast";
import { AperturePrompt } from "@/aperture/components/chat/AperturePrompt";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BriefCard } from "@/aperture/components/BriefCard";

/**
 * Memory Level — single climbing number driven by total fact count.
 * Thresholds: L1 = onboarding complete, L2=40, L3=80, L4=140, L5=220,
 * L6=320, then every +120 (440, 560, 680…). No max. Cosmetic only.
 */
function computeMemoryLevel(facts: number, onboarded: boolean): number {
  let level = onboarded ? 1 : 0;
  const table: Array<[number, number]> = [
    [2, 40], [3, 80], [4, 140], [5, 220], [6, 320],
  ];
  for (const [lvl, t] of table) if (facts >= t) level = Math.max(level, lvl);
  if (facts > 320) {
    level = Math.max(level, 6 + Math.ceil((facts - 320) / 120));
  }
  return level;
}
function prevThreshold(level: number): number {
  if (level <= 0) return 0;
  if (level === 1) return 1;
  const t: Record<number, number> = { 2: 40, 3: 80, 4: 140, 5: 220, 6: 320 };
  if (level in t) return t[level];
  return 320 + (level - 6) * 120;
}
function nextThreshold(level: number): number {
  if (level === 0) return 1;
  const t: Record<number, number> = { 1: 40, 2: 80, 3: 140, 4: 220, 5: 320 };
  if (level in t) return t[level];
  return 320 + (level - 5) * 120;
}

export default function RealHome() {
  const navigate = useNavigate();
  const { items, saveBucketAnswer } = useApertureMemoryDB();
  const { createChat } = useApertureChatsDB();
  const { profile, loading: pLoading } = useApertureUserProfile();
  const { user } = useAuth();
  const { question: dailyQ, refresh: refreshDailyQ, skip: skipDaily } = useApertureDailyQuestion();
  const { suggestions: storedSuggestions, refresh: refreshStored, markActed } = useApertureStoredSuggestions();
  const memorySig = useMemo(() => computeMemorySignature(items as any), [items]);
  const { suggestions: liveSuggestions, loading: liveLoading, refresh: refreshLive } = useApertureHomeSuggestions(memorySig);
  // Prefer stored (Pass 2 / future generators); fall back to live AI generation.
  const suggestions = storedSuggestions.length > 0
    ? storedSuggestions.map(s => ({ title: s.title, why: s.why, prompt: s.prompt, _storedId: s.id as string | null }))
    : liveSuggestions.map(s => ({ title: s.title, why: s.why, prompt: s.prompt, _storedId: null as string | null }));
  const sLoading = storedSuggestions.length > 0 ? false : liveLoading;
  const refreshSuggestions = async () => {
    await refreshStored();
    if (storedSuggestions.length === 0) await refreshLive();
  };
  const [draft, setDraft] = useState("");
  const [starting, setStarting] = useState(false);
  const [dailyAnswer, setDailyAnswer] = useState("");
  const [savingDaily, setSavingDaily] = useState(false);

  // One-shot expanded brief right after essential onboarding / wave completion.
  const [showBriefOnce, setShowBriefOnce] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const v = window.localStorage.getItem("rilobiz.showBriefOnHome");
    if (v) {
      try { window.localStorage.removeItem("rilobiz.showBriefOnHome"); } catch {}
    }
    return v;
  });

  // Next wave number (same logic as Memory page)
  const [nextWave, setNextWave] = useState<number>(2);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("aperture_waves")
        .select("wave_number,status")
        .eq("user_id", user.id);
      if (cancelled || !data) return;
      const maxComplete = data
        .filter((r: any) => r.status === "complete")
        .reduce((m: number, r: any) => Math.max(m, r.wave_number as number), 1);
      setNextWave(Math.max(2, maxComplete + 1));
    })();
    return () => { cancelled = true; };
  }, [user]);

  const knownCount = items.length;

  // ─── Memory Level ─────────────────────────────────────────────────────────
  const factCount = items.filter(i => !["skipped", "unknown"].includes(String(i.source))).length;
  const onboarded = !!profile?.full_onboarded_at || factCount > 0;
  const computedLevel = computeMemoryLevel(factCount, onboarded);
  const LEVEL_FLOOR_KEY = "rilobiz.memoryLevel.floor";
  const [level, setLevel] = useState<number>(() => {
    if (typeof window === "undefined") return computedLevel;
    const floor = Number(window.localStorage.getItem(LEVEL_FLOOR_KEY) ?? 0);
    return Math.max(floor, computedLevel);
  });
  useEffect(() => {
    const next = Math.max(level, computedLevel);
    if (next !== level) setLevel(next);
    try { window.localStorage.setItem(LEVEL_FLOOR_KEY, String(next)); } catch {}
  }, [computedLevel, level]);

  // First-time visit → push to Essential Onboarding.
  // Legacy users who completed the old "quick" flow are treated as onboarded.
  if (!pLoading && profile && !profile.essential_onboarded_at && !profile.quick_onboarded_at) {
    return <Navigate to="/app/rilobiz/app/onboard/essential" replace />;
  }
  if (!pLoading && !profile) {
    return <Navigate to="/app/rilobiz/app/onboard/essential" replace />;
  }

  const prevT = prevThreshold(level);
  const nextT = nextThreshold(level);
  const span = Math.max(1, nextT - prevT);
  const intoLevel = Math.max(0, factCount - prevT);
  const levelPct = Math.min(100, Math.round((intoLevel / span) * 100));

  async function handleSend(text: string) {
    const t = text.trim();
    if (!t || starting) return;
    setStarting(true);
    const chat = await createChat(t.slice(0, 48));
    setStarting(false);
    if (chat) navigate(`/app/rilobiz/app/chats/${chat.id}?seed=${encodeURIComponent(t)}`);
  }

  async function startFromSuggestion(s: { title: string; prompt: string; _storedId?: string | null }) {
    if (starting) return;
    setStarting(true);
    const chat = await createChat(s.title.slice(0, 48));
    setStarting(false);
    void import("@/aperture/lib/apertureEvents").then(m =>
      m.logApertureEvent("suggestion_tapped", {
        title: s.title, prompt: s.prompt, stored_id: s._storedId ?? null,
      }, chat?.id ?? null)
    );
    if (s._storedId) void markActed(s._storedId);
    if (chat) navigate(`/app/rilobiz/app/chats/${chat.id}?seed=${encodeURIComponent(s.prompt)}`);
  }

  async function saveDaily() {
    if (!dailyQ || !dailyAnswer.trim() || savingDaily) return;
    setSavingDaily(true);
    await saveBucketAnswer(dailyQ.bucket_slug, dailyQ.question_key, dailyAnswer.trim());
    setSavingDaily(false);
    setDailyAnswer("");
    toast({ title: "Saved to memory", description: "One more thing I know about your business." });
    await refreshDailyQ();
  }

  return (
    <>
      <Helmet><title>Today · RiloBiz</title></Helmet>
      <RealAppShell>
        <PageHeader
          index="00 · TODAY"
          title="Welcome back."
          sub={
            knownCount === 0
              ? "I don't know anything about your business yet. Start a chat or add a note — anything you say lands in your memory."
              : `I'm holding ${knownCount} thing${knownCount === 1 ? "" : "s"} I know about your business. The more you tell me, the sharper I get.`
          }
          action={<ApertureChip tone={knownCount > 0 ? "signal" : "neutral"}>Memory · {knownCount}</ApertureChip>}
        />

        {/* First-view brief (one-shot after onboarding / wave completion) */}
        {showBriefOnce && user && (
          <div style={{ marginBottom: 20 }}>
            <BriefCard
              label={showBriefOnce === "essential" ? "Fresh from onboarding" : `Fresh from ${showBriefOnce.replace("wave-", "Wave ")}`}
              title="Here's what I now know about your business"
              teaser="Your latest answers folded into the full picture."
              defaultOpen
              onTalk={async ({ move }) => {
                const opener = move
                  ? `From your fresh brief, here's the move I'd zero in on:\n\n"${move}"\n\nWant to work on this together? Where do you want to start — the first concrete step, what's blocking it, or how you'd know it's working?`
                  : `Let's talk through your brief. Where do you want to start?`;
                const chat = await createChat({
                  title: "Talk about my brief",
                  entry_point: "general_chat",
                  opener,
                });
                if (chat) navigate(`/app/rilobiz/app/chats/${chat.id}`);
              }}
              load={async () => {
                const { data } = await supabase
                  .from("aperture_memory_card")
                  .select("summary,regenerated_at")
                  .eq("user_id", user.id).maybeSingle();
                if (!data || !(data as any).summary) return null;
                return {
                  summary: (data as any).summary,
                  generated_at: (data as any).regenerated_at ?? new Date().toISOString(),
                };
              }}
              regenerate={async () => {
                const { data, error } = await supabase.functions.invoke("aperture-regenerate-memory-card", {});
                if (error) throw new Error(error.message);
                return {
                  summary: (data as any)?.summary ?? "",
                  generated_at: (data as any)?.regenerated_at ?? new Date().toISOString(),
                };
              }}
            />
          </div>
        )}

        {/* Memory Level */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <ApertureMonoLabel>Level</ApertureMonoLabel>
              <span style={{ fontSize: 28, fontWeight: 700, color: "var(--ap-ink-1)", fontVariantNumeric: "tabular-nums" }}>
                {level}
              </span>
            </div>
            <ApertureMonoLabel>
              {level >= 1 ? `${factCount} / ${nextT} facts` : `${factCount} facts`}
            </ApertureMonoLabel>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: "var(--ap-hairline)", overflow: "hidden" }}>
            <div style={{ width: `${levelPct}%`, height: "100%", background: "var(--ap-signal)", transition: "width 400ms ease" }} />
          </div>
        </div>

        {/* Next wave ready — surfaced once essential onboarding is complete. */}
        {(profile?.essential_onboarded_at || profile?.quick_onboarded_at) && (
          <Link to={`/app/rilobiz/app/waves/${nextWave}`} style={{ textDecoration: "none", display: "block", marginBottom: 20 }}>
            <ApertureCard padding={16} style={{ borderColor: "var(--ap-signal)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <ApertureMonoLabel style={{ color: "var(--ap-signal)" }}>Wave {nextWave} ready</ApertureMonoLabel>
                  <h3 style={{ margin: "6px 0 2px", fontSize: 15, fontWeight: 600, color: "var(--ap-ink-1)" }}>
                    A short round of focused questions
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--ap-ink-3)", lineHeight: 1.45 }}>
                    10–15 questions picked for your business. Skip anything — answers land in your memory.
                  </p>
                </div>
                <span style={{ color: "var(--ap-signal)", fontFamily: "var(--ap-font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", flexShrink: 0 }}>
                  Start →
                </span>
              </div>
            </ApertureCard>
          </Link>
        )}

        {/* AI suggestions */}
        {items.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <ApertureMonoLabel>Next moves</ApertureMonoLabel>
              <button
                type="button"
                onClick={() => refreshSuggestions()}
                disabled={sLoading}
                style={{
                  appearance: "none", cursor: sLoading ? "default" : "pointer",
                  border: "none", background: "transparent",
                  color: "var(--ap-ink-3)", fontSize: 11,
                  fontFamily: "var(--ap-font-mono)", textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                {sLoading ? "Thinking…" : "Refresh →"}
              </button>
            </div>

            {suggestions.length === 0 ? (
              <ApertureCard padding={18}>
                <p style={{ margin: 0, fontSize: 13, color: "var(--ap-ink-3)", lineHeight: 1.55 }}>
                  {sLoading
                    ? "Reading your memory and picking your sharpest next moves…"
                    : "I'll suggest concrete next steps here once I've read enough of your memory."}
                </p>
              </ApertureCard>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                {suggestions.map((s, idx) => (
                  <button
                    key={`${idx}-${s.title}`}
                    type="button"
                    onClick={() => startFromSuggestion(s)}
                    style={{
                      textAlign: "left", appearance: "none", cursor: "pointer",
                      padding: 16, background: "var(--ap-surface-1)",
                      border: "1px solid var(--ap-hairline)",
                      borderRadius: "var(--ap-radius-md)",
                      display: "flex", flexDirection: "column", gap: 8,
                      color: "var(--ap-ink-1)", fontFamily: "var(--ap-font-sans)",
                    }}
                  >
                    <ApertureMonoLabel>Suggestion · {String(idx + 1).padStart(2, "0")}</ApertureMonoLabel>
                    <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 600, lineHeight: 1.35 }}>{s.title}</h3>
                    {s.why && (
                      <div style={{ color: "var(--ap-ink-3)" }}>
                        <AperturePrompt text={s.why} size={12.5} />
                      </div>
                    )}
                    <span style={{ marginTop: 4, fontSize: 11, color: "var(--ap-signal)", fontFamily: "var(--ap-font-mono)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                      Start chat →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Daily question */}
        {dailyQ && (
          <section style={{ marginBottom: 28 }}>
            <ApertureMonoLabel style={{ marginBottom: 12, display: "block" }}>Today's question</ApertureMonoLabel>
            <ApertureCard padding={18}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <AperturePrompt
                    text={dailyQ.prompt}
                    size={15.5}
                    style={{ fontWeight: 600, lineHeight: 1.4 }}
                  />
                </div>
                <ApertureChip tone="neutral">{dailyQ.bucket_slug}</ApertureChip>
              </div>
              <form
                onSubmit={e => { e.preventDefault(); saveDaily(); }}
                style={{ display: "flex", gap: 8, alignItems: "stretch" }}
              >
                <input
                  value={dailyAnswer}
                  onChange={e => setDailyAnswer(e.target.value)}
                  placeholder="Type your answer…"
                  style={{
                    flex: 1, appearance: "none", outline: "none",
                    background: "var(--ap-surface-2)",
                    border: "1px solid var(--ap-hairline)",
                    borderRadius: "var(--ap-radius-sm)",
                    padding: "10px 12px", fontSize: 14,
                    color: "var(--ap-ink-1)", fontFamily: "var(--ap-font-sans)",
                  }}
                />
                <ApertureButton type="submit" variant="accent" disabled={!dailyAnswer.trim() || savingDaily}>
                  {savingDaily ? "…" : "Save"}
                </ApertureButton>
                <ApertureButton type="button" variant="ghost" onClick={() => skipDaily()}>
                  Skip
                </ApertureButton>
              </form>
            </ApertureCard>
          </section>
        )}

        {/* Ask dock */}
        <ApertureCard padding={6} style={{ position: "sticky", bottom: 16, marginTop: 24 }}>
          <form
            onSubmit={e => { e.preventDefault(); handleSend(draft); setDraft(""); }}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <ApertureMonoLabel style={{ paddingLeft: 12 }}>Ask</ApertureMonoLabel>
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="Tell me what's going on with your business…"
              style={{
                flex: 1, appearance: "none", border: "none", outline: "none",
                background: "transparent", color: "var(--ap-ink-1)",
                padding: "12px 0", fontSize: 14, fontFamily: "var(--ap-font-sans)",
              }}
            />
            <ApertureButton type="submit" variant="accent" disabled={!draft.trim() || starting}>
              {starting ? "…" : "Start chat"}
            </ApertureButton>
          </form>
        </ApertureCard>
      </RealAppShell>
    </>
  );
}
