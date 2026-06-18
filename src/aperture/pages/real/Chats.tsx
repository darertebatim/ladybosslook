import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { RealAppShell } from "@/aperture/components/RealAppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureButton, ApertureCard, ApertureMonoLabel, ApertureLoading,
} from "@/aperture/components/primitives";
import { useApertureChatsDB } from "@/aperture/hooks/db/useApertureChatsDB";

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
  const { chats, loading, createChat, deleteChat } = useApertureChatsDB();
  const [busy, setBusy] = useState(false);

  async function startNew() {
    if (busy) return;
    setBusy(true);
    const c = await createChat();
    setBusy(false);
    if (c) navigate(`/aperture/app/chats/${c.id}`);
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
        ) : (
          <div style={{ display: "flex", flexDirection: "column", border: "1px solid var(--ap-hairline)", borderRadius: "var(--ap-radius-md)", overflow: "hidden", background: "var(--ap-surface-1)" }}>
            {chats.map((c, i) => (
              <div key={c.id} style={{
                display: "grid", gridTemplateColumns: "1fr auto auto", gap: 14, alignItems: "center",
                padding: "14px 16px",
                borderTop: i === 0 ? "none" : "1px solid var(--ap-hairline)",
              }}>
                <Link to={`/aperture/app/chats/${c.id}`} style={{ textDecoration: "none", minWidth: 0 }}>
                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <span style={{ fontSize: 14, color: "var(--ap-ink-1)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
                    <span style={{ fontSize: 12, color: "var(--ap-ink-3)" }}>{relative(c.last_message_at)}</span>
                  </div>
                </Link>
                <ApertureMonoLabel>{new Date(c.created_at).toLocaleDateString()}</ApertureMonoLabel>
                <button
                  onClick={() => { if (confirm(`Delete "${c.title}"?`)) deleteChat(c.id); }}
                  aria-label="Delete conversation"
                  style={{ appearance: "none", border: "none", background: "transparent", cursor: "pointer", color: "var(--ap-ink-3)", padding: 6, borderRadius: 6 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </RealAppShell>
    </>
  );
}