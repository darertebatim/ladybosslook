import { CSSProperties } from "react";

interface ApertureLogoProps {
  size?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

/**
 * Aperture mark — six-blade iris drawn as a single monoline SVG.
 * Color is taken from `currentColor` by default so it inherits ink color
 * and can be flipped to var(--ap-signal) when used as a brand accent.
 */
export function ApertureLogo({
  size = 32,
  color,
  className,
  style,
  title = "Aperture",
}: ApertureLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      role="img"
      aria-label={title}
      className={className}
      style={{ color, display: "block", ...style }}
    >
      <title>{title}</title>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* outer ring */}
        <circle cx="24" cy="24" r="20" />
        {/* six iris blades — each goes from a point on the outer ring tangent-style
            to a point on the inner hexagonal aperture */}
        <path d="M24 4 L33 18 L15 18 Z" opacity="0.95" />
        <path d="M41.3 14 L30 19 L36 34 Z" opacity="0.95" />
        <path d="M41.3 34 L30 29 L24 44 Z" opacity="0.95" />
        <path d="M6.7 34 L18 29 L12 14.5 Z" opacity="0.95" />
        <path d="M6.7 14 L18 19 L24 4 Z" opacity="0" />
        {/* inner aperture hexagon */}
        <path d="M24 16 L31 20 L31 28 L24 32 L17 28 L17 20 Z" />
      </g>
    </svg>
  );
}

/**
 * Wordmark — Aperture set in tight Inter with a leading mark.
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
      <span>Aperture</span>
    </span>
  );
}