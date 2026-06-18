import { useMemo, useState, useEffect } from "react";

interface Industry {
  slug: string;
  label: string;
  group_label: string | null;
}

/**
 * Two-step industry picker: pick a group, then an industry within it.
 * Shows group chips first; once a group is selected, swaps to that group's
 * industries with a "Change category" back link.
 */
export function IndustryPicker({
  industries, value, onChange,
}: {
  industries: Industry[];
  value: string;
  onChange: (slug: string) => void;
}) {
  // Resolve the group of the currently-selected industry (if any).
  const initialGroup = useMemo(() => {
    if (!value) return null;
    return industries.find(i => i.slug === value)?.group_label ?? null;
  }, [value, industries]);

  const [group, setGroup] = useState<string | null>(initialGroup);
  useEffect(() => { if (initialGroup) setGroup(initialGroup); }, [initialGroup]);

  // If the saved value is a custom "other:" slug, hydrate the input with the
  // original text so the user sees what they typed.
  const isCustomValue = value.startsWith("other__");
  const [customText, setCustomText] = useState<string>(() => {
    if (!isCustomValue) return "";
    // Format: other__<group_slug>__<text_slug>__<original_label>
    const parts = value.split("__");
    return parts.length >= 4 ? parts.slice(3).join("__").replace(/_/g, " ") : "";
  });
  const [showCustom, setShowCustom] = useState<boolean>(isCustomValue);

  const groups = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const ind of industries) {
      const g = ind.group_label ?? "Other";
      if (!seen.has(g)) { seen.add(g); list.push(g); }
    }
    return list;
  }, [industries]);

  const inGroup = useMemo(
    () => industries.filter(i => (i.group_label ?? "Other") === group),
    [industries, group],
  );

  function commitCustom(text: string) {
    const t = text.trim();
    if (!t) { onChange(""); return; }
    const groupSlug = (group ?? "other").toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const textSlug = t.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    // Encode original text in the slug so we can re-hydrate it later.
    onChange(`other__${groupSlug}__${textSlug}__${textSlug}`);
  }

  const chipBase: React.CSSProperties = {
    appearance: "none", cursor: "pointer",
    padding: "10px 14px", borderRadius: "var(--ap-radius-sm)",
    border: "1px solid var(--ap-hairline)",
    background: "var(--ap-surface-2)", color: "var(--ap-ink-1)",
    fontSize: 14, fontWeight: 500,
    transition: "transform 80ms ease, background 120ms ease",
  };
  const chipOn: React.CSSProperties = {
    ...chipBase,
    border: "1px solid var(--ap-signal)",
    background: "var(--ap-signal)",
    color: "#000",
  };

  if (!group) {
    return (
      <div>
        <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--ap-ink-3)" }}>
          Step 1 of 2 · pick a category
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {groups.map(g => (
            <button key={g} type="button" onClick={() => setGroup(g)} style={chipBase}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {g}
            </button>
          ))}
          {/* Always allow a fully custom "Other" group too. */}
          <button type="button" onClick={() => { setGroup("Other"); setShowCustom(true); }}
            style={{ ...chipBase, borderStyle: "dashed", fontStyle: "italic" }}>
            ✏️ Other / not listed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <p style={{ margin: 0, fontSize: 12, color: "var(--ap-ink-3)" }}>
          Step 2 of 2 · {group}
        </p>
        <button type="button" onClick={() => { setGroup(null); onChange(""); }}
          style={{
            appearance: "none", background: "transparent", border: "none",
            color: "var(--ap-ink-3)", fontSize: 11, fontFamily: "var(--ap-font-mono)",
            textTransform: "uppercase", letterSpacing: "0.12em", cursor: "pointer",
          }}>
          ← Change
        </button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {inGroup.map(ind => {
          const on = value === ind.slug;
          return (
            <button key={ind.slug} type="button" onClick={() => onChange(ind.slug)}
              style={on ? chipOn : chipBase}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {ind.label}
            </button>
          );
        })}
        {/* Per-group "Other" — opens an open text field below. */}
        <button type="button"
          onClick={() => { setShowCustom(true); if (!customText) onChange(""); }}
          style={{
            ...(showCustom ? chipOn : chipBase),
            borderStyle: showCustom ? "solid" : "dashed",
            fontStyle: "italic",
          }}>
          ✏️ Other
        </button>
      </div>

      {showCustom && (
        <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={customText}
            onChange={(e) => {
              setCustomText(e.target.value);
              commitCustom(e.target.value);
            }}
            placeholder={`Type your ${group?.toLowerCase() ?? ""} industry…`}
            autoFocus
            style={{
              flex: 1, height: 38, padding: "0 12px",
              borderRadius: "var(--ap-radius-sm)",
              border: "1px solid var(--ap-hairline-strong)",
              background: "var(--ap-surface-1)", color: "var(--ap-ink-1)",
              fontSize: 14, fontFamily: "var(--ap-font-sans)",
            }}
          />
        </div>
      )}
    </div>
  );
}