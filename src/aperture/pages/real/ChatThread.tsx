import { Helmet } from "react-helmet-async";
import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { RealAppShell } from "@/aperture/components/RealAppShell";
import { ApertureChip, ApertureMonoLabel } from "@/aperture/components/primitives";
import { useApertureChatsDB, useApertureChatMessages, type MessageRow } from "@/aperture/hooks/db/useApertureChatsDB";
import { useApertureMemoryDB } from "@/aperture/hooks/db/useApertureMemoryDB";
import { streamApertureChat } from "@/aperture/lib/apertureChat";
import { toast } from "@/hooks/use-toast";

export default function RealChatThread() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const { chats, createChat, deleteChat } = useApertureChatsDB();
  const { messages, setMessages, refresh } = useApertureChatMessages(id);
  const { items } = useApertureMemoryDB();

  const [streaming, setStreaming] = useState(false);
  const [draft, setDraft] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const seedHandledRef = useRef<string | null>(null);

  const chat = chats.find(c => c.id === id);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, streamingText]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || !id || streaming) return;
    const optimistic: MessageRow = {
      id: `local-${Date.now()}`, chat_id: id, role: "user",
      content: t, created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setDraft("");
    setStreaming(true);
    setStreamingText("");
    try {
      const history = [...messages, optimistic].map(m => ({ role: m.role, content: m.content }));
      await streamApertureChat({
        chatId: id, messages: history,
        onDelta: chunk => setStreamingText(prev => prev + chunk),
      });
      // Pull authoritative copy from DB (server persisted both messages)
      await refresh();
    } catch (err: any) {
      toast({
        title: "Chat failed",
        description: err?.message ?? "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setStreaming(false);
      setStreamingText("");
    }
  }

  // Send the ?seed=… text from Home once when the chat loads empty.
  useEffect(() => {
    if (!id) return;
    const seed = search.get("seed");
    if (!seed) return;
    if (seedHandledRef.current === id) return;
    if (messages.length > 0) { seedHandledRef.current = id; return; }
    seedHandledRef.current = id;
    navigate(`/aperture/app/chats/${id}`, { replace: true });
    send(seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, search, messages.length]);

  async function startNew() {
    const c = await createChat();
    if (c) navigate(`/aperture/app/chats/${c.id}`);
  }

  if (!id) return <Navigate to="/aperture/app/chats" replace />;

  return (
    <>
      <Helmet><title>{chat?.title ?? "Chat"} · Aperture</title></Helmet>
      <RealAppShell
        rightRail={
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <button onClick={startNew} style={{
              appearance: "none", cursor: "pointer",
              padding: "10px 12px", borderRadius: "var(--ap-radius-sm)",
              background: "var(--ap-signal)", color: "var(--ap-on-signal)",
              border: "none", fontFamily: "var(--ap-font-sans)", fontWeight: 500, fontSize: 13,
            }}>+ New chat</button>
            <div>
              <ApertureMonoLabel>Recent</ApertureMonoLabel>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 2 }}>
                {chats.slice(0, 10).map(c => (
                  <Link key={c.id} to={`/aperture/app/chats/${c.id}`} style={{
                    padding: "8px 10px", borderRadius: "var(--ap-radius-xs)",
                    fontSize: 13, textDecoration: "none",
                    background: c.id === id ? "var(--ap-surface-2)" : "transparent",
                    color: c.id === id ? "var(--ap-ink-1)" : "var(--ap-ink-2)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{c.title}</Link>
                ))}
              </div>
            </div>
            <div style={{ paddingTop: 14, borderTop: "1px solid var(--ap-hairline)" }}>
              <ApertureMonoLabel>Grounded in</ApertureMonoLabel>
              <p style={{ margin: "8px 0 10px", fontSize: 12.5, color: "var(--ap-ink-2)", lineHeight: 1.5 }}>
                {items.length === 0
                  ? "Nothing yet — your memory is empty."
                  : `${items.length} thing${items.length === 1 ? "" : "s"} from your memory.`}
              </p>
              <Link to="/aperture/app/memory" style={{ fontSize: 11, color: "var(--ap-signal)", textDecoration: "none", fontFamily: "var(--ap-font-mono)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Open memory →
              </Link>
            </div>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 110px)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ minWidth: 0 }}>
              <ApertureMonoLabel>CONVERSATION</ApertureMonoLabel>
              <h1 style={{ margin: "6px 0 0", fontSize: 20, fontWeight: 600, color: "var(--ap-ink-1)", letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {chat?.title ?? "Chat"}
              </h1>
            </div>
            <ApertureChip tone={items.length > 0 ? "signal" : "neutral"}>
              Memory · {items.length}
            </ApertureChip>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", paddingRight: 4, display: "flex", flexDirection: "column", gap: 18 }}>
            {messages.length === 0 && !streaming && (
              <ChatOpener onPick={text => send(text)} />
            )}
            {messages.map(m => (
              <MessageBubble key={m.id} role={m.role} text={m.content} onPickOption={send} disabled={streaming} />
            ))}
            {streaming && streamingText && (
              <MessageBubble role="assistant" text={streamingText} onPickOption={send} disabled />
            )}
            {streaming && !streamingText && (
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
            onSubmit={e => { e.preventDefault(); send(draft); }}
            style={{
              marginTop: 14, display: "flex", gap: 8, alignItems: "center",
              padding: 6, background: "var(--ap-surface-1)",
              border: "1px solid var(--ap-hairline)", borderRadius: 999,
            }}
          >
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="Ask Aperture about your business…"
              disabled={streaming}
              style={{
                flex: 1, appearance: "none", border: "none", outline: "none",
                background: "transparent", color: "var(--ap-ink-1)",
                padding: "10px 14px", fontSize: 14, fontFamily: "var(--ap-font-sans)",
              }}
            />
            <button
              type="submit"
              disabled={!draft.trim() || streaming}
              aria-label="Send"
              style={{
                appearance: "none", cursor: draft.trim() && !streaming ? "pointer" : "default",
                border: "none", height: 36, width: 36, borderRadius: 999,
                background: draft.trim() && !streaming ? "var(--ap-signal)" : "var(--ap-surface-3)",
                color: draft.trim() && !streaming ? "var(--ap-on-signal)" : "var(--ap-ink-3)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
          </form>
        </div>
      </RealAppShell>
    </>
  );
}

function MessageBubble({ role, text, onPickOption, disabled }: { role: string; text: string; onPickOption?: (t: string) => void; disabled?: boolean }) {
  if (role === "assistant" || role === "system") {
    const { body, options } = splitAssistantOptions(text);
    return (
      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <div style={{ maxWidth: "82%" }}>
          <ApertureMonoLabel style={{ display: "block", marginBottom: 6 }}>Aperture</ApertureMonoLabel>
          <div style={{ color: "var(--ap-ink-1)", fontSize: 14.5, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {body}
          </div>
          {options.length > 0 && (
            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {options.map((opt, idx) => (
                <button
                  key={`${idx}-${opt}`}
                  type="button"
                  disabled={disabled || !onPickOption}
                  onClick={() => onPickOption?.(opt)}
                  style={{
                    appearance: "none",
                    cursor: disabled || !onPickOption ? "default" : "pointer",
                    padding: "8px 12px", borderRadius: 999,
                    border: "1px solid var(--ap-hairline)",
                    background: "var(--ap-surface-2)",
                    color: "var(--ap-ink-1)",
                    fontSize: 13, fontWeight: 500, fontFamily: "var(--ap-font-sans)",
                    opacity: disabled ? 0.5 : 1,
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div style={{ maxWidth: "78%" }}>
        <div style={{
          padding: "10px 14px",
          borderRadius: "var(--ap-radius-md) var(--ap-radius-md) 4px var(--ap-radius-md)",
          background: "var(--ap-signal)", color: "var(--ap-on-signal)",
          fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap",
        }}>{text}</div>
      </div>
    </div>
  );
}

/**
 * Splits assistant text into prose + clickable options. The model is
 * instructed to append a trailing block:
 *   [OPTIONS]
 *   - Option A
 *   - Option B
 *   [/OPTIONS]
 */
function splitAssistantOptions(text: string): { body: string; options: string[] } {
  const match = text.match(/\[OPTIONS\]([\s\S]*?)\[\/OPTIONS\]/i);
  if (!match) return { body: text.trim(), options: [] };
  const body = text.replace(match[0], "").trim();
  const options = match[1]
    .split("\n")
    .map(l => l.replace(/^\s*[-*•]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 6);
  return { body, options };
}

const OPENER_OPTIONS: { label: string; seed: string }[] = [
  { label: "My customers and who I'm selling to",
    seed: "Let's talk about my customers and who I'm selling to." },
  { label: "What I sell and how I price it",
    seed: "Let's talk about what I sell and how I price it." },
  { label: "How I get new customers",
    seed: "Let's talk about how I get new customers." },
  { label: "My finances and profit",
    seed: "Let's talk about my finances and profit." },
  { label: "My team and how I run the business",
    seed: "Let's talk about my team and how I run the business." },
  { label: "Where I want to take this business",
    seed: "Let's talk about where I want to take this business." },
];

function ChatOpener({ onPick }: { onPick: (seed: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 8 }}>
      <div>
        <ApertureMonoLabel>Aperture</ApertureMonoLabel>
        <h2 style={{ margin: "8px 0 4px", fontSize: 18, fontWeight: 600, color: "var(--ap-ink-1)", letterSpacing: "-0.01em" }}>
          What would you like to talk about today?
        </h2>
        <p style={{ margin: 0, fontSize: 13.5, color: "var(--ap-ink-3)", lineHeight: 1.55 }}>
          Pick a starting point — or just type whatever's on your mind.
        </p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {OPENER_OPTIONS.map(o => (
          <button
            key={o.label}
            type="button"
            onClick={() => onPick(o.seed)}
            style={{
              appearance: "none", cursor: "pointer",
              padding: "10px 14px", borderRadius: 999,
              border: "1px solid var(--ap-hairline)",
              background: "var(--ap-surface-1)",
              color: "var(--ap-ink-1)",
              fontSize: 13.5, fontWeight: 500, fontFamily: "var(--ap-font-sans)",
              textAlign: "left",
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}