import { Helmet } from "react-helmet-async";
import { AppShell } from "@/aperture/components/AppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureCard, ApertureButton, ApertureMonoLabel, ApertureIntegrationDot,
} from "@/aperture/components/primitives";
import { MEMORY_FACTS, MEMORY_DOCS, BUSINESS_PROFILE } from "@/aperture/data/memory";
import { INTEGRATIONS, getIntegration } from "@/aperture/data/integrations";

export default function ApertureMemory() {
  return (
    <>
      <Helmet>
        <title>Memory · Aperture</title>
        <meta name="description" content="Your business memory — connected sources, key facts, and uploaded documents that ground every Aperture answer." />
      </Helmet>
      <AppShell>
        <PageHeader
          index="03 · MEMORY"
          title="Business memory"
          sub="Everything Aperture knows about your business. Used as grounding context in every chat and playbook run."
          action={<ApertureButton variant="default">+ Upload document</ApertureButton>}
        />

        <ApertureCard padding={20} style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "var(--ap-signal)", color: "var(--ap-on-signal)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 700,
          }}>M</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ap-ink-1)" }}>{BUSINESS_PROFILE.name}</div>
            <div style={{ fontSize: 13, color: "var(--ap-ink-2)" }}>{BUSINESS_PROFILE.tagline}</div>
          </div>
          <div style={{ display: "flex", gap: 18 }}>
            <div><ApertureMonoLabel>Founded</ApertureMonoLabel><div style={{ fontSize: 13.5, color: "var(--ap-ink-1)", marginTop: 2 }}>{BUSINESS_PROFILE.founded}</div></div>
            <div><ApertureMonoLabel>Team</ApertureMonoLabel><div style={{ fontSize: 13.5, color: "var(--ap-ink-1)", marginTop: 2 }}>{BUSINESS_PROFILE.team}</div></div>
            <div><ApertureMonoLabel>Stage</ApertureMonoLabel><div style={{ fontSize: 13.5, color: "var(--ap-ink-1)", marginTop: 2 }}>{BUSINESS_PROFILE.stage}</div></div>
          </div>
        </ApertureCard>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          {/* Connected sources */}
          <ApertureCard padding={20}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <ApertureMonoLabel>Connected sources</ApertureMonoLabel>
              <span style={{ fontSize: 11, color: "var(--ap-ink-3)", fontFamily: "var(--ap-font-mono)" }}>
                {INTEGRATIONS.filter(i => i.status === "live").length} / {INTEGRATIONS.length}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {INTEGRATIONS.map(i => (
                <div key={i.slug} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <ApertureIntegrationDot color={i.color} status={i.status === "off" ? "off" : i.status === "syncing" ? "syncing" : "live"} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: "var(--ap-ink-1)", fontWeight: 500 }}>{i.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ap-ink-3)" }}>{i.signal}</div>
                  </div>
                  <ApertureMonoLabel>{i.lastSync}</ApertureMonoLabel>
                </div>
              ))}
            </div>
          </ApertureCard>

          {/* Key facts */}
          <ApertureCard padding={20}>
            <ApertureMonoLabel>Key facts</ApertureMonoLabel>
            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, border: "1px solid var(--ap-hairline)", borderRadius: "var(--ap-radius-sm)", overflow: "hidden" }}>
              {MEMORY_FACTS.map((f, i) => {
                const it = getIntegration(f.source);
                const isRightCol = i % 2 === 1;
                const isFirstRow = i < 2;
                return (
                  <div key={f.label} style={{
                    padding: "12px 14px",
                    background: "var(--ap-surface-1)",
                    borderTop: isFirstRow ? "none" : "1px solid var(--ap-hairline)",
                    borderLeft: isRightCol ? "1px solid var(--ap-hairline)" : "none",
                  }}>
                    <div style={{ fontSize: 10.5, color: "var(--ap-ink-3)", textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 6 }}>
                      {it && <ApertureIntegrationDot color={it.color} size={5} status="live" />}
                      {f.label}
                    </div>
                    <div style={{ fontSize: 14, color: "var(--ap-ink-1)", fontFamily: "var(--ap-font-mono)", fontWeight: 500, marginTop: 4 }}>{f.value}</div>
                    {f.delta && <div style={{ fontSize: 10.5, color: f.trend === "down" ? "var(--ap-danger)" : "var(--ap-live)", marginTop: 2 }}>{f.delta}</div>}
                  </div>
                );
              })}
            </div>
          </ApertureCard>
        </div>

        {/* Documents */}
        <div style={{ marginTop: 18 }}>
          <ApertureCard padding={20}>
            <ApertureMonoLabel>Documents</ApertureMonoLabel>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", border: "1px solid var(--ap-hairline)", borderRadius: "var(--ap-radius-sm)", overflow: "hidden" }}>
              {MEMORY_DOCS.map((d, i) => (
                <div key={d.title} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--ap-surface-1)", borderTop: i === 0 ? "none" : "1px solid var(--ap-hairline)" }}>
                  <span style={{ fontFamily: "var(--ap-font-mono)", fontSize: 10, padding: "3px 6px", background: "var(--ap-surface-3)", color: "var(--ap-ink-2)", borderRadius: 4, minWidth: 36, textAlign: "center" }}>{d.kind}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, color: "var(--ap-ink-1)", fontWeight: 500 }}>{d.title}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ap-ink-3)" }}>{d.size} · {d.uploaded}</div>
                  </div>
                  <ApertureButton variant="ghost" size="sm">Open</ApertureButton>
                </div>
              ))}
            </div>
          </ApertureCard>
        </div>
      </AppShell>
    </>
  );
}