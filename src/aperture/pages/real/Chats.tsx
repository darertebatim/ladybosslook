import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { RealAppShell } from "@/aperture/components/RealAppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureButton, ApertureCard, ApertureMonoLabel, ApertureLoading,
} from "@/aperture/components/primitives";
import { useApertureChatsDB } from "@/aperture/hooks/db/useApertureChatsDB";
import { Pencil, Check, X } from "lucide-react";

function relative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function RealChats() {
  const navigate = useNavigate();
  const { chats, loading, createChat, renameChat, deleteChat } = useApertureChatsDB();
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  async function startNew() {
    if (busy) return;
    setBusy(true);
    const c = await createChat();
    setBusy(false);
    if (c) navigate(`/app/rilobiz/app/chats/${c.id}`);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(c => c.title.toLowerCase().includes(q));
  }, [chats, query]);
  const grouped = useMemo(() => groupChats(filtered), [filtered]);

  async function saveRename(id: string) {
    const t = editingTitle.trim();
    if (t) await renameChat(id, t);
    setEditingId(null);
    setEditingTitle("");
  }

  return (
    <>
      <Helmet><title>Chats · Aperture</title></Helmet>
      <RealAppShell>
        <PageHeader
          index="CHATS"
          title="Your conversations"
          sub="Every chat already knows your business. No re-explaining."
          action={<ApertureButton variant="accent" onClick={startNew} disabled={busy}>{busy ? "…" : "+ New chat"}</ApertureButton>}
        />

        {chats.length > 0 && (
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search conversations…"
            style={{
              width: "100%", boxSizing: "border-box",
              appearance: "none", outline: "none",
              background: "var(--ap-surface-2)",
              border: "1px solid var(--ap-hairline)",
              borderRadius: "var(--ap-radius-sm)",
              padding: "10px 12px", fontSize: 14, marginBottom: 16,
              color: "var(--ap-ink-1)", fontFamily: "var(--ap-font-sans)",
            }}
          />
        )}

        {loading ? (
          <ApertureLoading label="Loading chats…" />
        ) : chats.length === 0 ? (
          <ApertureCard padding={32} style={{ textAlign: "center" }}>
            <ApertureMonoLabel>No conversations yet</ApertureMonoLabel>
            <h3 style={{ margin: "12px 0 6px", fontSize: 18, color: "var(--ap-ink-1)", fontWeight: 600 }}>Start with what's on your mind</h3>
            <p style={{ margin: "0 auto 18px", fontSize: 13.5, color: "var(--ap-ink-2)", maxWidth: 440, lineHeight: 1.55 }}>
              Just start typing — like you would with a friend who happens to know your business.
            </p>
            <ApertureButton variant="accent" onClick={startNew} disabled={busy}>Open a new chat</ApertureButton>
          </ApertureCard>
        ) : filtered.length === 0 ? (
          <ApertureCard padding={24} style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--ap-ink-3)" }}>No conversations found.</p>
          </ApertureCard>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {grouped.map(group => (
              <div key={group.label}>
                <ApertureMonoLabel style={{ marginBottom: 8, display: "block" }}>{group.label}</ApertureMonoLabel>
                <div style={{ display: "flex", flexDirection: "column", border: "1px solid var(--ap-hairline)", borderRadius: "var(--ap-radius-md)", overflow: "hidden", background: "var(--ap-surface-1)" }}>
                  {group.items.map((c, i) => (
                    <div key={c.id} style={{
                      display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 8, alignItems: "center",
                      padding: "14px 16px",
                      borderTop: i === 0 ? "none" : "1px solid var(--ap-hairline)",
                    }}>
                      {editingId === c.id ? (
                        <input
                          autoFocus
                          value={editingTitle}
                          onChange={e => setEditingTitle(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") saveRename(c.id);
                            if (e.key === "Escape") { setEditingId(null); setEditingTitle(""); }
                          }}
                          style={{
                            appearance: "none", outline: "none",
                            background: "var(--ap-surface-2)", color: "var(--ap-ink-1)",
                            border: "1px solid var(--ap-signal)", borderRadius: 8,
                            padding: "8px 10px", fontSize: 14, fontFamily: "var(--ap-font-sans)",
                            minWidth: 0,
                          }}
                        />
                      ) : (
                        <Link to={`/app/rilobiz/app/chats/${c.id}`} style={{ textDecoration: "none", minWidth: 0 }}>
                          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                            <span style={{ fontSize: 14, color: "var(--ap-ink-1)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
                            <span style={{ fontSize: 12, color: "var(--ap-ink-3)" }}>{relative(c.last_message_at)}</span>
                          </div>
                        </Link>
                      )}
                      <ApertureMonoLabel>{new Date(c.created_at).toLocaleDateString()}</ApertureMonoLabel>
                      {editingId === c.id ? (
                        <>
                          <button onClick={() => saveRename(c.id)} aria-label="Save title" style={iconBtnStyle}><Check size={14} /></button>
                          <button onClick={() => { setEditingId(null); setEditingTitle(""); }} aria-label="Cancel rename" style={iconBtnStyle}><X size={14} /></button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { setEditingId(c.id); setEditingTitle(c.title); }}
                            aria-label="Rename conversation"
                            style={iconBtnStyle}
                          ><Pencil size={13} /></button>
                          <button
                            onClick={() => { if (confirm(`Delete "${c.title}"?`)) deleteChat(c.id); }}
                            aria-label="Delete conversation"
                            style={iconBtnStyle}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></svg>
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </RealAppShell>
    </>
  );
}

const iconBtnStyle = {
  appearance: "none" as const, border: "none", background: "transparent",
  cursor: "pointer", color: "var(--ap-ink-3)", padding: 6, borderRadius: 6,
  display: "inline-flex", alignItems: "center", justifyContent: "center",
};

function groupChats<T extends { last_message_at: string }>(chats: T[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86_400_000;
  const week = today - 7 * 86_400_000;
  const month = today - 30 * 86_400_000;
  const buckets: Record<string, T[]> = {
    "Today": [], "Yesterday": [], "Previous 7 days": [], "Previous 30 days": [], "Older": [],
  };
  for (const c of chats) {
    const t = new Date(c.last_message_at).getTime();
    if (t >= today) buckets["Today"].push(c);
    else if (t >= yesterday) buckets["Yesterday"].push(c);
    else if (t >= week) buckets["Previous 7 days"].push(c);
    else if (t >= month) buckets["Previous 30 days"].push(c);
    else buckets["Older"].push(c);
  }
  return Object.entries(buckets).filter(([, list]) => list.length > 0).map(([label, items]) => ({ label, items }));
}