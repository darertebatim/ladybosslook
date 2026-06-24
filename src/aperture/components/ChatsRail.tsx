import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApertureMonoLabel } from "./primitives";
import { useApertureChatsDB } from "@/aperture/hooks/db/useApertureChatsDB";

/**
 * Persistent sidebar rail showing recent chats. Always visible inside
 * the RealAppShell sidebar (Claude-style), regardless of current route.
 */
export function ChatsRail({ onNavigate }: { onNavigate?: () => void }) {
  const { id: activeId } = useParams();
  const navigate = useNavigate();
  const { chats, createChat } = useApertureChatsDB();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(c => c.title.toLowerCase().includes(q));
  }, [chats, query]);
  const grouped = useMemo(() => groupChatsByDate(filtered), [filtered]);

  async function startNew() {
    const c = await createChat();
    if (c) {
      onNavigate?.();
      navigate(`/app/rilobiz/app/chats/${c.id}`);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <button onClick={startNew} style={{
        appearance: "none", cursor: "pointer",
        padding: "9px 12px", borderRadius: "var(--ap-radius-sm)",
        background: "var(--ap-signal)", color: "var(--ap-on-signal)",
        border: "none", fontFamily: "var(--ap-font-sans)", fontWeight: 500, fontSize: 13,
        textAlign: "left",
      }}>+ New chat</button>
      <div>
        <ApertureMonoLabel>Conversations</ApertureMonoLabel>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search chats…"
          style={{
            marginTop: 8, width: "100%", boxSizing: "border-box",
            appearance: "none", outline: "none",
            background: "var(--ap-surface-2)",
            border: "1px solid var(--ap-hairline)",
            borderRadius: "var(--ap-radius-xs)",
            padding: "7px 10px", fontSize: 12.5,
            color: "var(--ap-ink-1)", fontFamily: "var(--ap-font-sans)",
          }}
        />
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 12, maxHeight: "50vh", overflowY: "auto" }}>
          {grouped.length === 0 && (
            <span style={{ fontSize: 12, color: "var(--ap-ink-3)" }}>
              {chats.length === 0 ? "No chats yet." : "No matches."}
            </span>
          )}
          {grouped.map(group => (
            <div key={group.label}>
              <span style={{
                display: "block", fontFamily: "var(--ap-font-mono)",
                fontSize: 10, color: "var(--ap-ink-3)",
                textTransform: "uppercase", letterSpacing: "0.12em",
                marginBottom: 4,
              }}>{group.label}</span>
              {group.items.map(c => (
                <Link key={c.id} to={`/app/rilobiz/app/chats/${c.id}`}
                  onClick={onNavigate}
                  style={{
                    display: "block",
                    padding: "6px 10px", borderRadius: "var(--ap-radius-xs)",
                    fontSize: 13, textDecoration: "none",
                    background: c.id === activeId ? "var(--ap-surface-2)" : "transparent",
                    color: c.id === activeId ? "var(--ap-ink-1)" : "var(--ap-ink-2)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    fontWeight: c.id === activeId ? 600 : 400,
                  }}>{c.title}</Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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