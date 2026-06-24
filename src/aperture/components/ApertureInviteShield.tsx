import { useState, FormEvent } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ApertureButton, ApertureMonoLabel } from "./primitives";
import { ApertureLogo } from "@/aperture/brand/ApertureLogo";

type Mode = "code" | "request";

export function ApertureInviteShield({ onApproved }: { onApproved: () => void }) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("code");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--ap-surface-2)",
    border: "1px solid var(--ap-hairline)",
    borderRadius: "var(--ap-radius-sm)",
    padding: "12px 14px",
    color: "var(--ap-ink-1)",
    fontFamily: "var(--ap-font-sans)",
    fontSize: 15,
    outline: "none",
  };

  const redeem = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    try {
      const { data, error } = await (supabase as any).rpc("redeem_aperture_invite", { p_code: code.trim() });
      if (error) throw error;
      const res = data as { ok: boolean; error?: string };
      if (!res?.ok) {
        const msg =
          res?.error === "invalid_code" ? "Invite code not found" :
          res?.error === "already_used" ? "This code has already been used" :
          res?.error === "revoked" ? "This code is no longer valid" :
          "Could not redeem code";
        toast({ variant: "destructive", title: "Invalid", description: msg });
        return;
      }
      toast({ title: "Welcome to RiloBiz" });
      onApproved();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err?.message ?? "Try again" });
    } finally {
      setBusy(false);
    }
  };

  const request = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      const { error } = await (supabase as any).from("aperture_access_requests").insert({
        user_id: user?.id ?? null,
        email: email.trim(),
        note: note.trim() || null,
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err?.message ?? "Try again" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
        background: "var(--ap-canvas)",
      }}
    >
      <Helmet>
        <title>RiloBiz — Invitation only</title>
      </Helmet>

      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <ApertureLogo size={44} />
          <ApertureMonoLabel size={10}>Invitation only</ApertureMonoLabel>
          <h1 style={{
            margin: 0, textAlign: "center", color: "var(--ap-ink-1)",
            fontFamily: "var(--ap-font-sans)", fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em",
          }}>
            RiloBiz is in private preview
          </h1>
          <p style={{ margin: 0, textAlign: "center", color: "var(--ap-ink-3)", fontSize: 14, lineHeight: 1.5 }}>
            Enter an invite code to continue, or request access and we’ll be in touch.
          </p>
        </div>

        {/* Mode switch */}
        <div style={{ display: "flex", gap: 6, padding: 4, background: "var(--ap-surface-2)", border: "1px solid var(--ap-hairline)", borderRadius: "var(--ap-radius-sm)", marginBottom: 18 }}>
          {(["code", "request"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setSubmitted(false); }}
              style={{
                flex: 1, padding: "8px 10px", borderRadius: 6, border: 0, cursor: "pointer",
                background: mode === m ? "var(--ap-surface-1)" : "transparent",
                color: mode === m ? "var(--ap-ink-1)" : "var(--ap-ink-3)",
                fontFamily: "var(--ap-font-mono)", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
              }}
            >
              {m === "code" ? "Have a code" : "Request access"}
            </button>
          ))}
        </div>

        {mode === "code" && (
          <form onSubmit={redeem} style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <ApertureMonoLabel size={9}>Invite code</ApertureMonoLabel>
              <input
                type="text"
                autoFocus
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                style={{ ...inputStyle, letterSpacing: "0.2em", fontFamily: "var(--ap-font-mono)" }}
                placeholder="XXXXXXXX"
                maxLength={32}
              />
            </div>
            <ApertureButton type="submit" variant="accent" disabled={busy} style={{ width: "100%", marginTop: 4 }}>
              {busy ? "Checking…" : "Redeem code"}
            </ApertureButton>
          </form>
        )}

        {mode === "request" && !submitted && (
          <form onSubmit={request} style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <ApertureMonoLabel size={9}>Email</ApertureMonoLabel>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                placeholder="you@domain.com"
              />
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              <ApertureMonoLabel size={9}>What do you want to use RiloBiz for? (optional)</ApertureMonoLabel>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ ...inputStyle, resize: "vertical" }}
                maxLength={500}
              />
            </div>
            <ApertureButton type="submit" variant="accent" disabled={busy} style={{ width: "100%", marginTop: 4 }}>
              {busy ? "Sending…" : "Request access"}
            </ApertureButton>
          </form>
        )}

        {mode === "request" && submitted && (
          <div style={{
            padding: 20, borderRadius: "var(--ap-radius-sm)",
            background: "var(--ap-surface-2)", border: "1px solid var(--ap-hairline)",
            color: "var(--ap-ink-2)", fontSize: 14, lineHeight: 1.55, textAlign: "center",
          }}>
            Thanks — your request is in. We’ll email you at <strong style={{ color: "var(--ap-ink-1)" }}>{email}</strong> when an invite is ready.
          </div>
        )}

        <div style={{ marginTop: 22, textAlign: "center" }}>
          <button
            type="button"
            onClick={() => signOut()}
            style={{ background: "none", border: 0, color: "var(--ap-ink-3)", fontSize: 12, cursor: "pointer" }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}