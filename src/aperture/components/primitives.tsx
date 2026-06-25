import { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, ReactNode } from "react";
import { useApertureTheme } from "./ApertureLayout";
import { haptic } from "@/lib/haptics";

/* ============================================================
 * MonoLabel — tiny uppercase JetBrains Mono label
 * ============================================================ */
export function ApertureMonoLabel({
  children,
  color,
  size = 10,
  style,
  className,
}: {
  children: ReactNode;
  color?: string;
  size?: number;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <span
      className={["ap-mono", className].filter(Boolean).join(" ")}
      style={{
        fontSize: size,
        textTransform: "uppercase",
        letterSpacing: "0.14em",
        color: color ?? "var(--ap-ink-3)",
        fontWeight: 500,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/* ============================================================
 * Card — hairline surface
 * ============================================================ */
export function ApertureCard({
  children,
  raised = false,
  padding = 20,
  style,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { raised?: boolean; padding?: number }) {
  return (
    <div
      className={className}
      style={{
        background: "var(--ap-surface-1)",
        border: "1px solid var(--ap-hairline)",
        borderRadius: "var(--ap-radius-md)",
        boxShadow: raised ? "var(--ap-shadow-raised)" : "var(--ap-shadow-card)",
        padding,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ============================================================
 * Button — default | ghost | accent
 * ============================================================ */
type Variant = "default" | "ghost" | "accent";
type Size = "sm" | "md";

export function ApertureButton({
  children,
  variant = "default",
  size = "md",
  style,
  onClick,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  const isAccent = variant === "accent";
  const isGhost = variant === "ghost";

  const heights: Record<Size, number> = { sm: 30, md: 38 };
  const fontSizes: Record<Size, number> = { sm: 12.5, md: 13.5 };
  const paddings: Record<Size, string> = { sm: "0 12px", md: "0 16px" };

  return (
    <button
      style={{
        appearance: "none",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        height: heights[size],
        padding: paddings[size],
        fontSize: fontSizes[size],
        fontWeight: 500,
        fontFamily: "var(--ap-font-sans)",
        letterSpacing: "-0.005em",
        borderRadius: "var(--ap-radius-sm)",
        border: isAccent
          ? "1px solid transparent"
          : isGhost
          ? "1px solid transparent"
          : "1px solid var(--ap-hairline-strong)",
        background: isAccent
          ? "var(--ap-signal)"
          : isGhost
          ? "transparent"
          : "var(--ap-surface-2)",
        color: isAccent ? "var(--ap-on-signal)" : "var(--ap-ink-1)",
        transition: "background 120ms ease, border-color 120ms ease, transform 80ms ease",
        ...style,
      }}
      onClick={(e) => {
        if (isAccent) haptic.medium(); else haptic.light();
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ============================================================
 * Chip — small status pill
 * ============================================================ */
export function ApertureChip({
  children,
  tone = "neutral",
  icon,
}: {
  children: ReactNode;
  tone?: "neutral" | "signal" | "live";
  icon?: ReactNode;
}) {
  const toneStyles: Record<string, CSSProperties> = {
    neutral: {
      background: "var(--ap-surface-2)",
      color: "var(--ap-ink-2)",
      border: "1px solid var(--ap-hairline)",
    },
    signal: {
      background: "var(--ap-signal-soft)",
      color: "var(--ap-signal)",
      border: "1px solid transparent",
    },
    live: {
      background: "var(--ap-live-soft)",
      color: "var(--ap-live)",
      border: "1px solid transparent",
    },
  };
  return (
    <span
      className="ap-mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        padding: "4px 8px",
        borderRadius: 999,
        ...toneStyles[tone],
      }}
    >
      {icon}
      {children}
    </span>
  );
}

/* ============================================================
 * IntegrationDot — colored dot for an external service
 * ============================================================ */
export function ApertureIntegrationDot({
  color,
  size = 8,
  status = "live",
}: {
  color: string;
  size?: number;
  status?: "live" | "syncing" | "off";
}) {
  return (
    <span
      className={status === "live" ? "ap-pulse" : ""}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: 999,
        background: status === "off" ? "var(--ap-ink-3)" : color,
        opacity: status === "syncing" ? 0.55 : 1,
        boxShadow:
          status === "live"
            ? `0 0 0 3px ${color}22`
            : "none",
      }}
    />
  );
}

/* ============================================================
 * Switch — day/night toggle (also reusable as a generic 2-state pill)
 * ============================================================ */
export function ApertureThemeSwitch() {
  const { theme, toggle } = useApertureTheme();
  return (
    <button
      onClick={() => { haptic.selection(); toggle(); }}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="ap-mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0,
        height: 30,
        padding: 3,
        borderRadius: 999,
        background: "var(--ap-surface-2)",
        border: "1px solid var(--ap-hairline)",
        cursor: "pointer",
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.14em",
      }}
    >
      <span
        style={{
          padding: "0 10px",
          height: 24,
          display: "inline-flex",
          alignItems: "center",
          borderRadius: 999,
          background: theme === "dark" ? "var(--ap-surface-3)" : "transparent",
          color: theme === "dark" ? "var(--ap-ink-1)" : "var(--ap-ink-3)",
        }}
      >
        Night
      </span>
      <span
        style={{
          padding: "0 10px",
          height: 24,
          display: "inline-flex",
          alignItems: "center",
          borderRadius: 999,
          background: theme === "light" ? "var(--ap-surface-3)" : "transparent",
          color: theme === "light" ? "var(--ap-ink-1)" : "var(--ap-ink-3)",
        }}
      >
        Day
      </span>
    </button>
  );
}

/* ============================================================
 * SectionTitle — small heading + optional mono index label
 * ============================================================ */
export function ApertureSectionTitle({
  index,
  title,
  sub,
}: {
  index?: string;
  title: string;
  sub?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {index && <ApertureMonoLabel>{index}</ApertureMonoLabel>}
      <h2
        style={{
          margin: 0,
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "var(--ap-ink-1)",
        }}
      >
        {title}
      </h2>
      {sub && (
        <p style={{ margin: 0, fontSize: 13.5, color: "var(--ap-ink-2)" }}>{sub}</p>
      )}
    </div>
  );
}

/* ============================================================
 * Loading — animated three-dot pulse with descriptive label.
 * Use anywhere an async fetch could otherwise flash a stale
 * "Nothing yet" empty state before data arrives.
 * ============================================================ */
export function ApertureLoading({
  label,
  sublabel,
  padding = 24,
  inline = false,
}: {
  label?: string;
  sublabel?: string;
  padding?: number;
  inline?: boolean;
}) {
  const dots = (
    <span style={{ display: "inline-flex", gap: 4 }}>
      <style>{`
        @keyframes apLoadDot { 0%,80%,100% { opacity: 0.25; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }
      `}</style>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: 999,
          background: "var(--ap-signal)",
          animation: `apLoadDot 1.2s ${i * 0.15}s infinite ease-in-out`,
        }} />
      ))}
    </span>
  );

  if (inline) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        {dots}
        {label && <ApertureMonoLabel>{label}</ApertureMonoLabel>}
      </span>
    );
  }

  return (
    <ApertureCard padding={padding}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: sublabel ? 8 : 0 }}>
        {dots}
        <ApertureMonoLabel>{label ?? "Working…"}</ApertureMonoLabel>
      </div>
      {sublabel && (
        <p style={{ margin: 0, fontSize: 13, color: "var(--ap-ink-2)", lineHeight: 1.5 }}>
          {sublabel}
        </p>
      )}
    </ApertureCard>
  );
}