import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { MarketingShell, MarketingSection } from "@/aperture/components/marketing/MarketingShell";
import {
  ApertureButton, ApertureCard, ApertureChip, ApertureMonoLabel,
  ApertureIntegrationDot, ApertureSectionTitle,
} from "@/aperture/components/primitives";
import { ApertureLogo } from "@/aperture/brand/ApertureLogo";
import { INTEGRATIONS, getIntegration } from "@/aperture/data/integrations";
import { PLAYBOOKS } from "@/aperture/data/playbooks";

export default function ApertureLanding() {
  return (
    <>
      <Helmet>
        <title>Aperture — Your business memory, put to work</title>
        <meta name="description" content="Aperture connects your business tools into a single, grounded memory — and runs playbooks that turn that memory into finished work." />
        <link rel="canonical" href="/aperture" />
      </Helmet>
      <MarketingShell>
        {/* ============ HERO ============ */}
        <MarketingSection pad="96px 24px 64px">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 24, maxWidth: 820 }}>
            <ApertureChip tone="signal">PRIVATE BETA · BY INVITE</ApertureChip>
            <h1 style={{
              margin: 0, fontSize: "clamp(40px, 6vw, 64px)", lineHeight: 1.04,
              letterSpacing: "-0.035em", fontWeight: 600, color: "var(--ap-ink-1)",
            }}>
              Your business has a memory.<br />
              <span style={{ color: "var(--ap-ink-2)" }}>Aperture is how you use it.</span>
            </h1>
            <p style={{ margin: 0, fontSize: 18, lineHeight: 1.55, color: "var(--ap-ink-2)", maxWidth: 620 }}>
              Aperture connects Stripe, Shopify, QuickBooks, Instagram and more into one grounded memory —
              then runs playbooks that turn that memory into finished work.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
              <ApertureButton variant="accent">Join waitlist</ApertureButton>
              <Link to="/aperture/playbooks" style={{ textDecoration: "none" }}>
                <ApertureButton variant="default">See a playbook →</ApertureButton>
              </Link>
            </div>
          </div>

          {/* live demo strip */}
          <DemoStrip />
        </MarketingSection>

        {/* ============ HOW IT WORKS ============ */}
        <MarketingSection pad="48px 24px 80px">
          <ApertureSectionTitle index="01 · HOW IT WORKS" title="Three steps to finished work" />
          <div style={{
            marginTop: 32, display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16,
          }}>
            {[
              { step: "STEP 01", title: "Connect your tools", body: "Stripe, Shopify, QuickBooks, Instagram, Square, GA4, Meta Ads. Read-only by default." },
              { step: "STEP 02", title: "Pick a playbook", body: "Choose from a library of revenue, marketing, ops, and customer playbooks. Or write your own." },
              { step: "STEP 03", title: "Get finished work", body: "A digest, a draft post, a reconciled list — grounded in your real data, ready to ship." },
            ].map((s) => (
              <ApertureCard key={s.step} padding={24}>
                <ApertureMonoLabel>{s.step}</ApertureMonoLabel>
                <h3 style={{ margin: "10px 0 6px", fontSize: 18, fontWeight: 600, color: "var(--ap-ink-1)", letterSpacing: "-0.015em" }}>{s.title}</h3>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "var(--ap-ink-2)" }}>{s.body}</p>
              </ApertureCard>
            ))}
          </div>
        </MarketingSection>

        {/* ============ PLAYBOOK GALLERY ============ */}
        <MarketingSection pad="32px 24px 80px">
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <ApertureSectionTitle index="02 · PLAYBOOKS" title="Six playbooks to start with" sub="Each one is a chain of steps that reads your data and writes finished output." />
            <Link to="/aperture/playbooks" style={{ textDecoration: "none" }}>
              <ApertureButton variant="ghost" size="sm">Browse all →</ApertureButton>
            </Link>
          </div>
          <div style={{
            marginTop: 24, display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14,
          }}>
            {PLAYBOOKS.map(pb => (
              <ApertureCard key={pb.slug} padding={20}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <ApertureMonoLabel>{pb.index} · {pb.category.toUpperCase()}</ApertureMonoLabel>
                  <ApertureMonoLabel>{pb.cadence.toUpperCase()}</ApertureMonoLabel>
                </div>
                <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 600, color: "var(--ap-ink-1)" }}>{pb.title}</h3>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--ap-ink-2)" }}>{pb.summary}</p>
                <div style={{ marginTop: 14, display: "flex", gap: 6, alignItems: "center" }}>
                  {pb.sources.map(s => {
                    const it = getIntegration(s);
                    return it ? <ApertureIntegrationDot key={s} color={it.color} size={7} /> : null;
                  })}
                  <span style={{ fontSize: 11.5, color: "var(--ap-ink-3)", marginLeft: 4 }}>
                    {pb.sources.map(s => getIntegration(s)?.name).filter(Boolean).join(" + ")}
                  </span>
                </div>
              </ApertureCard>
            ))}
          </div>
        </MarketingSection>

        {/* ============ INTEGRATIONS GRID ============ */}
        <MarketingSection pad="32px 24px 80px">
          <ApertureSectionTitle index="03 · INTEGRATIONS" title="Where your business already lives" />
          <div style={{
            marginTop: 24, display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8,
          }}>
            {INTEGRATIONS.map(i => (
              <div key={i.slug} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px", borderRadius: "var(--ap-radius-sm)",
                background: "var(--ap-surface-1)", border: "1px solid var(--ap-hairline)",
              }}>
                <ApertureIntegrationDot color={i.color} status={i.status === "off" ? "off" : "live"} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, color: "var(--ap-ink-1)", fontWeight: 500 }}>{i.name}</div>
                  <div className="ap-mono" style={{ fontSize: 10, color: "var(--ap-ink-3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                    {i.status === "soon" ? "Coming soon" : i.status === "beta" ? "Beta" : i.status === "off" ? "Available" : "Live"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </MarketingSection>

        {/* ============ WHY APERTURE ============ */}
        <MarketingSection pad="32px 24px 80px">
          <ApertureSectionTitle index="04 · WHY APERTURE" title="Not a chatbot. Not a dashboard." />
          <div style={{
            marginTop: 24, display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14,
          }}>
            {[
              { vs: "VS. GENERIC AI", title: "Grounded, not guessing", body: "Every answer cites which source it came from. No invented numbers, no stale advice." },
              { vs: "VS. DASHBOARDS", title: "Output, not charts", body: "Aperture writes the digest, drafts the post, builds the list. You ship — instead of interpreting." },
              { vs: "VS. ANOTHER TOOL", title: "One memory, every workflow", body: "Stop re-explaining your business. Aperture remembers, so every playbook gets sharper over time." },
            ].map(c => (
              <ApertureCard key={c.vs} padding={24}>
                <ApertureMonoLabel color="var(--ap-signal)">{c.vs}</ApertureMonoLabel>
                <h3 style={{ margin: "10px 0 6px", fontSize: 18, fontWeight: 600, color: "var(--ap-ink-1)", letterSpacing: "-0.015em" }}>{c.title}</h3>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "var(--ap-ink-2)" }}>{c.body}</p>
              </ApertureCard>
            ))}
          </div>
        </MarketingSection>

        {/* ============ CTA STRIP ============ */}
        <MarketingSection pad="32px 24px 96px">
          <ApertureCard padding={48} style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <ApertureLogo size={36} color="var(--ap-signal)" />
            <h2 style={{ margin: 0, fontSize: 32, fontWeight: 600, letterSpacing: "-0.025em", color: "var(--ap-ink-1)", maxWidth: 540 }}>
              Stop guessing. Start running your business with its own memory.
            </h2>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              <ApertureButton variant="accent">Join waitlist</ApertureButton>
              <Link to="/aperture/pricing" style={{ textDecoration: "none" }}>
                <ApertureButton variant="default">See pricing</ApertureButton>
              </Link>
            </div>
          </ApertureCard>
        </MarketingSection>
      </MarketingShell>
    </>
  );
}

