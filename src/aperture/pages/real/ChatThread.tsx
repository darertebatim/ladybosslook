import { Helmet } from "react-helmet-async";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { RealAppShell } from "@/aperture/components/RealAppShell";
import { ApertureChip, ApertureMonoLabel } from "@/aperture/components/primitives";
import { useApertureChatsDB, useApertureChatMessages, type MessageRow } from "@/aperture/hooks/db/useApertureChatsDB";
import { useApertureMemoryDB } from "@/aperture/hooks/db/useApertureMemoryDB";
import { streamApertureChat } from "@/aperture/lib/apertureChat";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ChatComposer } from "@/aperture/components/chat/ChatComposer";
import { ChatAttachments, AttachmentMemoryChip } from "@/aperture/components/chat/ChatAttachments";
import type { SentAttachment } from "@/aperture/lib/chatAttachments";

export default function RealChatThread() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const { chats, createChat, deleteChat } = useApertureChatsDB();
  const { messages, setMessages, refresh } = useApertureChatMessages(id);
  const { items } = useApertureMemoryDB();

  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const seedHandledRef = useRef<string | null>(null);

  const chat = chats.find(c => c.id === id);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, streamingText]);

  async function send(
    text: string,
    escape?: { kind: "skip" | "unknown"; question: string },
    attachments?: SentAttachment[],
  ) {
    const t = text.trim();
    if (!id || streaming) return;
    if (!escape && !t && !(attachments && attachments.length > 0)) return;
    let nextHistory = messages;
    if (!escape) {
      const optimistic: MessageRow = {
        id: `local-${Date.now()}`, chat_id: id, role: "user",
        content: t, created_at: new Date().toISOString(),
        attachments: attachments ?? [],
      };
      setMessages(prev => [...prev, optimistic]);
      nextHistory = [...messages, optimistic];
    }
    setStreaming(true);
    setStreamingText("");
    try {
      const history = nextHistory.map(m => ({ role: m.role, content: m.content }));
      await streamApertureChat({
        chatId: id, messages: history,
        onDelta: chunk => setStreamingText(prev => prev + chunk),
        escape: escape ? { kind: escape.kind, question: escape.question, bucket: null } : undefined,
        attachments: attachments ?? [],
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
    // Pre-seeded opener is assistant-only; treat the chat as "empty" until
    // there is a real user message, so ?seed=… from Home still fires once.
    const hasUserMessage = messages.some(m => m.role === "user");
    if (hasUserMessage) { seedHandledRef.current = id; return; }
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
        <div style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 220px)", minHeight: 360 }}>
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
            {messages.map(m => (
              <MessageBubble key={m.id} role={m.role} text={m.content} onPickOption={send} disabled={streaming} attachments={m.attachments} />
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

          {id && user && (
            <ChatComposer
              chatId={id}
              userId={user.id}
              disabled={streaming}
              onSend={(text, atts) => send(text, undefined, atts)}
            />
          )}
          <EscapeLinks
            messages={messages}
            streaming={streaming}
            onEscape={(kind, question) => send("", { kind, question })}
          />
        </div>
      </RealAppShell>
    </>
  );
}

/**
 * Skip / I don't know — small text links beneath the composer.
 * Visible only when the latest assistant message is a question
 * (ends with "?" or contains an [OPTIONS] block).
 */
function EscapeLinks({
  messages, streaming, onEscape,
}: {
  messages: MessageRow[];
  streaming: boolean;
  onEscape: (kind: "skip" | "unknown", question: string) => void;
}) {
  const lastAssistant = [...messages].reverse().find(m => m.role === "assistant" || m.role === "system");
  if (!lastAssistant) return null;
  const { body, options } = splitAssistantOptions(lastAssistant.content);
  const isQuestion = options.length > 0 || /\?\s*$/.test(body.trim());
  if (!isQuestion) return null;
  const linkStyle: CSSProperties = {
    appearance: "none", background: "transparent", border: "none",
    color: streaming ? "var(--ap-ink-3)" : "var(--ap-ink-2)",
    fontSize: 12, fontFamily: "var(--ap-font-sans)",
    cursor: streaming ? "default" : "pointer",
    padding: "4px 6px", textDecoration: "underline",
    textUnderlineOffset: 3, opacity: streaming ? 0.5 : 1,
  };
  return (
    <div style={{ marginTop: 8, display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
      <button type="button" disabled={streaming} style={linkStyle}
        onClick={() => onEscape("skip", body)}>Skip for now</button>
      <span style={{ color: "var(--ap-ink-3)", fontSize: 12 }}>·</span>
      <button type="button" disabled={streaming} style={linkStyle}
        onClick={() => onEscape("unknown", body)}>I don't know</button>
    </div>
  );
}

function MessageBubble({ role, text, onPickOption, disabled, attachments }: {
  role: string;
  text: string;
  onPickOption?: (t: string) => void;
  disabled?: boolean;
  attachments?: Array<{ file_id: string; storage_path: string; mime: string; name: string; size: number }>;
}) {
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
            <OptionChips options={options} disabled={!!disabled} onPick={onPickOption} />
          )}
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
        {attachments && attachments.length > 0 && (
          <ChatAttachments attachments={attachments} />
        )}
        {text && (
          <div style={{
            padding: "10px 14px",
            borderRadius: "var(--ap-radius-md) var(--ap-radius-md) 4px var(--ap-radius-md)",
            background: "var(--ap-signal)", color: "var(--ap-on-signal)",
            fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap",
          }}>{text}</div>
        )}
        {attachments && attachments.length > 0 && attachments.some(a => !!a.file_id) && (
          <AttachmentMemoryChip fileIds={attachments.map(a => a.file_id).filter(Boolean)} />
        )}
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

/**
 * Quick-reply chip rendering. Border-only by default, filled on press,
 * min 44px height, and a 2-column grid on narrow viewports when there
 * are 4+ options.
 */
function OptionChips({
  options, disabled, onPick,
}: {
  options: string[];
  disabled: boolean;
  onPick?: (t: string) => void;
}) {
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const useGrid = isNarrow && options.length >= 4;
  return (
    <div
      style={
        useGrid
          ? { marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }
          : { marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }
      }
    >
      {options.map((opt, idx) => (
        <button
          key={`${idx}-${opt}`}
          type="button"
          disabled={disabled || !onPick}
          onClick={() => onPick?.(opt)}
          className="ap-chip-press"
          style={{
            appearance: "none",
            cursor: disabled || !onPick ? "default" : "pointer",
            minHeight: 44,
            padding: "10px 14px",
            borderRadius: 999,
            border: "1px solid var(--ap-hairline)",
            background: "transparent",
            color: "var(--ap-ink-1)",
            fontSize: 12.5, fontWeight: 500, fontFamily: "var(--ap-font-sans)",
            textAlign: "center",
            lineHeight: 1.2,
            opacity: disabled ? 0.5 : 1,
            transition: "background 120ms ease, border-color 120ms ease",
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
