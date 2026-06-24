import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, RefreshCw, MessageSquare, ExternalLink, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { ApertureButton, ApertureCard, ApertureChip, ApertureMonoLabel } from "./primitives";
import { useApertureSources, type SourceSummary } from "@/aperture/hooks/db/useApertureSources";

export function SourceDetailSheet({
  summary, open, onClose,
}: {
  summary: SourceSummary | null;
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { factsFor, refetch, busy, startChatAboutSource } = useApertureSources();
  const [prompt, setPrompt] = useState("");
  const [snapOpen, setSnapOpen] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (open) { setPrompt(""); setSnapOpen(false); }
  }, [open, summary?.kind]);

  const facts = useMemo(() => summary ? factsFor(summary.kind) : [], [summary, factsFor]);

  if (!open || !summary) return null;

  const busyHere = busy === summary.kind || working;

  async function handleRefetch(withPrompt?: string) {
    if (!summary) return;
    setWorking(true);
    try {
      await refetch(summary.kind, summary.url, withPrompt);
      if (withPrompt) setPrompt("");
    } finally {
      setWorking(false);
    }
  }

  async function handleAskChat() {
    if (!summary) return;
    const chatId = await startChatAboutSource(summary);
    if (chatId) {
      onClose();
      navigate(`/app/rilobiz/app/chats/${chatId}`);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 10050,
        background: "rgba(0,0,0,0.45)",
        display: "flex", justifyContent: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(560px, 100%)",
          height: "100%",
          background: "var(--ap-surface-1)",
          borderLeft: "1px solid var(--ap-hairline)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "16px 18px",
          borderBottom: "1px solid var(--ap-hairline)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ minWidth: 0 }}>
            <ApertureMonoLabel>{summary.kind} source</ApertureMonoLabel>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "var(--ap-ink-1)" }}>
                {summary.display}
              </h3>
              <a
                href={summary.url} target="_blank" rel="noreferrer"
                style={{ color: "var(--ap-ink-3)", display: "inline-flex" }}
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              appearance: "none", cursor: "pointer", background: "transparent",
              border: "1px solid var(--ap-hairline)", borderRadius: 8,
              width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--ap-ink-2)",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Status row */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <ApertureChip tone={summary.snapshot ? "signal" : "neutral"}>
              {summary.snapshot ? "Synced" : "Not fetched yet"}
            </ApertureChip>
            <ApertureChip tone="neutral">{facts.length} facts</ApertureChip>
            {summary.snapshot?.fetched_at && (
              <span style={{ fontSize: 11, color: "var(--ap-ink-3)" }}>
                Last fetched {new Date(summary.snapshot.fetched_at).toLocaleString()}
              </span>
            )}
          </div>

          {/* What we know */}
          <section>
            <div style={{ marginBottom: 8 }}>
              <ApertureMonoLabel>What I know</ApertureMonoLabel>
            </div>
            {facts.length === 0 ? (
              <ApertureCard padding={14}>
                <p style={{ margin: 0, fontSize: 13, color: "var(--ap-ink-3)" }}>
                  Nothing extracted yet. Tap "Refetch" below and I'll pull what I can from this {summary.kind}.
                </p>
              </ApertureCard>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {facts.map(f => (
                  <div key={f.id} style={{
                    padding: "10px 12px",
                    borderRadius: "var(--ap-radius-sm)",
                    background: "var(--ap-surface-2)",
                    border: "1px solid var(--ap-hairline)",
                    fontSize: 13.5, color: "var(--ap-ink-1)", lineHeight: 1.5,
                  }}>
                    {f.content}
                    {f.bucket_slug && (
                      <div style={{ marginTop: 4 }}>
                        <ApertureMonoLabel size={9}>{f.bucket_slug}</ApertureMonoLabel>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Prompt for more */}
          <section>
            <div style={{ marginBottom: 8 }}>
              <ApertureMonoLabel>Pull more specific info</ApertureMonoLabel>
            </div>
            <ApertureCard padding={12}>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                placeholder={summary.kind === "website"
                  ? "e.g. 'Find pricing, packages, and testimonials'"
                  : "e.g. 'Pull bio, recent post themes, and follower count'"}
                style={{
                  width: "100%", appearance: "none", outline: "none",
                  background: "transparent", border: "none",
                  fontSize: 13.5, color: "var(--ap-ink-1)",
                  fontFamily: "var(--ap-font-sans)", lineHeight: 1.5,
                  resize: "vertical",
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                <ApertureButton
                  variant="accent" size="sm"
                  disabled={busyHere || !prompt.trim()}
                  onClick={() => handleRefetch(prompt.trim())}
                >
                  <Sparkles size={12} /> {busyHere ? "Working…" : "Fetch with this focus"}
                </ApertureButton>
              </div>
            </ApertureCard>
          </section>

          {/* Raw snapshot accordion */}
          <section>
            <button
              onClick={() => setSnapOpen(s => !s)}
              style={{
                appearance: "none", cursor: "pointer", background: "transparent",
                border: "1px solid var(--ap-hairline)",
                borderRadius: "var(--ap-radius-sm)",
                padding: "10px 12px", width: "100%",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                color: "var(--ap-ink-1)", fontSize: 13, fontWeight: 500,
              }}
            >
              <span>Raw snapshot</span>
              {snapOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {snapOpen && (
              <pre style={{
                marginTop: 8, padding: 12,
                background: "var(--ap-surface-2)",
                border: "1px solid var(--ap-hairline)",
                borderRadius: "var(--ap-radius-sm)",
                fontSize: 11.5, color: "var(--ap-ink-2)",
                fontFamily: "var(--ap-font-mono, ui-monospace, monospace)",
                whiteSpace: "pre-wrap", wordBreak: "break-word",
                maxHeight: 320, overflow: "auto", margin: 0,
              }}>
                {summary.snapshot?.raw_text?.slice(0, 6000) || "(no snapshot stored)"}
              </pre>
            )}
          </section>
        </div>

        {/* Footer */}
        <div style={{
          padding: 14,
          borderTop: "1px solid var(--ap-hairline)",
          display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center",
          background: "var(--ap-surface-1)",
        }}>
          <ApertureButton variant="ghost" size="sm" onClick={() => handleRefetch()} disabled={busyHere}>
            <RefreshCw size={13} /> {busyHere ? "Refetching…" : "Refetch"}
          </ApertureButton>
          <ApertureButton variant="accent" size="sm" onClick={handleAskChat}>
            <MessageSquare size={13} /> Ask RiloBiz about this
          </ApertureButton>
        </div>
      </div>
    </div>
  );
}