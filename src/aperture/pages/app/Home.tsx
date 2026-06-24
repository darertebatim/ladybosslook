import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "@/aperture/components/AppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureCard, ApertureChip, ApertureMonoLabel, ApertureButton,
} from "@/aperture/components/primitives";
import { BUCKETS } from "@/aperture/data/buckets";
import { ACTIONS } from "@/aperture/data/playbooks";
import { useApertureMemory } from "@/aperture/hooks/useApertureMemory";
import { useApertureChats } from "@/aperture/hooks/useApertureChats";
import { useState } from "react";

function BucketTile({
  slug, index, title, blurb, glyph, status, filled, total, aiSurfaced,
}: {
  slug: string; index: string; title: string; blurb: string; glyph: string;
  status: "empty" | "partial" | "full"; filled: number; total: number;
  aiSurfaced?: string;
}) {
  const isEmpty = status === "empty";
  const isFull = status === "full";
  return (
    <Link
      to={`/aperture/brand/mockup/memory/${slug}`}
      style={{
        position: "relative",
        display: "flex", flexDirection: "column", gap: 12,
        padding: 18,
        background: isEmpty ? "transparent" : "var(--ap-surface-1)",
        border: `1px ${isEmpty ? "dashed" : "solid"} var(--ap-hairline)`,
        borderRadius: "var(--ap-radius-md)",
        textDecoration: "none",
        minHeight: 156,
        transition: "border-color 120ms ease, background 120ms ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <ApertureMonoLabel>{index}</ApertureMonoLabel>
        <span
          style={{
            fontFamily: "var(--ap-font-mono)",
            fontSize: 28,
            color: isEmpty ? "var(--ap-ink-3)" : isFull ? "var(--ap-signal)" : "var(--ap-ink-2)",
            lineHeight: 1,
            opacity: isEmpty ? 0.4 : 1,
          }}
        >{glyph}</span>
      </div>
      <div>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: isEmpty ? "var(--ap-ink-2)" : "var(--ap-ink-1)", letterSpacing: "-0.01em" }}>
          {title}
        </h3>
        <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "var(--ap-ink-3)", lineHeight: 1.5 }}>
          {blurb}
        </p>
      </div>
      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* tiny progress pips */}
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} style={{
              width: 12, height: 3, borderRadius: 2,
              background: i < filled ? "var(--ap-signal)" : "var(--ap-hairline-strong)",
            }} />
          ))}
        </div>
        <ApertureMonoLabel color={isFull ? "var(--ap-signal)" : "var(--ap-ink-3)"}>
          {isEmpty ? "Empty" : isFull ? "Full" : `${filled}/${total}`}
        </ApertureMonoLabel>
      </div>
      {aiSurfaced && status !== "full" && (
        <span
          title={aiSurfaced}
          style={{
            position: "absolute", top: 12, right: 12,
            width: 6, height: 6, borderRadius: 999,
            background: "var(--ap-signal)",
          }}
          className="ap-pulse"
        />
      )}
    </Link>
  );
}

