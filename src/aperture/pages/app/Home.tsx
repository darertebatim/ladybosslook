import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { AppShell } from "@/aperture/components/AppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureCard, ApertureButton, ApertureChip,
  ApertureIntegrationDot, ApertureMonoLabel,
} from "@/aperture/components/primitives";
import { INTEGRATIONS } from "@/aperture/data/integrations";
import { PLAYBOOKS } from "@/aperture/data/playbooks";
import { MEMORY_FACTS, BUSINESS_PROFILE } from "@/aperture/data/memory";

function LivePulse() {
  return <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--ap-live)", display: "inline-block" }} className="ap-pulse" />;
}

function TrendArrow({ trend }: { trend?: "up" | "down" | "flat" }) {
  if (!trend || trend === "flat") return <span style={{ color: "var(--ap-ink-3)" }}>—</span>;
  return (
    <span style={{ color: trend === "up" ? "var(--ap-live)" : "var(--ap-danger)", fontSize: 12 }}>
      {trend === "up" ? "▲" : "▼"}
    </span>
  );
}

export default function ApertureHome() {
  const suggested = PLAYBOOKS.filter(p => p.suggested);
  const recent = PLAYBOOKS.slice(0, 4);

  return (
    <>
      <Helmet>
        <title>Today · Aperture</title>
        <meta name="description" content="Today's business pulse — revenue, integrations, and suggested playbooks to run." />
      </Helmet>
      <AppShell
        rightRail={
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <ApertureMonoLabel>Business memory</ApertureMonoLabel>
              <h3 style={{ margin: "10px 0 2px", fontSize: 16, color: "var(--ap-ink-1)", fontWeight: 600 }}>{BUSINESS_PROFILE.name}</h3>
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--ap-ink-2)" }}>{BUSINESS_PROFILE.tagline}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "1px solid var(--ap-hairline)", borderRadius: "var(--ap-radius-sm)", overflow: "hidden" }}>
              {MEMORY_FACTS.slice(0, 6).map((f, i) => (
                <div key={f.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 12px", borderTop: i === 0 ? "none" : "1px solid var(--ap-hairline)", background: "var(--ap-surface-1)" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 11, color: "var(--ap-ink-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{f.label}</span>
                    <span style={{ fontSize: 13.5, color: "var(--ap-ink-1)", fontFamily: "var(--ap-font-mono)", fontWeight: 500 }}>{f.value}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <TrendArrow trend={f.trend} />
                    {f.delta && <span style={{ fontSize: 11, color: "var(--ap-ink-3)" }}>{f.delta}</span>}
                  </div>
                </div>
              ))}
            </div>
            <Link to="/aperture/app/memory" style={{ fontSize: 12, color: "var(--ap-signal)", textDecoration: "none", fontFamily: "var(--ap-font-mono)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Open memory →
            </Link>
          </div>
        }
      >
        <PageHeader
          index="00 · TODAY"
          title="Today's pulse"
          sub={`Monday — ${INTEGRATIONS.filter(i => i.status === "live").length} of ${INTEGRATIONS.length} sources live.`}
          action={
            <Link to="/aperture/app/playbooks">
              <ApertureButton variant="ghost">Browse playbooks</ApertureButton>
            </Link>
          }
        />

        {/* Hero suggestion */}
        {suggested[0] && (
          <ApertureCard raised padding={24} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <ApertureChip tone="signal">Suggested for today</ApertureChip>
              <ApertureChip tone="live" icon={<LivePulse />}>Live · 2m ago</ApertureChip>
            </div>
            <h2 style={{ margin: "14px 0 6px", fontSize: 22, fontWeight: 600, color: "var(--ap-ink-1)", letterSpacing: "-0.02em" }}>
              {suggested[0].title}
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: "var(--ap-ink-2)", lineHeight: 1.55 }}>{suggested[0].summary}</p>
            <div style={{ marginTop: 16, padding: 14, background: "var(--ap-surface-2)", borderRadius: "var(--ap-radius-sm)", border: "1px solid var(--ap-hairline)" }}>
              <ApertureMonoLabel>Preview</ApertureMonoLabel>
              <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--ap-ink-1)", lineHeight: 1.5 }}>
                <strong style={{ color: "var(--ap-signal)" }}>{suggested[0].output.headline}</strong>{" "}
                <span style={{ color: "var(--ap-ink-2)" }}>{suggested[0].output.body}</span>
              </p>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <Link to={`/aperture/app/playbooks/${suggested[0].slug}`}>
                <ApertureButton variant="accent">Run now</ApertureButton>
              </Link>
              <Link to={`/aperture/app/playbooks/${suggested[0].slug}`}>
                <ApertureButton variant="ghost">See steps</ApertureButton>
              </Link>
            </div>
          </ApertureCard>
        )}

        {/* Source pulse */}
        <div style={{ marginBottom: 32 }}>
          <ApertureMonoLabel>Connected sources</ApertureMonoLabel>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            {INTEGRATIONS.slice(0, 6).map(i => (
              <div key={i.slug} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--ap-surface-1)", border: "1px solid var(--ap-hairline)", borderRadius: "var(--ap-radius-sm)" }}>
                <ApertureIntegrationDot color={i.color} status={i.status === "off" ? "off" : i.status === "syncing" ? "syncing" : "live"} />
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: 13, color: "var(--ap-ink-1)", fontWeight: 500 }}>{i.name}</span>
                  <span style={{ fontSize: 11.5, color: "var(--ap-ink-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{i.signal}</span>
                </div>
                <ApertureMonoLabel>{i.lastSync}</ApertureMonoLabel>
              </div>
            ))}
          </div>
        </div>

        {/* Recent runs */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <ApertureMonoLabel>Recent activity</ApertureMonoLabel>
            <Link to="/aperture/app/playbooks" style={{ fontSize: 12, color: "var(--ap-ink-3)", textDecoration: "none", fontFamily: "var(--ap-font-mono)", textTransform: "uppercase", letterSpacing: "0.12em" }}>All →</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", border: "1px solid var(--ap-hairline)", borderRadius: "var(--ap-radius-sm)", overflow: "hidden" }}>
            {recent.map((p, i) => (
              <Link key={p.slug} to={`/aperture/app/playbooks/${p.slug}`} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderTop: i === 0 ? "none" : "1px solid var(--ap-hairline)", background: "var(--ap-surface-1)", textDecoration: "none" }}>
                <ApertureMonoLabel style={{ color: "var(--ap-ink-3)", minWidth: 22 }}>{p.index}</ApertureMonoLabel>
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: 14, color: "var(--ap-ink-1)", fontWeight: 500 }}>{p.title}</span>
                  <span style={{ fontSize: 12, color: "var(--ap-ink-3)" }}>{p.cadence} · last run {p.lastRun ?? "—"}</span>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {p.sources.slice(0, 3).map(s => {
                    const it = INTEGRATIONS.find(x => x.slug === s);
                    return it ? <ApertureIntegrationDot key={s} color={it.color} size={7} status="live" /> : null;
                  })}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </AppShell>
    </>
  );
}