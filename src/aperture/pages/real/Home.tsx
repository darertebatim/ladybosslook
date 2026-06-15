import { Helmet } from "react-helmet-async";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useState } from "react";
import { RealAppShell } from "@/aperture/components/RealAppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureCard, ApertureChip, ApertureMonoLabel, ApertureButton,
} from "@/aperture/components/primitives";
import { useApertureBucketsDB } from "@/aperture/hooks/db/useApertureBucketsDB";
import { useApertureMemoryDB } from "@/aperture/hooks/db/useApertureMemoryDB";
import { useApertureChatsDB } from "@/aperture/hooks/db/useApertureChatsDB";
import { useApertureUserProfile } from "@/aperture/hooks/db/useApertureUserProfile";

export default function RealHome() {
  const navigate = useNavigate();
  const { buckets, loading: bLoading } = useApertureBucketsDB();
  const { items, loading: mLoading } = useApertureMemoryDB();
  const { createChat } = useApertureChatsDB();
  const { profile, loading: pLoading } = useApertureUserProfile();
  const [draft, setDraft] = useState("");
  const [starting, setStarting] = useState(false);

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

        {/* Memory snapshot */}
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <ApertureMonoLabel>Your memory</ApertureMonoLabel>
            <Link to="/aperture/app/memory" style={{ fontSize: 11, color: "var(--ap-ink-3)", textDecoration: "none", fontFamily: "var(--ap-font-mono)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Open →</Link>
          </div>
          {mLoading ? (
            <ApertureCard padding={20}><ApertureMonoLabel>Loading…</ApertureMonoLabel></ApertureCard>
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
                    <span style={{ color: "var(--ap-ink-3)", fontFamily: "var(--ap-font-mono)", fontSize: 10, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.1em", minWidth: 70 }}>
                      {i.source === "ai_extracted" ? "Noticed" : i.source === "bucket_answer" ? "Bucket" : "Note"}
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