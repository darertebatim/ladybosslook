import { useCallback, useEffect, useState } from "react";
import { ApertureCard, ApertureMonoLabel, ApertureButton } from "@/aperture/components/primitives";
import { RotateCw, ChevronDown, ChevronUp, BarChart3, AlertTriangle, ArrowRight, MessageSquare } from "lucide-react";
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
  defaultOpen = false,
  autoExpandIfCached = false,
  onTalk,
  talkLabel = "Talk about this",
}: {
  label: string;
  title: string;
  teaser: string;
  /** Returns the cached brief if any; null if none exists yet. */
  load: () => Promise<{ summary: string; generated_at: string } | null>;
  /** Forces regeneration and returns the fresh brief. */
  regenerate: () => Promise<{ summary: string; generated_at: string }>;
  /** Render already expanded on mount (with brief auto-loaded). */
  defaultOpen?: boolean;
  /** Auto-expand once the initial prefetch finds a cached brief. Skips expansion
   *  when nothing is cached, so brand-new buckets stay in the "Show brief"
   *  teaser state instead of force-generating from thin data. */
  autoExpandIfCached?: boolean;
  /** When set, renders a "Talk about this" CTA after the brief body. Handler
   *  receives the raw summary + parsed MOVE (if any) so the caller can seed
   *  a chat opener anchored on the recommended next move. */
  onTalk?: (args: { summary: string; move: string | null }) => void | Promise<void>;
  talkLabel?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [brief, setBrief] = useState<{ summary: string; generated_at: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [talking, setTalking] = useState(false);

  // Prefetch the cached row once so we can show "last updated" without expanding.
  useEffect(() => {
    let alive = true;
    void load().then(b => {
      if (!alive || !b) return;
      setBrief(b);
      if (autoExpandIfCached) setOpen(true);
    });
    if (defaultOpen) { void ensureBrief(); }
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

  async function onTalkClick() {
    if (!onTalk || !brief || talking) return;
    setTalking(true);
    try {
      const move = extractBriefMove(brief.summary);
      await onTalk({ summary: brief.summary, move });
    } finally { setTalking(false); }
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
        <ApertureButton variant="accent" size="sm" onClick={onToggle} loading={busy && !brief}>
          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {busy && !brief ? "Reading…" : open ? "Hide" : "Show brief"}
        </ApertureButton>
        {brief && (
          <ApertureButton variant="ghost" size="sm" onClick={onReset} loading={busy}>
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
          {onTalk && (
            <div style={{
              marginTop: 16, paddingTop: 12,
              borderTop: "1px solid var(--ap-hairline)",
              display: "flex", justifyContent: "flex-start",
            }}>
              <ApertureButton variant="accent" onClick={onTalkClick} loading={talking}>
                <MessageSquare size={12} /> {talking ? "Opening…" : talkLabel}
              </ApertureButton>
            </div>
          )}
        </div>
      )}
    </ApertureCard>
  );
}

/** Pulls the first "Move" line out of a parsed brief, if present. */
export function extractBriefMove(summary: string): string | null {
  const parsed = parseBrief(summary);
  const moveItem = parsed?.glance?.find(g => g.kind === "move");
  return moveItem?.text?.trim() ?? null;
}

/**
 * Splits a two-part brief on the "What I see" label and renders each
 * section with its own header treatment. Falls back to a single block
 * for legacy briefs that don't include the labels.
 */
function BriefBody({ summary }: { summary: string }) {
  const parsed = parseBrief(summary);
  if (!parsed) return <AperturePrompt text={summary} size={13.5} />;
  const { glance, know, see } = parsed;
  return (
    <>
      {glance && <AtAGlance items={glance} />}
      {know && (
        <SectionBlock
          label="What we know"
          labelColor="var(--ap-ink-3)"
          accentColor="var(--ap-hairline-strong, var(--ap-ink-3))"
          text={know}
        />
      )}
      {see && (
        <SectionBlock
          label="What I see"
          labelColor="var(--ap-signal)"
          accentColor="var(--ap-signal)"
          text={see}
          marginTop={glance || know ? 16 : 0}
        />
      )}
    </>
  );
}

function SectionBlock({
  label, labelColor, accentColor, text, marginTop = 0,
}: { label: string; labelColor: string; accentColor: string; text: string; marginTop?: number }) {
  return (
    <div style={{ marginTop, paddingLeft: 12, borderLeft: `2px solid ${accentColor}` }}>
      <SectionLabel color={labelColor}>{label}</SectionLabel>
      <AperturePrompt text={text} size={13.5} />
    </div>
  );
}

function AtAGlance({ items }: { items: GlanceItem[] }) {
  return (
    <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
      {items.map((it, i) => (
        <GlanceRow key={i} item={it} />
      ))}
    </div>
  );
}

function GlanceRow({ item }: { item: GlanceItem }) {
  const meta = GLANCE_META[item.kind];
  const Icon = meta.icon;
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "10px 12px",
      background: meta.bg,
      border: `1px solid ${meta.border}`,
      borderRadius: 10,
    }}>
      <div style={{
        flex: "0 0 auto",
        width: 26, height: 26, borderRadius: 8,
        display: "grid", placeItems: "center",
        background: meta.iconBg, color: meta.iconColor,
      }}>
        <Icon size={14} strokeWidth={2.25} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontFamily: "var(--ap-font-mono)",
          fontSize: 9.5,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: meta.iconColor,
          marginBottom: 2,
        }}>{meta.label}</div>
        <div style={{ fontSize: 13, lineHeight: 1.45, color: "var(--ap-ink-1)" }}>
          {item.text}
        </div>
      </div>
    </div>
  );
}

