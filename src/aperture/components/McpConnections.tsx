import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import {
  ApertureButton, ApertureCard, ApertureMonoLabel,
} from "@/aperture/components/primitives";

/**
 * MCP connections — lets the user mint API tokens that external AIs
 * (Claude.ai, ChatGPT, etc.) use to read/write their Aperture memory
 * over the Model Context Protocol. The actual MCP server lives in the
 * `aperture-mcp` edge function.
 *
 * MVP: tokens are stored raw (acceptable per the build plan). The token
 * value is shown exactly once at creation time and never displayed again.
 */

interface TokenRow {
  id: string;
  name: string;
  scopes: string[];
  last_used_at: string | null;
  revoked: boolean;
  created_at: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const MCP_ENDPOINT = `${SUPABASE_URL}/functions/v1/aperture-mcp`;

function newToken() {
  const rand =
    globalThis.crypto?.randomUUID?.().replace(/-/g, "") ??
    Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  return `apt_${rand}`;
}

function relTime(iso: string | null) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function McpConnections() {
  const { user } = useAuth();
  const [rows, setRows] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [writeScope, setWriteScope] = useState(false);
  const [creating, setCreating] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("aperture_mcp_tokens")
      .select("id, name, scopes, last_used_at, revoked, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error) setRows((data as TokenRow[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  async function create() {
    if (!user || !name.trim() || creating) return;
    setCreating(true);
    try {
      const token = newToken();
      const scopes = writeScope ? ["read", "write"] : ["read"];
      const { error } = await supabase.from("aperture_mcp_tokens").insert({
        user_id: user.id,
        token,
        name: name.trim(),
        scopes,
      });
      if (error) throw error;
      setRevealed(token);
      setName("");
      setWriteScope(false);
      await refresh();
    } catch (e: any) {
      toast({ title: "Couldn't create connection", description: e?.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this connection? The AI using this key will immediately lose access to your memory.")) return;
    const { error } = await supabase
      .from("aperture_mcp_tokens")
      .update({ revoked: true })
      .eq("id", id);
    if (error) {
      toast({ title: "Couldn't revoke", description: error.message, variant: "destructive" });
      return;
    }
    await refresh();
  }

  function close() {
    if (revealed && !confirm("Have you copied your key? You won't be able to see it again.")) return;
    setRevealed(null);
    setShowCreate(false);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "var(--ap-bg-1)",
    border: "1px solid var(--ap-hairline)", borderRadius: "var(--ap-radius-sm)",
    padding: "10px 12px", fontSize: 14, color: "var(--ap-ink-1)",
    fontFamily: "var(--ap-font-sans)", lineHeight: 1.5,
  };

  return (
    <ApertureCard padding={18}>
      <ApertureMonoLabel>Connect to AI tools</ApertureMonoLabel>
      <p style={{ margin: "8px 0 14px", fontSize: 13.5, color: "var(--ap-ink-2)", lineHeight: 1.55 }}>
        Connect Aperture's memory to Claude.ai or any MCP-compatible AI. Once connected, that AI will know your business before you say a word.
      </p>

      {!showCreate && !revealed && (
        <ApertureButton variant="accent" onClick={() => setShowCreate(true)}>
          + Create connection
        </ApertureButton>
      )}

      {showCreate && !revealed && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "var(--ap-ink-3)", marginBottom: 4, display: "block" }}>
              Name this connection
            </label>
            <input
              style={inputStyle}
              value={name}
              placeholder="e.g. Claude.ai, ChatGPT"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ap-ink-1)" }}>
            <input type="checkbox" checked={writeScope} onChange={(e) => setWriteScope(e.target.checked)} />
            Allow the AI to also write new facts to your memory
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <ApertureButton variant="accent" onClick={create} disabled={creating || !name.trim()}>
              {creating ? "Creating…" : "Continue"}
            </ApertureButton>
            <ApertureButton variant="ghost" onClick={close}>Cancel</ApertureButton>
          </div>
        </div>
      )}

      {revealed && (
        <div style={{ marginTop: 6, marginBottom: 14, padding: 14, border: "1px solid var(--ap-hairline)", borderRadius: "var(--ap-radius-sm)", background: "var(--ap-bg-1)" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--ap-ink-1)", fontWeight: 600 }}>
            Your connection is ready.
          </p>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--ap-ink-3)" }}>
            Copy this key and keep it safe — you won't see it again.
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
            <code style={{
              flex: 1, padding: "8px 10px", background: "var(--ap-bg-0)",
              border: "1px solid var(--ap-hairline)", borderRadius: 4,
              fontSize: 12, fontFamily: "var(--ap-font-mono)",
              overflow: "auto", whiteSpace: "nowrap",
            }}>{revealed}</code>
            <ApertureButton
              variant="accent"
              onClick={() => {
                navigator.clipboard?.writeText(revealed);
                toast({ title: "Copied" });
              }}
            >Copy</ApertureButton>
          </div>

          <p style={{ margin: "10px 0 6px", fontSize: 12, color: "var(--ap-ink-3)", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "var(--ap-font-mono)" }}>
            Where this key works
          </p>
          <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--ap-ink-2)", lineHeight: 1.55 }}>
            This key works with any AI that lets you set a custom HTTP header — <b>Claude Desktop</b>, <b>ChatGPT</b>, <b>Cursor</b>, <b>Raycast</b>, etc.
            It does <b>not</b> work in <b>Claude.ai on the web</b> (their custom connector form only supports full OAuth, not bearer keys).
          </p>

          <p style={{ margin: "10px 0 4px", fontSize: 12, color: "var(--ap-ink-3)", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "var(--ap-font-mono)" }}>
            Server URL
          </p>
          <code style={{
            display: "block", padding: "8px 10px", background: "var(--ap-bg-0)",
            border: "1px solid var(--ap-hairline)", borderRadius: 4,
            fontSize: 11.5, fontFamily: "var(--ap-font-mono)", color: "var(--ap-ink-1)",
            wordBreak: "break-all", marginBottom: 10,
          }}>{MCP_ENDPOINT}</code>

          <p style={{ margin: "10px 0 4px", fontSize: 12, color: "var(--ap-ink-3)", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "var(--ap-font-mono)" }}>
            Claude Desktop (recommended)
          </p>
          <ol style={{ margin: "0 0 10px", paddingInlineStart: 20, fontSize: 13, color: "var(--ap-ink-2)", lineHeight: 1.6 }}>
            <li>Open <b>Claude Desktop → Settings → Developer → Edit Config</b></li>
            <li>Add this block under <code style={{ fontFamily: "var(--ap-font-mono)", fontSize: 11.5 }}>mcpServers</code> and save:</li>
          </ol>
          <code style={{
            display: "block", whiteSpace: "pre", padding: "10px 12px", background: "var(--ap-bg-0)",
            border: "1px solid var(--ap-hairline)", borderRadius: 4,
            fontSize: 11.5, fontFamily: "var(--ap-font-mono)", color: "var(--ap-ink-1)",
            overflow: "auto", marginBottom: 10,
          }}>{`{
  "mcpServers": {
    "rilo": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "${MCP_ENDPOINT}",
        "--header", "Authorization:\${RILO_AUTH}"
      ],
      "env": { "RILO_AUTH": "Bearer ${revealed}" }
    }
  }
}`}</code>
          <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "var(--ap-ink-3)", lineHeight: 1.5 }}>
            Restart Claude Desktop. In a new chat you'll see "rilo" in the tool list — ask "What does my business do?"
          </p>

