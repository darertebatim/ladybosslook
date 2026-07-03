import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, RefreshCw, MessageSquare, ExternalLink, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { ApertureButton, ApertureCard, ApertureChip, ApertureMonoLabel } from "./primitives";
import { useApertureSources, type SourceSummary } from "@/aperture/hooks/db/useApertureSources";

const BUCKET_LABELS: Record<string, string> = {
  basics: "Basics",
  story: "Story",
  customers: "Customers",
  products: "Products & Services",
  sales: "Sales",
  marketing: "Marketing & Visibility",
  money: "Money",
  vision: "Vision",
  tools: "Tools",
  team: "Team",
  operations: "Operations",
  partners: "Partners",
  competitors: "Competitors",
  "content-media": "Content & Media",
};
function prettyBucket(slug: string): string {
  return BUCKET_LABELS[slug] ?? slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

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

  const pages = useMemo(() => {
    const raw = (summary?.snapshot?.meta as any)?.pages;
    return Array.isArray(raw) ? raw as Array<{ url: string; page_type: string; len: number; text?: string }> : [];
  }, [summary]);

  const stale = useMemo(() => {
    const iso = summary?.snapshot?.fetched_at;
    if (!iso) return false;
    return Date.now() - new Date(iso).getTime() > 7 * 24 * 60 * 60 * 1000;
  }, [summary]);

  const [openPages, setOpenPages] = useState<Record<number, boolean>>({});

  // Group facts by bucket so users see structure ("Products (3), Basics (2)…")
  // instead of a flat list. Sort by count desc.
  const factsByBucket = useMemo(() => {
    const map = new Map<string, typeof facts>();
    for (const f of facts) {
      const k = f.bucket_slug ?? "other";
      const arr = map.get(k) ?? [];
      arr.push(f);
      map.set(k, arr);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [facts]);

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
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <ApertureChip tone={summary.fetchStatus === "ok" ? "signal" : "neutral"}>
              {summary.fetchStatus === "ok"
                ? "Synced"
                : summary.fetchStatus === "failed"
                  ? "Couldn't read this site"
                  : "Not fetched yet"}
            </ApertureChip>
            <ApertureChip tone="neutral">{facts.length} facts</ApertureChip>
            {summary.snapshot?.fetched_at && (
              <span style={{ fontSize: 11, color: stale ? "var(--ap-signal)" : "var(--ap-ink-3)" }}>
                Last checked {new Date(summary.snapshot.fetched_at).toLocaleString()}
                {stale && " — refresh?"}
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
                  {summary.fetchStatus === "failed"
                    ? `I couldn't read this ${summary.kind} — the site may be blocking scrapers or hiding content behind login. Try answering in chat instead.`
                    : `Nothing extracted yet. Tap "Refetch" below and I'll pull what I can from this ${summary.kind}.`}
                </p>
              </ApertureCard>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {factsByBucket.map(([bucket, list]) => (
                  <div key={bucket}>
                    <div style={{ marginBottom: 6 }}>
                      <ApertureMonoLabel>
                        {prettyBucket(bucket)} ({list.length})
                      </ApertureMonoLabel>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {list.map(f => (
                        <div key={f.id} style={{
                          padding: "10px 12px",
                          borderRadius: "var(--ap-radius-sm)",
                          background: "var(--ap-surface-2)",
                          border: "1px solid var(--ap-hairline)",
                          fontSize: 13.5, color: "var(--ap-ink-1)", lineHeight: 1.5,
                        }}>
                          {f.content}
                        </div>
                      ))}
                    </div>
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
            <div style={{ marginBottom: 8 }}>
              <ApertureMonoLabel>
                Raw snapshot{pages.length > 0 ? ` · ${pages.length} page${pages.length === 1 ? "" : "s"}` : ""}
              </ApertureMonoLabel>
            </div>
            {pages.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {pages.map((p, i) => {
                  const isOpen = !!openPages[i];
                  return (
                    <div key={`${p.url}-${i}`}>
                      <button
                        onClick={() => setOpenPages(m => ({ ...m, [i]: !isOpen }))}
                        style={{
                          appearance: "none", cursor: "pointer", background: "transparent",
                          border: "1px solid var(--ap-hairline)",
                          borderRadius: "var(--ap-radius-sm)",
                          padding: "10px 12px", width: "100%",
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          color: "var(--ap-ink-1)", fontSize: 13, fontWeight: 500,
                          gap: 8,
                        }}
                      >
                        <span style={{
                          display: "flex", alignItems: "center", gap: 8, minWidth: 0,
                        }}>
                          <ApertureChip tone="neutral">{p.page_type}</ApertureChip>
                          <span style={{
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            color: "var(--ap-ink-3)", fontSize: 12, fontWeight: 400,
                          }}>
                            {p.url}
                          </span>
                        </span>
                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      {isOpen && (
                        <pre style={{
                          marginTop: 6, padding: 12,
                          background: "var(--ap-surface-2)",
                          border: "1px solid var(--ap-hairline)",
                          borderRadius: "var(--ap-radius-sm)",
                          fontSize: 11.5, color: "var(--ap-ink-2)",
                          fontFamily: "var(--ap-font-mono, ui-monospace, monospace)",
                          whiteSpace: "pre-wrap", wordBreak: "break-word",
                          maxHeight: 320, overflow: "auto",
                        }}>
                          {p.text?.slice(0, 6000) || "(no text captured for this page)"}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
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
                  <span>Snapshot</span>
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
              </>
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