export default function ApertureHome() {
  const navigate = useNavigate();
  const { buckets, completion, totalAnswered, totalQuestions } = useApertureMemory();
  const { createChat } = useApertureChats();
  const [draft, setDraft] = useState("");

  // Suggestions are personalized: filter by buckets that are at least partial.
  // Then weight playbooks first, prompts second. Show top 3.
  const knownBuckets = new Set(buckets.filter(b => b.status !== "empty").map(b => b.slug));
  const suggested = [...ACTIONS]
    .sort((a, b) => {
      const aMatch = a.needs.filter(n => knownBuckets.has(n)).length;
      const bMatch = b.needs.filter(n => knownBuckets.has(n)).length;
      if (aMatch !== bMatch) return bMatch - aMatch;
      if (a.kind !== b.kind) return a.kind === "playbook" ? -1 : 1;
      return 0;
    })
    .slice(0, 3);

  const firstName = (buckets.find(b => b.slug === "basics")?.answers.name ?? "").split(" ")[0];
  const greeting = firstName ? `Hey ${firstName}.` : "Welcome to RiloBiz.";
  const subline =
    totalAnswered === 0
      ? "Let's fill your first memory bucket so I can actually help. Start with the basics."
      : `I know ${totalAnswered} of ${totalQuestions} things about your business. Here's what I think you should work on.`;

  function handleSend(text: string) {
    const t = text.trim();
    if (!t) return;
    const thread = createChat(t);
    navigate(`/aperture/brand/mockup/chats/${thread.id}?seed=${encodeURIComponent(t)}`);
  }

  return (
    <>
      <Helmet>
        <title>Today · RiloBiz</title>
        <meta name="description" content="Your AI business advisor. Personalized suggestions based on what it knows about your business." />
      </Helmet>
      <AppShell>
        <PageHeader
          index="00 · TODAY"
          title={greeting}
          sub={subline}
          action={
            <ApertureChip tone={completion === 0 ? "neutral" : "signal"}>
              Memory · {completion}%
            </ApertureChip>
          }
        />

        {/* Suggested for you */}
        <section style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <ApertureMonoLabel>Suggested for you</ApertureMonoLabel>
            <Link to="/aperture/brand/mockup/library" style={{ fontSize: 11, color: "var(--ap-ink-3)", textDecoration: "none", fontFamily: "var(--ap-font-mono)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Browse all →</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
            {suggested.map(a => (
              <Link
                key={a.slug}
                to={`/aperture/brand/mockup/library/${a.slug}`}
                style={{
                  display: "flex", flexDirection: "column", gap: 10,
                  padding: 18,
                  background: "var(--ap-surface-1)",
                  border: "1px solid var(--ap-hairline)",
                  borderRadius: "var(--ap-radius-md)",
                  boxShadow: "var(--ap-shadow-card)",
                  textDecoration: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <ApertureChip tone={a.kind === "playbook" ? "signal" : "neutral"}>
                    {a.kind === "playbook" ? "Playbook" : "Quick prompt"}
                  </ApertureChip>
                  <ApertureMonoLabel>{a.duration}</ApertureMonoLabel>
                </div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--ap-ink-1)", letterSpacing: "-0.015em", lineHeight: 1.3 }}>
                  {a.title}
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: "var(--ap-ink-2)", lineHeight: 1.5 }}>
                  {a.blurb}
                </p>
                <div style={{
                  marginTop: 6, paddingTop: 12,
                  borderTop: "1px dashed var(--ap-hairline)",
                  fontSize: 12, color: "var(--ap-ink-3)", fontStyle: "italic", lineHeight: 1.5,
                }}>
                  Why this: {a.why}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Memory buckets */}
        <section style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <ApertureMonoLabel>Memory buckets</ApertureMonoLabel>
            <Link to="/aperture/brand/mockup/memory" style={{ fontSize: 11, color: "var(--ap-ink-3)", textDecoration: "none", fontFamily: "var(--ap-font-mono)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Open all →</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            {buckets.map(b => {
              const meta = BUCKETS.find(x => x.slug === b.slug)!;
              return (
                <BucketTile
                  key={b.slug}
                  slug={meta.slug}
                  index={meta.index}
                  title={meta.title}
                  blurb={meta.blurb}
                  glyph={meta.glyph}
                  status={b.status}
                  filled={b.filled}
                  total={b.total}
                  aiSurfaced={meta.aiSurfaced}
                />
              );
            })}
          </div>
        </section>

        {/* Always-on chat dock */}
        <ApertureCard padding={6} style={{ position: "sticky", bottom: 16, marginTop: 24 }}>
          <form
            onSubmit={e => { e.preventDefault(); handleSend(draft); setDraft(""); }}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <ApertureMonoLabel style={{ paddingLeft: 12 }}>Ask</ApertureMonoLabel>
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="Or just tell me what's going on with your business right now…"
              style={{
                flex: 1, appearance: "none", border: "none", outline: "none",
                background: "transparent", color: "var(--ap-ink-1)",
                padding: "12px 0", fontSize: 14, fontFamily: "var(--ap-font-sans)",
              }}
            />
            <ApertureButton type="submit" variant="accent" disabled={!draft.trim()}>
              Start chat
            </ApertureButton>
          </form>
        </ApertureCard>
      </AppShell>
    </>
  );
}