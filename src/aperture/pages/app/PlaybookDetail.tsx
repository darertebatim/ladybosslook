import { Helmet } from "react-helmet-async";
import { Link, useParams, Navigate } from "react-router-dom";
import { useState } from "react";
import { AppShell } from "@/aperture/components/AppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureCard, ApertureButton, ApertureChip,
  ApertureIntegrationDot, ApertureMonoLabel,
} from "@/aperture/components/primitives";
import { getPlaybook } from "@/aperture/data/playbooks";
import { getIntegration } from "@/aperture/data/integrations";

function LivePulse() {
  return <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--ap-live)", display: "inline-block" }} className="ap-pulse" />;
}

export default function PlaybookDetail() {
  const { slug } = useParams();
  const p = slug ? getPlaybook(slug) : undefined;
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  if (!p) return <Navigate to="/aperture/app/playbooks" replace />;

  function run() {
    setRunning(true);
    setDone(false);
    setTimeout(() => { setRunning(false); setDone(true); }, 1400);
  }

  return (
    <>
      <Helmet>
        <title>{p.title} · Aperture</title>
        <meta name="description" content={p.summary} />
      </Helmet>
      <AppShell>
        <Link to="/aperture/app/playbooks" style={{ textDecoration: "none", color: "var(--ap-ink-3)", fontSize: 12, fontFamily: "var(--ap-font-mono)", textTransform: "uppercase", letterSpacing: "0.12em", display: "inline-block", marginBottom: 16 }}>
          ← Playbooks
        </Link>
        <PageHeader
          index={`${p.index} · ${p.category.toUpperCase()}`}
          title={p.title}
          sub={p.summary}
          action={
            <ApertureButton variant="accent" onClick={run} disabled={running}>
              {running ? "Running…" : "Run playbook"}
            </ApertureButton>
          }
        />

        {/* Source strip */}
        <ApertureCard padding={16} style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <ApertureMonoLabel>Sources</ApertureMonoLabel>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {p.sources.map(s => {
              const it = getIntegration(s);
              if (!it) return null;
              return (
                <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "var(--ap-surface-2)", border: "1px solid var(--ap-hairline)", borderRadius: 999, fontSize: 12, color: "var(--ap-ink-1)" }}>
                  <ApertureIntegrationDot color={it.color} size={7} status="live" />
                  {it.name}
                </span>
              );
            })}
          </div>
          <span style={{ marginLeft: "auto" }}>
            <ApertureChip tone="live" icon={<LivePulse />}>Live · 2m ago</ApertureChip>
          </span>
        </ApertureCard>

        {/* Steps */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <ApertureCard padding={20}>
            <ApertureMonoLabel>Steps</ApertureMonoLabel>
            <ol style={{ listStyle: "none", padding: 0, margin: "16px 0 0", display: "flex", flexDirection: "column", gap: 14 }}>
              {p.steps.map((s, i) => (
                <li key={i} style={{ display: "flex", gap: 14 }}>
                  <span style={{ fontFamily: "var(--ap-font-mono)", fontSize: 11, color: "var(--ap-signal)", paddingTop: 2, minWidth: 24 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div style={{ fontSize: 13.5, color: "var(--ap-ink-1)", fontWeight: 500 }}>{s.label}</div>
                    <div style={{ fontSize: 12.5, color: "var(--ap-ink-2)", lineHeight: 1.5 }}>{s.detail}</div>
                  </div>
                </li>
              ))}
            </ol>
          </ApertureCard>

          <ApertureCard padding={20} raised={done}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <ApertureMonoLabel>{done ? "Output · Just now" : running ? "Running…" : "Last output"}</ApertureMonoLabel>
              {running && <LivePulse />}
            </div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "var(--ap-signal)", letterSpacing: "-0.015em" }}>
              {p.output.headline}
            </h3>
            <p style={{ margin: "10px 0 0", fontSize: 14, color: "var(--ap-ink-1)", lineHeight: 1.6 }}>{p.output.body}</p>
            {p.output.bullets && (
              <ul style={{ margin: "14px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {p.output.bullets.map((b, i) => (
                  <li key={i} style={{ fontSize: 13, color: "var(--ap-ink-2)", fontFamily: "var(--ap-font-mono)", paddingLeft: 14, position: "relative" }}>
                    <span style={{ position: "absolute", left: 0, top: 6, width: 6, height: 1, background: "var(--ap-ink-3)" }} />
                    {b}
                  </li>
                ))}
              </ul>
            )}
            <div style={{ marginTop: 18, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <ApertureButton variant="default" size="sm">Copy</ApertureButton>
              <ApertureButton variant="default" size="sm">Send to Slack</ApertureButton>
              <ApertureButton variant="ghost" size="sm">Refine in chat</ApertureButton>
            </div>
          </ApertureCard>
        </div>
      </AppShell>
    </>
  );
}