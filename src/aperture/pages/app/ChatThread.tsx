import { Helmet } from "react-helmet-async";
import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AppShell } from "@/aperture/components/AppShell";
import { ApertureChip, ApertureMonoLabel } from "@/aperture/components/primitives";
import { useApertureChats } from "@/aperture/hooks/useApertureChats";
import { useApertureMemory } from "@/aperture/hooks/useApertureMemory";

/**
 * Claude-style conversation. No real model in this design demo —
 * assistant replies are scripted to feel grounded in bucket memory.
 */

function scriptedReply(userText: string, facts: { label: string; value: string }[]): string {
  const name = facts.find(f => /name/i.test(f.label))?.value;
  const industry = facts.find(f => /kind of business/i.test(f.label))?.value;
  const stuck = facts.find(f => /stuck on/i.test(f.label))?.value;

  if (facts.length === 0) {
    return "I don't know anything about your business yet, so my answer would be generic.\n\nOpen Memory and fill the Business basics bucket — just 5 short questions. After that, ask me again and I'll give you something actually useful.";
  }

  const lead = name && industry
    ? `Based on what I know about ${name} (${industry})${stuck ? ` and that you're stuck on "${stuck}"` : ""}:`
    : `Based on the ${facts.length} thing${facts.length === 1 ? "" : "s"} I know about your business:`;

  // Crude intent matching for demo
  const t = userText.toLowerCase();
  if (/price|pricing|charge|cost|raise/.test(t)) {
    return `${lead}\n\nPricing isn't usually about the number — it's about whether your best customers flinch. From your bucket: you set prices by looking at competitors. That's risky because your costs and your audience are different from theirs.\n\nThree questions before we change a number:\n1. What's your gross margin on your top seller?\n2. When was the last time someone walked away over price?\n3. If you raised $1, who's the first customer you'd lose — and would you actually miss them?\n\nWant me to walk you through that as a playbook?`;
  }
  if (/instagram|insta|social|post|content/.test(t)) {
    return `${lead}\n\nMost small businesses overthink Instagram and end up posting nothing. The version that works for you isn't a content calendar — it's one repeatable post type you can shoot in 20 minutes.\n\nGiven your situation, my recommendation: behind-the-scenes shots of you actually making the thing. They convert better than product photos for first-time businesses because they sell the story, not the item.\n\nWant the "Plan your first real month on Instagram" playbook?`;
  }
  if (/slow|quiet|no customers|empty/.test(t)) {
    return `${lead}\n\nSlow weeks usually aren't a marketing problem — they're a "who haven't we talked to" problem. Before you spend $0 on ads:\n\n• List the 5 people most likely to buy in the next 3 days.\n• Send each one a short, personal message (I can draft it).\n• Then we'll talk about the longer-term fix.\n\nWant me to draft those 5 messages?`;
  }
  return `${lead}\n\nGood question. Here's how I'd think about it:\n\n• What's the smallest version of this we could test in 7 days?\n• What part of your business does it actually affect — revenue, customers, or your time?\n• What would make you stop doing this if it didn't work?\n\nGive me one of those and I'll get specific.`;
}

