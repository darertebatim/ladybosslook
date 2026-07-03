import { Globe, Instagram, ExternalLink } from "lucide-react";
import { ApertureCard, ApertureMonoLabel, ApertureChip } from "./primitives";
import type { SourceSummary } from "@/aperture/hooks/db/useApertureSources";

function timeAgo(iso?: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function SourceCard({
  summary, busy, onOpen,
}: {
  summary: SourceSummary;
  busy?: boolean;
  onOpen: () => void;
}) {
  const Icon = summary.kind === "website" ? Globe : Instagram;
  const fetched = summary.snapshot?.fetched_at ?? null;
  const status = busy
    ? { tone: "neutral" as const, label: "Fetching…" }
    : summary.fetchStatus === "failed"
      ? { tone: "neutral" as const, label: "Couldn't read this site" }
      : summary.fetchStatus === "ok"
        ? { tone: "signal" as const, label: "Synced" }
        : { tone: "neutral" as const, label: "Not fetched" };

  return (
    <ApertureCard
      padding={14}
      onClick={onOpen}
      style={{ cursor: "pointer", transition: "transform 120ms ease" }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "var(--ap-surface-2)", border: "1px solid var(--ap-hairline)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--ap-ink-1)",
          }}>
            <Icon size={14} />
          </div>
          <ApertureMonoLabel>{summary.kind}</ApertureMonoLabel>
        </div>
        <ApertureChip tone={status.tone}>{status.label}</ApertureChip>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <h4 style={{
          margin: 0, fontSize: 15, fontWeight: 600, color: "var(--ap-ink-1)",
          letterSpacing: "-0.01em",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {summary.display}
        </h4>
        <ExternalLink size={11} style={{ color: "var(--ap-ink-3)", flexShrink: 0 }} />
      </div>
      <p style={{ margin: 0, fontSize: 12, color: "var(--ap-ink-3)" }}>
        {summary.factsCount} {summary.factsCount === 1 ? "fact" : "facts"} extracted · {timeAgo(fetched)}
      </p>
    </ApertureCard>
  );
}