/* ---- LIVE DEMO STRIP ---- */
function DemoStrip() {
  const pb = PLAYBOOKS[0];
  return (
    <ApertureCard padding={0} style={{ marginTop: 56, overflow: "hidden" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px", borderBottom: "1px solid var(--ap-hairline)",
        background: "var(--ap-surface-2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ApertureMonoLabel>RUN · {pb.index}</ApertureMonoLabel>
          <span style={{ fontSize: 13.5, color: "var(--ap-ink-1)", fontWeight: 500 }}>{pb.title}</span>
        </div>
        <ApertureChip tone="live"><span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--ap-live)" }} />LIVE · 2M AGO</ApertureChip>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr" }}>
        <div style={{ padding: 22, borderRight: "1px solid var(--ap-hairline)", background: "var(--ap-surface-1)" }}>
          <ApertureMonoLabel>SOURCES</ApertureMonoLabel>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {pb.sources.map(s => {
              const it = getIntegration(s);
              return it ? (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ApertureIntegrationDot color={it.color} />
                  <div style={{ flex: 1, fontSize: 13, color: "var(--ap-ink-1)" }}>{it.name}</div>
                  <ApertureMonoLabel>{it.lastSync}</ApertureMonoLabel>
                </div>
              ) : null;
            })}
          </div>
          <div style={{ marginTop: 22 }}><ApertureMonoLabel>STEPS</ApertureMonoLabel></div>
          <ol style={{ marginTop: 10, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {pb.steps.map((s, i) => (
              <li key={s.label} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                <span className="ap-mono" style={{ fontSize: 10, color: "var(--ap-ink-3)" }}>0{i + 1}</span>
                <span style={{ fontSize: 13, color: "var(--ap-ink-1)" }}>{s.label}</span>
              </li>
            ))}
          </ol>
        </div>
        <div style={{ padding: 22 }}>
          <ApertureMonoLabel>OUTPUT</ApertureMonoLabel>
          <h3 style={{ margin: "10px 0 8px", fontSize: 20, fontWeight: 600, color: "var(--ap-ink-1)", letterSpacing: "-0.02em" }}>{pb.output.headline}</h3>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "var(--ap-ink-2)" }}>{pb.output.body}</p>
          {pb.output.bullets && (
            <ul style={{ marginTop: 14, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
              {pb.output.bullets.map(b => (
                <li key={b} className="ap-mono" style={{ fontSize: 12, color: "var(--ap-ink-2)", display: "flex", gap: 8 }}>
                  <span style={{ color: "var(--ap-signal)" }}>›</span>{b}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ApertureCard>
  );
}