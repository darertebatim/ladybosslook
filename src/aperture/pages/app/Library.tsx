import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useState } from "react";
import { AppShell } from "@/aperture/components/AppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import { ApertureChip, ApertureMonoLabel } from "@/aperture/components/primitives";
import { ACTIONS, type ActionCategory } from "@/aperture/data/playbooks";

const CATEGORIES: (ActionCategory | "All")[] = [
  "All", "Marketing", "Sales", "Pricing", "Customers", "Operations", "Mindset",
];

/**
 * The full library of playbooks + quick prompts.
 * Personalization happens on Home — here the user browses everything.
 */
export default function Library() {
  const [filter, setFilter] = useState<(ActionCategory | "All")>("All");
  const [kind, setKind] = useState<"all" | "playbook" | "prompt">("all");

  const visible = ACTIONS.filter(a => {
    if (filter !== "All" && a.category !== filter) return false;
    if (kind !== "all" && a.kind !== kind) return false;
    return true;
  });

  return (
    <>
      <Helmet>
        <title>Library · Aperture</title>
        <meta name="description" content="Every playbook and quick prompt Aperture can run. The home page suggests the right ones for you." />
      </Helmet>
      <AppShell>
        <PageHeader
          index="03 · LIBRARY"
          title="Playbooks & quick prompts"
          sub="The full library. Your home page surfaces the ones that fit your business right now — this is where you browse everything."
        />

        {/* Filters */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                style={{
                  appearance: "none", cursor: "pointer",
                  padding: "6px 10px",
                  fontSize: 11, fontFamily: "var(--ap-font-mono)", textTransform: "uppercase", letterSpacing: "0.12em",
                  background: filter === c ? "var(--ap-ink-1)" : "var(--ap-surface-1)",
                  color: filter === c ? "var(--ap-canvas)" : "var(--ap-ink-2)",
                  border: "1px solid var(--ap-hairline)",
                  borderRadius: 999,
                }}
              >{c}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {(["all", "playbook", "prompt"] as const).map(k => (
              <button
                key={k}
                onClick={() => setKind(k)}
                style={{
                  appearance: "none", cursor: "pointer",
                  padding: "5px 10px",
                  fontSize: 11, fontFamily: "var(--ap-font-mono)", textTransform: "uppercase", letterSpacing: "0.1em",
                  background: kind === k ? "var(--ap-signal-soft)" : "transparent",
                  color: kind === k ? "var(--ap-signal)" : "var(--ap-ink-3)",
                  border: "1px solid " + (kind === k ? "var(--ap-signal-soft)" : "var(--ap-hairline)"),
                  borderRadius: 999,
                }}
              >{k === "all" ? "All kinds" : k + "s"}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
          {visible.map(a => (
            <Link
              key={a.slug}
              to={`/aperture/app/library/${a.slug}`}
              style={{
                display: "flex", flexDirection: "column", gap: 10,
                padding: 16,
                background: "var(--ap-surface-1)",
                border: "1px solid var(--ap-hairline)",
                borderRadius: "var(--ap-radius-md)",
                textDecoration: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <ApertureChip tone={a.kind === "playbook" ? "signal" : "neutral"}>
                  {a.kind === "playbook" ? "Playbook" : "Quick prompt"}
                </ApertureChip>
                <ApertureMonoLabel>{a.category} · {a.duration}</ApertureMonoLabel>
              </div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--ap-ink-1)", letterSpacing: "-0.01em", lineHeight: 1.3 }}>
                {a.title}
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "var(--ap-ink-2)", lineHeight: 1.5 }}>
                {a.blurb}
              </p>
            </Link>
          ))}
          {visible.length === 0 && (
            <p style={{ color: "var(--ap-ink-3)", fontSize: 13 }}>Nothing matches those filters.</p>
          )}
        </div>
      </AppShell>
    </>
  );
}