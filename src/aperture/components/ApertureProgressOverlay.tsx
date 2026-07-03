import { useEffect, useRef, useState } from "react";
import { ApertureCard, ApertureMonoLabel, ApertureButton } from "./primitives";

export type ApertureProgressStatus = "running" | "done" | "error";

export interface ApertureProgressStep {
  /** Percent threshold (0-100) at which this label activates. */
  at: number;
  label: string;
}

export interface ApertureProgressOverlayProps {
  open: boolean;
  status: ApertureProgressStatus;
  title: string;
  description?: string;
  steps: ApertureProgressStep[];
  /** Rough expected duration in ms. Bar eases 5 → 92 over this window. */
  estimateMs: number;
  /** Minimum on-screen time before we allow snap-to-100. Default 700ms. */
  minDisplayMs?: number;
  /** Auto-flip to error after this many ms of "running". Default 25000. */
  hardTimeoutMs?: number;
  errorMessage?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  /** Fires when hardTimeoutMs elapses while still running. */
  onHardTimeout?: () => void;
}

/**
 * Full-card progress overlay for long AI actions.
 * Eases 5→92% over estimateMs, snaps to 100 on `done` (respecting minDisplayMs),
 * turns red with retry/dismiss on `error`. Auto-errors at hardTimeoutMs so a
 * bad-wifi user is never staring at a dead bar.
 */
export function ApertureProgressOverlay({
  open,
  status,
  title,
  description,
  steps,
  estimateMs,
  minDisplayMs = 700,
  hardTimeoutMs = 25000,
  errorMessage,
  onRetry,
  onDismiss,
  onHardTimeout,
}: ApertureProgressOverlayProps) {
  const [pct, setPct] = useState(5);
  const [stalled, setStalled] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const timedOutRef = useRef(false);

  // Ease 5→92 while running.
  useEffect(() => {
    if (!open || status !== "running") return;
    startedAtRef.current = Date.now();
    timedOutRef.current = false;
    setStalled(false);
    setPct(5);
    const id = window.setInterval(() => {
      const started = startedAtRef.current ?? Date.now();
      const elapsed = Date.now() - started;
      // Decelerating curve toward 92.
      const tau = Math.max(1000, estimateMs / 3);
      const target = Math.min(92, 5 + Math.round((1 - Math.exp(-elapsed / tau)) * 87));
      setPct(prev => Math.max(prev, target));
      if (elapsed > estimateMs * 1.5) setStalled(true);
      if (elapsed > hardTimeoutMs && !timedOutRef.current) {
        timedOutRef.current = true;
        onHardTimeout?.();
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [open, status, estimateMs, hardTimeoutMs, onHardTimeout]);

  // Snap to 100 on success (respecting minDisplayMs).
  useEffect(() => {
    if (!open) return;
    if (status !== "done") return;
    const started = startedAtRef.current ?? Date.now();
    const remaining = Math.max(0, minDisplayMs - (Date.now() - started));
    const id = window.setTimeout(() => setPct(100), remaining);
    return () => window.clearTimeout(id);
  }, [open, status, minDisplayMs]);

  if (!open) return null;

  // Pick the highest step whose threshold we've passed.
  const activeStep = [...steps]
    .sort((a, b) => a.at - b.at)
    .reduce<string>((acc, s) => (pct >= s.at ? s.label : acc), steps[0]?.label ?? "Working…");
  const isError = status === "error";
  const label = isError
    ? (errorMessage ?? "Something went wrong.")
    : status === "done"
    ? "Ready"
    : stalled ? "Almost there…" : activeStep;

  const barColor = isError ? "var(--ap-live, #d64545)" : "var(--ap-signal)";
  const shownPct = isError ? Math.max(pct, 8) : pct;

  return (
    <ApertureCard padding={28}>
      <ApertureMonoLabel>{isError ? "Interrupted" : status === "done" ? "All done" : "Working"}</ApertureMonoLabel>
      <h2 style={{ margin: "10px 0 8px", fontSize: 24, color: "var(--ap-ink-1)", fontWeight: 600, letterSpacing: "-0.02em" }}>
        {title}
      </h2>
      {description && (
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--ap-ink-2)" }}>
          {description}
        </p>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={shownPct}
        style={{
          width: "100%", height: 8, borderRadius: 999,
          background: "var(--ap-hairline)", overflow: "hidden", marginBottom: 10,
        }}
      >
        <div style={{
          width: `${shownPct}%`, height: "100%",
          background: barColor,
          transition: "width 0.35s ease, background 200ms ease",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: isError ? "var(--ap-live, #d64545)" : "var(--ap-ink-2)" }}>
        <span>{label}</span>
        <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600, color: isError ? "var(--ap-live, #d64545)" : "var(--ap-ink-1)" }}>
          {shownPct}%
        </span>
      </div>
      {isError && (onRetry || onDismiss) && (
        <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
          {onDismiss && (
            <ApertureButton variant="ghost" onClick={onDismiss}>Go back</ApertureButton>
          )}
          {onRetry && (
            <ApertureButton variant="accent" onClick={onRetry}>Retry</ApertureButton>
          )}
        </div>
      )}
    </ApertureCard>
  );
}