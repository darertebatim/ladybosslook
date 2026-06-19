import type { MemorySource } from "@/aperture/hooks/db/useApertureMemoryDB";

/**
 * Visually distinct pills per memory source tier. The brief calls for
 * functional, not just verbal, separation between confirmed facts and
 * unconfirmed guesses — guesses are dashed + muted; confirmed are solid
 * signal; AI-noticed are outlined signal; file-extracted are outlined
 * neutral.
 */
export function MemorySourcePill({
  source,
  size = "sm",
}: {
  source: MemorySource | "skipped" | "unknown" | string | null;
  size?: "sm" | "xs";
}) {
  const spec = pillSpec(source);
  const padY = size === "xs" ? 2 : 3;
  const padX = size === "xs" ? 6 : 8;
  const font = size === "xs" ? 9.5 : 10;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontFamily: "var(--ap-font-mono)",
        fontSize: font,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        padding: `${padY}px ${padX}px`,
        borderRadius: 4,
        border: spec.border,
        background: spec.background,
        color: spec.color,
        whiteSpace: "nowrap",
      }}
    >
      {spec.label}
    </span>
  );
}

function pillSpec(source: string | null) {
  switch (source) {
    case "user_confirmed":
      return {
        label: "Confirmed",
        background: "var(--ap-signal)",
        color: "#000",
        border: "1px solid var(--ap-signal)",
      };
    case "bucket_answer":
      return {
        label: "Saved",
        background: "var(--ap-signal)",
        color: "#000",
        border: "1px solid var(--ap-signal)",
      };
    case "ai_extracted":
      return {
        label: "Noticed",
        background: "transparent",
        color: "var(--ap-signal)",
        border: "1px solid var(--ap-signal)",
      };
    case "file_extracted":
      return {
        label: "From file",
        background: "transparent",
        color: "var(--ap-ink-2)",
        border: "1px solid var(--ap-hairline)",
      };
    case "freeform":
      return {
        label: "Note",
        background: "transparent",
        color: "var(--ap-ink-2)",
        border: "1px solid var(--ap-hairline)",
      };
    case "ai_inferred_pre_onboarding":
      return {
        label: "Guess",
        background: "transparent",
        color: "var(--ap-ink-3)",
        border: "1px dashed var(--ap-hairline)",
      };
    default:
      return {
        label: String(source ?? "item").slice(0, 12),
        background: "transparent",
        color: "var(--ap-ink-3)",
        border: "1px solid var(--ap-hairline)",
      };
  }
}