type GlanceKind = "metric" | "watch" | "move";
type GlanceItem = { kind: GlanceKind; text: string };

const GLANCE_META: Record<GlanceKind, {
  label: string; icon: typeof BarChart3;
  bg: string; border: string; iconBg: string; iconColor: string;
}> = {
  metric: {
    label: "Metric",
    icon: BarChart3,
    bg: "var(--ap-surface-2)",
    border: "var(--ap-hairline)",
    iconBg: "color-mix(in srgb, var(--ap-ink-2) 14%, transparent)",
    iconColor: "var(--ap-ink-2)",
  },
  watch: {
    label: "Watch",
    icon: AlertTriangle,
    bg: "color-mix(in srgb, #c44 6%, var(--ap-surface-2))",
    border: "color-mix(in srgb, #c44 28%, var(--ap-hairline))",
    iconBg: "color-mix(in srgb, #c44 16%, transparent)",
    iconColor: "#c44",
  },
  move: {
    label: "Move",
    icon: ArrowRight,
    bg: "color-mix(in srgb, var(--ap-signal) 6%, var(--ap-surface-2))",
    border: "color-mix(in srgb, var(--ap-signal) 32%, var(--ap-hairline))",
    iconBg: "color-mix(in srgb, var(--ap-signal) 18%, transparent)",
    iconColor: "var(--ap-signal)",
  },
};

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

function parseBrief(text: string): { glance: GlanceItem[] | null; know: string; see: string } | null {
  if (!text) return null;

  // Find anchor positions for the three labels.
  const glanceRe = /(^|\n)\s*[#*_>\-\s]*at\s+a\s+glance[\s:*_]*\n?/i;
  const knowRe   = /(^|\n)\s*[#*_>\-\s]*what\s+we\s+know[\s:*_]*\n?/i;
  const seeRe    = /(^|\n)\s*[#*_>\-\s]*what\s+i\s+see[\s:*_]*\n?/i;

  const seeM = text.match(seeRe);
  if (!seeM || seeM.index === undefined) return null;

  const knowM = text.match(knowRe);
  const glanceM = text.match(glanceRe);

  let glanceRaw = "";
  let knowRaw = "";
  const seeRaw = text.slice(seeM.index + seeM[0].length).trim();

  if (knowM && knowM.index !== undefined && knowM.index < seeM.index) {
    const knowStart = knowM.index + knowM[0].length;
    knowRaw = text.slice(knowStart, seeM.index).trim();
    if (glanceM && glanceM.index !== undefined && glanceM.index < knowM.index) {
      glanceRaw = text.slice(glanceM.index + glanceM[0].length, knowM.index).trim();
    } else {
      glanceRaw = text.slice(0, knowM.index).trim();
      // Only treat preamble as glance if it actually looks like glance lines
      if (!/metric\s*:/i.test(glanceRaw) && !/watch\s*:/i.test(glanceRaw) && !/move\s*:/i.test(glanceRaw)) {
        glanceRaw = "";
      }
    }
  } else {
    knowRaw = text.slice(0, seeM.index).replace(/^\s*[#*_>\-\s]*what\s+we\s+know[\s:*_]*\n?/i, "").trim();
  }

  if (!knowRaw || !seeRaw) return null;
  const glance = parseGlance(glanceRaw);
  return { glance, know: knowRaw, see: seeRaw };
}

function parseGlance(raw: string): GlanceItem[] | null {
  if (!raw) return null;
  const out: GlanceItem[] = [];
  const lines = raw.split(/\n+/);
  for (const line of lines) {
    const clean = line.replace(/^[\s\-*•>]+/, "").replace(/\*\*/g, "").trim();
    if (!clean) continue;
    const m = clean.match(/^(metric|watch|warning|move)\s*[:\-—]\s*(.+)$/i);
    if (!m) continue;
    const tag = m[1].toLowerCase();
    const kind: GlanceKind = tag === "metric" ? "metric" : tag === "move" ? "move" : "watch";
    out.push({ kind, text: m[2].trim() });
  }
  return out.length ? out : null;
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