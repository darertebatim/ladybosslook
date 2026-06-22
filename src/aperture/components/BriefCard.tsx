import { useCallback, useEffect, useState } from "react";
import { ApertureCard, ApertureMonoLabel, ApertureButton } from "@/aperture/components/primitives";
import { RotateCw, ChevronDown, ChevronUp } from "lucide-react";
import { AperturePrompt } from "@/aperture/components/chat/AperturePrompt";

/**
 * Reusable "what I know" brief card. Pure UI — the caller wires the
 * fetch/regenerate to either `aperture-bucket-brief` (per bucket) or
 * the memory-card flow (full business brief).
 *
 * - Cached briefs render instantly; first-time generation is on-demand
 *   when the user expands the card.
 * - Shows the generated date and a Reset button so the owner can force
 *   a fresh read-back whenever they want.
 */
export function BriefCard({
  label,
  title,
  teaser,
  load,
  regenerate,
}: {
  label: string;
  title: string;
  teaser: string;
  /** Returns the cached brief if any; null if none exists yet. */
  load: () => Promise<{ summary: string; generated_at: string } | null>;
  /** Forces regeneration and returns the fresh brief. */
  regenerate: () => Promise<{ summary: string; generated_at: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [brief, setBrief] = useState<{ summary: string; generated_at: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefetch the cached row once so we can show "last updated" without expanding.
  useEffect(() => {
    let alive = true;
    void load().then(b => { if (alive && b) setBrief(b); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureBrief = useCallback(async () => {
    if (brief || busy) return;
    setBusy(true); setError(null);
    try {
      const cached = await load();
      if (cached) { setBrief(cached); return; }
      const fresh = await regenerate();
      setBrief(fresh);
    } catch (e: any) {
      setError(e?.message ?? "Couldn't load brief.");
    } finally { setBusy(false); }
  }, [brief, busy, load, regenerate]);

  async function onReset() {
    setBusy(true); setError(null);
    try {
      const fresh = await regenerate();
      setBrief(fresh);
      setOpen(true);
    } catch (e: any) {
      setError(e?.message ?? "Couldn't regenerate brief.");
    } finally { setBusy(false); }
  }

  async function onToggle() {
    const next = !open;
    setOpen(next);
    if (next) await ensureBrief();
  }

  return (
    <ApertureCard padding={16}>
      <ApertureMonoLabel>{label}</ApertureMonoLabel>
      <h3 style={{ margin: "6px 0 4px", fontSize: 15, fontWeight: 600, color: "var(--ap-ink-1)" }}>
        {title}
      </h3>
      <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "var(--ap-ink-2)", lineHeight: 1.5 }}>
        {teaser}
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <ApertureButton variant="accent" size="sm" onClick={onToggle} disabled={busy}>
          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {busy && !brief ? "Reading…" : open ? "Hide" : "Show brief"}
        </ApertureButton>
        {brief && (
          <ApertureButton variant="ghost" size="sm" onClick={onReset} disabled={busy}>
            <RotateCw size={12} /> {busy ? "Refreshing…" : "Reset"}
          </ApertureButton>
        )}
        {brief && (
          <span style={{
            marginLeft: "auto", fontSize: 10.5,
            fontFamily: "var(--ap-font-mono)",
            color: "var(--ap-ink-3)",
            textTransform: "uppercase", letterSpacing: "0.10em",
          }}>
            Updated {formatStamp(brief.generated_at)}
          </span>
        )}
      </div>

      {error && (
        <p style={{ marginTop: 10, fontSize: 12, color: "var(--ap-warning, #c44)" }}>{error}</p>
      )}

      {open && brief && (
        <div style={{
          marginTop: 12, paddingTop: 12,
          borderTop: "1px solid var(--ap-hairline)",
        }}>
          <BriefBody summary={brief.summary} />
        </div>
      )}
    </ApertureCard>
  );
}

/**
 * Splits a two-part brief on the "What I see" label and renders each
 * section with its own header treatment. Falls back to a single block
 * for legacy briefs that don't include the labels.
 */
function BriefBody({ summary }: { summary: string }) {
  const parts = splitBrief(summary);
  if (!parts) return <AperturePrompt text={summary} size={13.5} />;
  return (
    <>
      <SectionLabel color="var(--ap-ink-3)">What we know</SectionLabel>
      <AperturePrompt text={parts.know} size={13.5} />
      <hr style={{
        border: "none",
        borderTop: "1px solid var(--ap-hairline)",
        margin: "14px 0",
      }} />
      <SectionLabel color="var(--ap-signal)">What I see</SectionLabel>
      <AperturePrompt text={parts.see} size={13.5} />
    </>
  );
}

function SectionLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div style={{
      fontFamily: "var(--ap-font-mono)",
      fontSize: 10.5,
      letterSpacing: "0.10em",
      textTransform: "uppercase",
      color,
      marginBottom: 6,
    }}>{children}</div>
  );
}

function splitBrief(text: string): { know: string; see: string } | null {
  if (!text) return null;
  // Match "What I see" as a label (case-insensitive), optionally bolded/headed.
  const re = /(^|\n)\s*[#*_>\-\s]*what\s+i\s+see[\s:*_]*\n?/i;
  const m = text.match(re);
  if (!m || m.index === undefined) return null;
  const before = text.slice(0, m.index);
  const after = text.slice(m.index + m[0].length);
  // Strip the "What we know" label from Part 1 if present.
  const know = before.replace(/^\s*[#*_>\-\s]*what\s+we\s+know[\s:*_]*\n?/i, "").trim();
  const see = after.trim();
  if (!know || !see) return null;
  return { know, see };
}

function formatStamp(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const min = Math.round(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}