          <p style={{ margin: "10px 0 4px", fontSize: 12, color: "var(--ap-ink-3)", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "var(--ap-font-mono)" }}>
            ChatGPT / Cursor / Raycast
          </p>
          <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--ap-ink-2)", lineHeight: 1.55 }}>
            Add a custom MCP server with the URL above and this header:
          </p>
          <code style={{
            display: "block", padding: "8px 10px", background: "var(--ap-bg-0)",
            border: "1px solid var(--ap-hairline)", borderRadius: 4,
            fontSize: 11.5, fontFamily: "var(--ap-font-mono)", color: "var(--ap-ink-1)",
            wordBreak: "break-all", marginBottom: 12,
          }}>Authorization: Bearer {revealed}</code>
          <ApertureButton variant="ghost" onClick={close}>Done</ApertureButton>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p style={{ margin: "0 0 8px", fontSize: 11, color: "var(--ap-ink-3)", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "var(--ap-font-mono)" }}>
            My connections
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rows.map((r) => (
              <div key={r.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", border: "1px solid var(--ap-hairline)",
                borderRadius: "var(--ap-radius-sm)", background: r.revoked ? "transparent" : "var(--ap-bg-1)",
                opacity: r.revoked ? 0.55 : 1,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, color: "var(--ap-ink-1)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ap-ink-3)", marginTop: 2 }}>
                    {r.scopes.includes("write") ? "Read + Write" : "Read only"} · Last used: {relTime(r.last_used_at)}
                    {r.revoked ? " · Revoked" : ""}
                  </div>
                </div>
                {!r.revoked && (
                  <ApertureButton variant="ghost" onClick={() => revoke(r.id)}>Revoke</ApertureButton>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </ApertureCard>
  );
}