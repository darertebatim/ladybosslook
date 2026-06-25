import { CSSProperties } from "react";
import rilobizLogo from "@/assets/rilobiz-logo.png";

interface ApertureLogoProps {
  size?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

/**
 * RiloBiz mark — six-blade iris drawn as a single monoline SVG.
 * Color is taken from `currentColor` by default so it inherits ink color
 * and can be flipped to var(--ap-signal) when used as a brand accent.
 */
export function ApertureLogo({
  size = 32,
  color,
  className,
  style,
  title = "RiloBiz",
}: ApertureLogoProps) {
  return (
    <img
      src={rilobizLogo}
      width={size}
      height={size}
      alt={title}
      role="img"
      aria-label={title}
      className={className}
      style={{ display: "block", color, ...style }}
      draggable={false}
    />
  );
}

/**
 * Wordmark — RiloBiz set in tight Inter with a leading mark.
 */
export function ApertureWordmark({
  size = 22,
  className,
  style,
  showMark = true,
}: {
  size?: number;
  className?: string;
  style?: CSSProperties;
  showMark?: boolean;
}) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.42,
        color: "var(--ap-ink-1)",
        fontFamily: "var(--ap-font-sans)",
        fontWeight: 600,
        fontSize: size,
        letterSpacing: "-0.02em",
        lineHeight: 1,
        ...style,
      }}
    >
      {showMark && <ApertureLogo size={size * 1.15} />}
      <span>RiloBiz</span>
    </span>
  );
}