export default function ChatThread() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const { getChat, appendMessage, createChat, chats, deleteChat } = useApertureChats();
  const { facts, completion } = useApertureMemory();

  const chat = id ? getChat(id) : undefined;
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const seedHandledRef = useRef<string | null>(null);

  // Handle ?seed= from home composer — send it as the first user message
  useEffect(() => {
    if (!chat) return;
    const seed = search.get("seed");
    if (!seed) return;
    if (seedHandledRef.current === chat.id) return;
    if (chat.messages.length > 0) { seedHandledRef.current = chat.id; return; }
    seedHandledRef.current = chat.id;
    handleSend(seed);
    // strip seed from URL
    navigate(`/aperture/brand/mockup/chats/${chat.id}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat?.id, search]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat?.messages.length, thinking]);

  if (!id) return <Navigate to="/aperture/brand/mockup/chats" replace />;
  if (!chat) return <Navigate to="/aperture/brand/mockup/chats" replace />;

  function handleSend(text: string) {
    const t = text.trim();
    if (!t) return;
    appendMessage(chat!.id, { role: "user", text: t });
    setDraft("");
    setThinking(true);
    setTimeout(() => {
      appendMessage(chat!.id, { role: "assistant", text: scriptedReply(t, facts) });
      setThinking(false);
    }, 900);
  }

  function startNew() {
    const t = createChat();
    navigate(`/aperture/brand/mockup/chats/${t.id}`);
  }

  return (
    <>
      <Helmet>
        <title>{chat.title} · Aperture</title>
      </Helmet>
      <AppShell
        rightRail={
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <button
              onClick={startNew}
              style={{
                appearance: "none", cursor: "pointer",
                padding: "10px 12px", borderRadius: "var(--ap-radius-sm)",
                background: "var(--ap-signal)", color: "var(--ap-on-signal)",
                border: "none", fontFamily: "var(--ap-font-sans)", fontWeight: 500, fontSize: 13,
              }}
            >+ New chat</button>
            <div>
              <ApertureMonoLabel>Recent</ApertureMonoLabel>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 2 }}>
                {chats.slice(0, 8).map(c => (
                  <Link
                    key={c.id}
                    to={`/aperture/brand/mockup/chats/${c.id}`}
                    style={{
                      padding: "8px 10px", borderRadius: "var(--ap-radius-xs)",
                      fontSize: 13, textDecoration: "none",
                      background: c.id === chat.id ? "var(--ap-surface-2)" : "transparent",
                      color: c.id === chat.id ? "var(--ap-ink-1)" : "var(--ap-ink-2)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}
                  >{c.title}</Link>
                ))}
              </div>
            </div>
            <div style={{ paddingTop: 14, borderTop: "1px solid var(--ap-hairline)" }}>
              <ApertureMonoLabel>Grounded in</ApertureMonoLabel>
              <p style={{ margin: "8px 0 10px", fontSize: 12.5, color: "var(--ap-ink-2)", lineHeight: 1.5 }}>
                {facts.length === 0
                  ? "Nothing yet — your memory buckets are empty."
                  : `${facts.length} fact${facts.length === 1 ? "" : "s"} from your memory.`}
              </p>
              <Link to="/aperture/brand/mockup/memory" style={{ fontSize: 11, color: "var(--ap-signal)", textDecoration: "none", fontFamily: "var(--ap-font-mono)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Memory · {completion}% →
              </Link>
            </div>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 110px)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ minWidth: 0 }}>
              <ApertureMonoLabel>02 · CONVERSATION</ApertureMonoLabel>
              <h1 style={{ margin: "6px 0 0", fontSize: 20, fontWeight: 600, color: "var(--ap-ink-1)", letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {chat.title}
              </h1>
            </div>
            <ApertureChip tone={facts.length > 0 ? "signal" : "neutral"}>
              Memory · {facts.length}
            </ApertureChip>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", paddingRight: 4, display: "flex", flexDirection: "column", gap: 18 }}>
            {chat.messages.length === 0 && (
              <div style={{ margin: "auto 0", textAlign: "center", color: "var(--ap-ink-3)", fontSize: 13.5 }}>
                Type something — I already know what's in your memory buckets.
              </div>
            )}
            {chat.messages.map(m => (
              <div key={m.id} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                {m.role === "assistant" ? (
                  <div style={{ maxWidth: "82%" }}>
                    <ApertureMonoLabel style={{ display: "block", marginBottom: 6 }}>Aperture</ApertureMonoLabel>
                    <div style={{ color: "var(--ap-ink-1)", fontSize: 14.5, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <div style={{ maxWidth: "78%" }}>
                    <div style={{
                      padding: "10px 14px",
                      borderRadius: "var(--ap-radius-md) var(--ap-radius-md) 4px var(--ap-radius-md)",
                      background: "var(--ap-signal)",
                      color: "var(--ap-on-signal)",
                      fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap",
                    }}>{m.text}</div>
                  </div>
                )}
              </div>
            ))}
            {thinking && (
              <div style={{ display: "flex" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 12px", background: "var(--ap-surface-1)", border: "1px solid var(--ap-hairline)", borderRadius: "var(--ap-radius-md)" }}>
                  <span className="ap-pulse" style={{ width: 6, height: 6, borderRadius: 999, background: "var(--ap-ink-3)" }} />
                  <span className="ap-pulse" style={{ width: 6, height: 6, borderRadius: 999, background: "var(--ap-ink-3)", animationDelay: "0.2s" }} />
                  <span className="ap-pulse" style={{ width: 6, height: 6, borderRadius: 999, background: "var(--ap-ink-3)", animationDelay: "0.4s" }} />
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={e => { e.preventDefault(); handleSend(draft); }}
            style={{
              marginTop: 14,
              display: "flex", gap: 8, alignItems: "center",
              padding: 6,
              background: "var(--ap-surface-1)",
              border: "1px solid var(--ap-hairline)",
              borderRadius: 999,
            }}
          >
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="Ask Aperture about your business…"
              style={{
                flex: 1, appearance: "none", border: "none", outline: "none",
                background: "transparent", color: "var(--ap-ink-1)",
                padding: "10px 14px", fontSize: 14, fontFamily: "var(--ap-font-sans)",
              }}
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="Send"
              style={{
                appearance: "none", cursor: draft.trim() ? "pointer" : "default",
                border: "none",
                height: 36, width: 36, borderRadius: 999,
                background: draft.trim() ? "var(--ap-signal)" : "var(--ap-surface-3)",
                color: draft.trim() ? "var(--ap-on-signal)" : "var(--ap-ink-3)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
          </form>
        </div>
      </AppShell>
    </>
  );
}