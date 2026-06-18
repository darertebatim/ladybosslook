import { Helmet } from "react-helmet-async";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useState } from "react";
import { RealAppShell } from "@/aperture/components/RealAppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureCard, ApertureChip, ApertureMonoLabel, ApertureLoading, ApertureButton,
} from "@/aperture/components/primitives";
import { useApertureBucketsDB } from "@/aperture/hooks/db/useApertureBucketsDB";
import { useApertureMemoryDB } from "@/aperture/hooks/db/useApertureMemoryDB";
import { useApertureChatsDB } from "@/aperture/hooks/db/useApertureChatsDB";
import { useApertureUserProfile } from "@/aperture/hooks/db/useApertureUserProfile";
import { useApertureDailyQuestion } from "@/aperture/hooks/db/useApertureDailyQuestion";
import { useApertureHomeSuggestions } from "@/aperture/hooks/db/useApertureHomeSuggestions";
import { useApertureStoredSuggestions } from "@/aperture/hooks/db/useApertureStoredSuggestions";
import { toast } from "@/hooks/use-toast";

export default function RealHome() {
  const navigate = useNavigate();
  const { buckets, loading: bLoading } = useApertureBucketsDB();
  const { items, loading: mLoading, saveBucketAnswer } = useApertureMemoryDB();
  const { createChat } = useApertureChatsDB();
  const { profile, loading: pLoading } = useApertureUserProfile();
  const { question: dailyQ, refresh: refreshDailyQ, skip: skipDaily } = useApertureDailyQuestion();
  const { suggestions: storedSuggestions, loading: storedLoading, refresh: refreshStored, markActed } = useApertureStoredSuggestions();
  const { suggestions: liveSuggestions, loading: liveLoading, refresh: refreshLive } = useApertureHomeSuggestions(items.length);
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

  // First-time visit → push to Quick Onboarding.
  if (!pLoading && profile && !profile.quick_onboarded_at) {
    return <Navigate to="/aperture/app/onboard/quick" replace />;
  }
  if (!pLoading && !profile) {
    // No profile row yet — also send to onboarding (row is created on first upsert).
    return <Navigate to="/aperture/app/onboard/quick" replace />;
  }

  const knownCount = items.length;
  const hasBuckets = buckets.length > 0;

  async function handleSend(text: string) {
    const t = text.trim();
    if (!t || starting) return;
    setStarting(true);
    const chat = await createChat(t.slice(0, 48));
    setStarting(false);
    if (chat) navigate(`/aperture/app/chats/${chat.id}?seed=${encodeURIComponent(t)}`);
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
    if (chat) navigate(`/aperture/app/chats/${chat.id}?seed=${encodeURIComponent(s.prompt)}`);
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
      <Helmet><title>Today · Aperture</title></Helmet>
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

        {/* Finish full onboarding nudge */}
        {profile?.quick_onboarded_at && !profile?.full_onboarded_at && (
          <Link to="/aperture/app/onboard/full" style={{ textDecoration: "none", display: "block", marginBottom: 20 }}>
            <ApertureCard padding={16} style={{ borderColor: "var(--ap-signal)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <ApertureMonoLabel style={{ color: "var(--ap-signal)" }}>Next step</ApertureMonoLabel>
                  <h3 style={{ margin: "6px 0 2px", fontSize: 15, fontWeight: 600, color: "var(--ap-ink-1)" }}>
                    Finish the full questionnaire
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--ap-ink-3)", lineHeight: 1.45 }}>
                    A deeper dive so I really get your business — answers go straight into memory.
                  </p>
                </div>
                <span style={{ color: "var(--ap-signal)", fontFamily: "var(--ap-font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", flexShrink: 0 }}>
                  Start →
                </span>
              </div>
            </ApertureCard>
          </Link>
        )}

        {/* Daily question */}
        {dailyQ && (
          <section style={{ marginBottom: 28 }}>
            <ApertureMonoLabel style={{ marginBottom: 12, display: "block" }}>Today's question</ApertureMonoLabel>
            <ApertureCard padding={18}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 600, color: "var(--ap-ink-1)", lineHeight: 1.4 }}>
                  {dailyQ.prompt}
                </h3>
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
                      <p style={{ margin: 0, fontSize: 12.5, color: "var(--ap-ink-3)", lineHeight: 1.5 }}>{s.why}</p>
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

        {/* Memory snapshot */}
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <ApertureMonoLabel>Your memory</ApertureMonoLabel>
            <Link to="/aperture/app/memory" style={{ fontSize: 11, color: "var(--ap-ink-3)", textDecoration: "none", fontFamily: "var(--ap-font-mono)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Open →</Link>
          </div>
          {mLoading ? (
            <ApertureLoading label="Loading…" />
          ) : items.length === 0 ? (
            <ApertureCard padding={20}>
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--ap-ink-2)", lineHeight: 1.55 }}>
                Nothing in your memory yet. Just start typing below — I'll listen and remember the parts that matter.
              </p>
            </ApertureCard>
          ) : (
            <ApertureCard padding={18}>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {items.slice(0, 4).map(i => (
                  <li key={i.id} style={{ fontSize: 13.5, color: "var(--ap-ink-1)", lineHeight: 1.5, display: "flex", gap: 8 }}>
                    <span style={{
                      color: i.source === "ai_inferred_pre_onboarding" ? "var(--ap-ink-3)" : "var(--ap-ink-3)",
                      fontFamily: "var(--ap-font-mono)", fontSize: 10, marginTop: 4,
                      textTransform: "uppercase", letterSpacing: "0.1em", minWidth: 70,
                      opacity: i.source === "ai_inferred_pre_onboarding" ? 0.7 : 1,
                    }}>
                      {i.source === "ai_extracted"
                        ? "Noticed"
                        : i.source === "bucket_answer"
                          ? "Bucket"
                          : i.source === "ai_inferred_pre_onboarding"
                            ? "Guess"
                            : "Note"}
                    </span>
                    <span style={{ flex: 1 }}>{i.content}</span>
                  </li>
                ))}
              </ul>
            </ApertureCard>
          )}
        </section>

        {/* Buckets */}
        {!bLoading && (
          <section style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <ApertureMonoLabel>Buckets</ApertureMonoLabel>
              <Link to="/aperture/app/memory" style={{ fontSize: 11, color: "var(--ap-ink-3)", textDecoration: "none", fontFamily: "var(--ap-font-mono)", textTransform: "uppercase", letterSpacing: "0.12em" }}>All →</Link>
            </div>
            {!hasBuckets ? (
              <ApertureCard padding={24} style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 13.5, color: "var(--ap-ink-2)", lineHeight: 1.55 }}>
                  No buckets yet. They'll appear as we talk — and as your business changes.
                </p>
              </ApertureCard>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                {buckets.map(b => (
                  <Link key={b.slug} to={`/aperture/app/memory/${b.slug}`} style={{
                    display: "flex", flexDirection: "column", gap: 8,
                    padding: 16, background: "var(--ap-surface-1)",
                    border: "1px solid var(--ap-hairline)",
                    borderRadius: "var(--ap-radius-md)", textDecoration: "none",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <ApertureMonoLabel>{b.source}</ApertureMonoLabel>
                      {b.glyph && <span style={{ fontFamily: "var(--ap-font-mono)", fontSize: 22, color: "var(--ap-ink-2)" }}>{b.glyph}</span>}
                    </div>
                    <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 600, color: "var(--ap-ink-1)" }}>{b.title}</h3>
                    {b.blurb && <p style={{ margin: 0, fontSize: 12.5, color: "var(--ap-ink-3)", lineHeight: 1.5 }}>{b.blurb}</p>}
                  </Link>
                ))}
              </div>
            )}
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