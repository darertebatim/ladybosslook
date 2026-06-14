import { Helmet } from "react-helmet-async";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/aperture/components/AppShell";
import {
  ApertureCard, ApertureChip, ApertureMonoLabel, ApertureIntegrationDot,
} from "@/aperture/components/primitives";
import { INTEGRATIONS } from "@/aperture/data/integrations";

interface Msg {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: string[];
}

const SEED: Msg[] = [
  { id: "1", role: "assistant", text: "Hi — I'm grounded in Maven & Co.'s connected sources. Ask me anything about revenue, customers, content, or ops.", sources: ["stripe", "shopify", "instagram"] },
  { id: "2", role: "user", text: "Why was revenue up this week?" },
  { id: "3", role: "assistant", text: "Net revenue is $48,210 this week, up 12% from last week. The lift was driven almost entirely by the Pro plan (+18% WoW). Three lapsed customers also reactivated, which added $1,840 in one-time revenue. Refund rate held flat at 1.4%.", sources: ["stripe", "quickbooks"] },
];

const SUGGESTIONS = [
  "Show me lapsed VIP customers",
  "Draft an IG post about this week",
  "What changed in ops since yesterday?",
  "ROAS by campaign, last 7 days",
];

export default function ApertureChat() {
  const [messages, setMessages] = useState<Msg[]>(SEED);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  function send(text: string) {
    if (!text.trim()) return;
    const userMsg: Msg = { id: String(Date.now()), role: "user", text };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setMessages(m => [...m, {
        id: String(Date.now() + 1),
        role: "assistant",
        text: "I'm a demo — in the real product I'd answer this grounded in your Stripe, Shopify, and Instagram data. For now, try one of the suggested prompts to see a sample reply.",
        sources: ["stripe", "shopify"],
      }]);
      setThinking(false);
    }, 900);
  }

  return (
    <>
      <Helmet>
        <title>Chat · Aperture</title>
        <meta name="description" content="Ask Aperture anything about your business — grounded in your connected data." />
      </Helmet>
      <AppShell>
        <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 96px)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div>
              <ApertureMonoLabel>02 · CHAT</ApertureMonoLabel>
              <h1 style={{ margin: "6px 0 0", fontSize: 22, fontWeight: 600, color: "var(--ap-ink-1)", letterSpacing: "-0.02em" }}>Ask the memory</h1>
            </div>
            <ApertureChip tone="live" icon={<span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--ap-live)", display: "inline-block" }} className="ap-pulse" />}>
              Grounded · 6 sources
            </ApertureChip>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", paddingRight: 4, display: "flex", flexDirection: "column", gap: 14 }}>
            {messages.map(m => (
              <div key={m.id} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "78%" }}>
                  {m.role === "assistant" && (
                    <ApertureMonoLabel style={{ display: "block", marginBottom: 6 }}>Aperture</ApertureMonoLabel>
                  )}
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: m.role === "user" ? "var(--ap-radius-md) var(--ap-radius-md) 4px var(--ap-radius-md)" : "var(--ap-radius-md) var(--ap-radius-md) var(--ap-radius-md) 4px",
                      background: m.role === "user" ? "var(--ap-signal)" : "var(--ap-surface-1)",
                      color: m.role === "user" ? "var(--ap-on-signal)" : "var(--ap-ink-1)",
                      border: m.role === "user" ? "1px solid transparent" : "1px solid var(--ap-hairline)",
                      fontSize: 14,
                      lineHeight: 1.55,
                    }}
                  >
                    {m.text}
                  </div>
                  {m.sources && m.sources.length > 0 && (
                    <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {m.sources.map(s => {
                        const it = INTEGRATIONS.find(x => x.slug === s);
                        if (!it) return null;
                        return (
                          <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", background: "var(--ap-surface-2)", border: "1px solid var(--ap-hairline)", borderRadius: 999, fontSize: 10.5, color: "var(--ap-ink-2)", fontFamily: "var(--ap-font-mono)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                            <ApertureIntegrationDot color={it.color} size={5} status="live" />
                            {it.name}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {thinking && (
              <div style={{ display: "flex" }}>
                <ApertureCard padding={12} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span className="ap-pulse" style={{ width: 6, height: 6, borderRadius: 999, background: "var(--ap-ink-3)", display: "inline-block" }} />
                  <span className="ap-pulse" style={{ width: 6, height: 6, borderRadius: 999, background: "var(--ap-ink-3)", display: "inline-block", animationDelay: "0.2s" }} />
                  <span className="ap-pulse" style={{ width: 6, height: 6, borderRadius: 999, background: "var(--ap-ink-3)", display: "inline-block", animationDelay: "0.4s" }} />
                </ApertureCard>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {messages.length <= 3 && (
            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    appearance: "none", cursor: "pointer",
                    padding: "8px 12px",
                    fontSize: 12.5,
                    background: "var(--ap-surface-1)",
                    border: "1px solid var(--ap-hairline)",
                    color: "var(--ap-ink-2)",
                    borderRadius: 999,
                    fontFamily: "var(--ap-font-sans)",
                  }}
                >{s}</button>
              ))}
            </div>
          )}

          {/* Composer */}
          <form
            onSubmit={e => { e.preventDefault(); send(input); }}
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
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask Aperture about your business…"
              style={{
                flex: 1,
                appearance: "none", border: "none", outline: "none",
                background: "transparent",
                color: "var(--ap-ink-1)",
                padding: "10px 14px",
                fontSize: 14,
                fontFamily: "var(--ap-font-sans)",
              }}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              style={{
                appearance: "none", cursor: input.trim() ? "pointer" : "default",
                border: "none",
                height: 36, width: 36, borderRadius: 999,
                background: input.trim() ? "var(--ap-signal)" : "var(--ap-surface-3)",
                color: input.trim() ? "var(--ap-on-signal)" : "var(--ap-ink-3)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                transition: "background 120ms ease",
              }}
              aria-label="Send"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6"/>
              </svg>
            </button>
          </form>
        </div>
      </AppShell>
    </>
  );
}