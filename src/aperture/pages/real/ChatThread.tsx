import { Helmet } from "react-helmet-async";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { RealAppShell } from "@/aperture/components/RealAppShell";
import { ApertureChip, ApertureMonoLabel } from "@/aperture/components/primitives";
import { useApertureChatsDB, useApertureChatMessages, type MessageRow } from "@/aperture/hooks/db/useApertureChatsDB";
import { useApertureMemoryDB } from "@/aperture/hooks/db/useApertureMemoryDB";
import { streamApertureChat, nameApertureChat } from "@/aperture/lib/apertureChat";
import { useApertureHomeSuggestions } from "@/aperture/hooks/db/useApertureHomeSuggestions";
import { useAuth } from "@/hooks/useAuth";
import { ChatComposer } from "@/aperture/components/chat/ChatComposer";
import { ChatAttachments, AttachmentMemoryChip } from "@/aperture/components/chat/ChatAttachments";
import { AperturePrompt } from "@/aperture/components/chat/AperturePrompt";
import type { SentAttachment } from "@/aperture/lib/chatAttachments";
import { ArrowDown } from "lucide-react";

export default function RealChatThread() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const { chats, createChat, refresh: refreshChats } = useApertureChatsDB();
  const { messages, setMessages, refresh } = useApertureChatMessages(id);
  const { items } = useApertureMemoryDB();
  const { suggestions: homeSuggestions } = useApertureHomeSuggestions(items.length);

  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<{ text: string; attachments?: SentAttachment[] } | null>(null);
  const [stickToBottom, setStickToBottom] = useState(true);
  const [sidebarQuery, setSidebarQuery] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const seedHandledRef = useRef<string | null>(null);
  const namedRef = useRef<string | null>(null);
  const initialScrollRef = useRef<string | null>(null);

  const chat = chats.find(c => c.id === id);

  // On thread switch, jump to bottom immediately (no smooth scroll).
  useEffect(() => {
    if (!id) return;
    if (initialScrollRef.current === id) return;
    if (messages.length === 0) return;
    initialScrollRef.current = id;
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
    setStickToBottom(true);
  }, [id, messages.length]);

  // Follow new content only when the user is parked at the bottom.
  useEffect(() => {
    if (!stickToBottom) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: streaming ? "auto" : "smooth" });
  }, [messages.length, streamingText, streaming, stickToBottom]);

  function onScrollList() {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setStickToBottom(nearBottom);
  }

  function scrollToBottom() {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    setStickToBottom(true);
  }

  async function send(
    text: string,
    escape?: { kind: "skip" | "unknown"; question: string },
    attachments?: SentAttachment[],
  ) {
    const t = text.trim();
    if (!id || streaming) return;
    if (!escape && !t && !(attachments && attachments.length > 0)) return;
    setError(null);
    if (!escape) setLastSent({ text: t, attachments });
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
    setStickToBottom(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const history = nextHistory.map(m => ({ role: m.role, content: m.content }));
      await streamApertureChat({
        chatId: id, messages: history,
        onDelta: chunk => setStreamingText(prev => prev + chunk),
        escape: escape ? { kind: escape.kind, question: escape.question, bucket: null } : undefined,
        attachments: attachments ?? [],
        signal: ctrl.signal,
      });
      // Pull authoritative copy from DB (server persisted both messages)
      await refresh();
      // Auto-name the chat once after the first real exchange.
      if (!escape && namedRef.current !== id) {
        const userTurns = nextHistory.filter(m => m.role === "user").length;
        if (userTurns >= 1) {
          namedRef.current = id;
          void nameApertureChat(id).then(r => {
            if (r?.title) void refreshChats();
          });
        }
      }
    } catch (err: any) {
      // Aborted by user — keep their message visible, drop the partial stream.
      if (err?.name === "AbortError") {
        // no-op: cleared in finally
      } else {
        setError(err?.message ?? "Something went wrong. Try again.");
      }
    } finally {
      setStreaming(false);
      setStreamingText("");
      abortRef.current = null;
    }
  }

  function stopStreaming() {
    abortRef.current?.abort();
  }

  async function retryLast() {
    if (!lastSent) return;
    // Remove the trailing failed user message so we don't double it.
    setMessages(prev => {
      const idx = [...prev].reverse().findIndex(m => m.role === "user");
      if (idx === -1) return prev;
      const realIdx = prev.length - 1 - idx;
      return [...prev.slice(0, realIdx)];
    });
    await send(lastSent.text, undefined, lastSent.attachments);
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

  const filteredChats = useMemo(() => {
    const q = sidebarQuery.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(c => c.title.toLowerCase().includes(q));
  }, [chats, sidebarQuery]);
  const groupedChats = useMemo(() => groupChatsByDate(filteredChats), [filteredChats]);

  if (!id) return <Navigate to="/aperture/app/chats" replace />;

  const hasAnyMessage = messages.length > 0;
  const visibleSuggestions = homeSuggestions.slice(0, 4);

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
              <ApertureMonoLabel>Conversations</ApertureMonoLabel>
              <input
                value={sidebarQuery}
                onChange={e => setSidebarQuery(e.target.value)}
                placeholder="Search chats…"
                style={{
                  marginTop: 8, width: "100%", boxSizing: "border-box",
                  appearance: "none", outline: "none",
                  background: "var(--ap-surface-2)",
                  border: "1px solid var(--ap-hairline)",
                  borderRadius: "var(--ap-radius-xs)",
                  padding: "8px 10px", fontSize: 12.5,
                  color: "var(--ap-ink-1)", fontFamily: "var(--ap-font-sans)",
                }}
              />
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 14, maxHeight: "55vh", overflowY: "auto" }}>
                {filteredChats.length === 0 && (
                  <span style={{ fontSize: 12, color: "var(--ap-ink-3)" }}>No conversations found.</span>
                )}
                {groupedChats.map(group => (
                  <div key={group.label}>
                    <span style={{
                      display: "block", fontFamily: "var(--ap-font-mono)",
                      fontSize: 10, color: "var(--ap-ink-3)",
                      textTransform: "uppercase", letterSpacing: "0.12em",
                      marginBottom: 4,
                    }}>{group.label}</span>
                    {group.items.map(c => (
                      <Link key={c.id} to={`/aperture/app/chats/${c.id}`} style={{
                        display: "block",
                        padding: "7px 10px", borderRadius: "var(--ap-radius-xs)",
                        fontSize: 13, textDecoration: "none",
                        background: c.id === id ? "var(--ap-surface-2)" : "transparent",
                        color: c.id === id ? "var(--ap-ink-1)" : "var(--ap-ink-2)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        fontWeight: c.id === id ? 600 : 400,
                      }}>{c.title}</Link>
                    ))}
                  </div>
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
        <div style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 180px)", minHeight: 360, maxWidth: "100%", overflowX: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ minWidth: 0 }}>
              <ApertureMonoLabel>CONVERSATION</ApertureMonoLabel>
              <h1 style={{ margin: "6px 0 0", fontSize: 20, fontWeight: 600, color: "var(--ap-ink-1)", letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {chat?.title ?? "Chat"}
              </h1>
            </div>
            <Link to="/aperture/app/memory" style={{ textDecoration: "none" }}>
              <ApertureChip tone={items.length > 0 ? "signal" : "neutral"}>
                Memory · {items.length}
              </ApertureChip>
            </Link>
          </div>

          <div ref={scrollRef} onScroll={onScrollList} style={{ position: "relative", flex: 1, overflowY: "auto", overflowX: "hidden", paddingRight: 4, display: "flex", flexDirection: "column", gap: 18 }}>
            {!hasAnyMessage && !streaming && (
              <EmptyChat
                suggestions={visibleSuggestions}
                onPick={prompt => send(prompt)}
              />
            )}
            {messages.map((m, i) => {
              const prev = messages[i - 1];
              const showAILabel = (m.role === "assistant" || m.role === "system") &&
                (!prev || prev.role === "user");
              return (
                <MessageBubble
                  key={m.id}
                  role={m.role}
                  text={m.content}
                  showAILabel={showAILabel}
                  onPickOption={(t) => send(t)}
                  disabled={streaming}
                  attachments={m.attachments}
                />
              );
            })}
            {streaming && streamingText && (
              <MessageBubble
                role="assistant"
                text={streamingText}
                showAILabel={messages.length === 0 || messages[messages.length - 1]?.role === "user"}
                disabled
                streaming
              />
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
            {error && (
              <div style={{
                alignSelf: "flex-start",
                maxWidth: "82%",
                padding: "10px 14px",
                borderRadius: "var(--ap-radius-md)",
                background: "var(--ap-surface-1)",
                border: "1px solid var(--ap-warning, #c44)",
                color: "var(--ap-ink-1)",
                display: "flex", flexDirection: "column", gap: 8,
              }}>
                <span style={{ fontSize: 13 }}>Something went wrong. {error}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={retryLast}
                    style={{
                      appearance: "none", cursor: "pointer", border: "none",
                      background: "var(--ap-signal)", color: "var(--ap-on-signal)",
                      borderRadius: 999, padding: "6px 12px",
                      fontSize: 12, fontWeight: 600,
                    }}
                  >Retry</button>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    style={{
                      appearance: "none", cursor: "pointer", border: "none",
                      background: "transparent", color: "var(--ap-ink-3)",
                      fontSize: 12,
                    }}
                  >Dismiss</button>
                </div>
              </div>
            )}
          </div>

          {!stickToBottom && hasAnyMessage && (
            <button
              type="button"
              onClick={scrollToBottom}
              aria-label="Scroll to bottom"
              style={{
                position: "absolute", right: 28, bottom: 110, zIndex: 5,
                appearance: "none", cursor: "pointer",
                width: 36, height: 36, borderRadius: 999,
                background: "var(--ap-surface-1)",
                border: "1px solid var(--ap-hairline)",
                color: "var(--ap-ink-1)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                boxShadow: "var(--ap-shadow-raised)",
              }}
            ><ArrowDown size={16} /></button>
          )}

          {id && user && (
            <div style={{
              position: "sticky", bottom: 0,
              background: "var(--ap-canvas)",
              paddingTop: 8,
              paddingBottom: "max(8px, env(safe-area-inset-bottom))",
            }}>
              <ChatComposer
                chatId={id}
                userId={user.id}
                disabled={streaming}
                streaming={streaming}
                onStop={stopStreaming}
                onSend={(text, atts) => send(text, undefined, atts)}
              />
            </div>
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

function MessageBubble({ role, text, onPickOption, disabled, attachments, showAILabel = true, streaming = false }: {
  role: string;
  text: string;
  onPickOption?: (t: string) => void;
  disabled?: boolean;
  attachments?: Array<{ file_id: string; storage_path: string; mime: string; name: string; size: number }>;
  showAILabel?: boolean;
  streaming?: boolean;
}) {
  if (role === "assistant" || role === "system") {
    const { body, options } = splitAssistantOptions(text);
    // Chips/options only appear after streaming completes — never mid-stream.
    const showOptions = !streaming && options.length > 0;
    return (
      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <div style={{ maxWidth: "82%", minWidth: 0 }}>
          {showAILabel && (
            <ApertureMonoLabel style={{ display: "block", marginBottom: 6 }}>Aperture</ApertureMonoLabel>
          )}
          <div style={{ position: "relative" }}>
            <AperturePrompt text={body} />
            {streaming && (
              <span className="ap-cursor" aria-hidden style={{
                display: "inline-block", width: 8, height: 14,
                marginLeft: 2, verticalAlign: "text-bottom",
                background: "var(--ap-signal)", borderRadius: 1,
              }} />
            )}
          </div>
          {showOptions && (
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

function EmptyChat({
  suggestions,
  onPick,
}: {
  suggestions: Array<{ title: string; prompt: string; why?: string }>;
  onPick: (prompt: string) => void;
}) {
  return (
    <div style={{ paddingTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <ApertureMonoLabel>New conversation</ApertureMonoLabel>
        <h2 style={{ margin: "8px 0 0", fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--ap-ink-1)" }}>
          What do you want to work on today?
        </h2>
      </div>
      {suggestions.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 10,
        }}>
          {suggestions.map((s, i) => (
            <button
              key={`${i}-${s.title}`}
              type="button"
              onClick={() => onPick(s.prompt)}
              style={{
                textAlign: "left", appearance: "none", cursor: "pointer",
                padding: 14, background: "var(--ap-surface-1)",
                border: "1px solid var(--ap-hairline)",
                borderRadius: "var(--ap-radius-md)",
                display: "flex", flexDirection: "column", gap: 6,
                color: "var(--ap-ink-1)", fontFamily: "var(--ap-font-sans)",
              }}
            >
              <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.35 }}>{s.title}</span>
              {s.why && <span style={{ fontSize: 12, color: "var(--ap-ink-3)", lineHeight: 1.5 }}>{s.why}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Groups chats into Today / Yesterday / Previous 7 days / 30 days / Older. */
function groupChatsByDate<T extends { last_message_at: string }>(chats: T[]): Array<{ label: string; items: T[] }> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86_400_000;
  const sevenDaysAgo = today - 7 * 86_400_000;
  const thirtyDaysAgo = today - 30 * 86_400_000;
  const groups: Record<string, T[]> = {
    "Today": [], "Yesterday": [], "Previous 7 days": [], "Previous 30 days": [], "Older": [],
  };
  for (const c of chats) {
    const t = new Date(c.last_message_at).getTime();
    if (t >= today) groups["Today"].push(c);
    else if (t >= yesterday) groups["Yesterday"].push(c);
    else if (t >= sevenDaysAgo) groups["Previous 7 days"].push(c);
    else if (t >= thirtyDaysAgo) groups["Previous 30 days"].push(c);
    else groups["Older"].push(c);
  }
  return Object.entries(groups)
    .filter(([, list]) => list.length > 0)
    .map(([label, items]) => ({ label, items }));
}
