import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { AppShell } from "@/aperture/components/AppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureCard, ApertureButton, ApertureChip,
  ApertureIntegrationDot, ApertureMonoLabel,
} from "@/aperture/components/primitives";
import { PLAYBOOKS } from "@/aperture/data/playbooks";
import { INTEGRATIONS } from "@/aperture/data/integrations";

const CATS = ["All", "Revenue", "Marketing", "Operations", "Customer"] as const;

export default function ApertureProductPlaybooks() {
  const [cat, setCat] = useState<typeof CATS[number]>("All");
  const [q, setQ] = useState("");

  const items = useMemo(() => {
    return PLAYBOOKS.filter(p => cat === "All" || p.category === cat)
      .filter(p => !q || (p.title + p.summary).toLowerCase().includes(q.toLowerCase()));
  }, [cat, q]);

  return (
    <>
      <Helmet>
        <title>Playbooks · Aperture</title>
        <meta name="description" content="Browse and run Aperture playbooks — connected workflows grounded in your business data." />
      </Helmet>
      <AppShell>
        <PageHeader
          index="01 · LIBRARY"
          title="Playbooks"
          sub="Pre-built workflows that read from your connected sources and produce finished work."
          action={<ApertureButton variant="accent">+ New playbook</ApertureButton>}
        />

        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 4, padding: 4, background: "var(--ap-surface-1)", border: "1px solid var(--ap-hairline)", borderRadius: 999 }}>
            {CATS.map(c => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className="ap-mono"
                style={{
                  appearance: "none", cursor: "pointer", border: "none",
                  padding: "6px 12px",
                  fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em",
                  background: cat === c ? "var(--ap-surface-3)" : "transparent",
                  color: cat === c ? "var(--ap-ink-1)" : "var(--ap-ink-3)",
                  borderRadius: 999,
                }}
              >{c}</button>
            ))}
          </div>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search playbooks…"
            style={{
              flex: 1, minWidth: 200,
              appearance: "none", border: "1px solid var(--ap-hairline)",
              background: "var(--ap-surface-1)",
              color: "var(--ap-ink-1)",
              padding: "10px 14px",
              borderRadius: "var(--ap-radius-sm)",
              fontSize: 13,
              fontFamily: "var(--ap-font-sans)",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
          {items.map(p => (
            <Link key={p.slug} to={`/aperture/app/playbooks/${p.slug}`} style={{ textDecoration: "none" }}>
              <ApertureCard padding={20} style={{ height: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <ApertureMonoLabel>{p.index} · {p.category}</ApertureMonoLabel>
                  {p.suggested && <ApertureChip tone="signal">Suggested</ApertureChip>}
                </div>
                <div>
                  <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 600, color: "var(--ap-ink-1)", letterSpacing: "-0.015em" }}>{p.title}</h3>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--ap-ink-2)", lineHeight: 1.5 }}>{p.summary}</p>
                </div>
                <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--ap-hairline)" }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {p.sources.map(s => {
                      const it = INTEGRATIONS.find(x => x.slug === s);
                      return it ? <ApertureIntegrationDot key={s} color={it.color} size={7} status="live" /> : null;
                    })}
                    <ApertureMonoLabel style={{ marginLeft: 4 }}>{p.cadence}</ApertureMonoLabel>
                  </div>
                  <ApertureMonoLabel style={{ color: "var(--ap-signal)" }}>Run →</ApertureMonoLabel>
                </div>
              </ApertureCard>
            </Link>
          ))}
        </div>
      </AppShell>
    </>
  );
}