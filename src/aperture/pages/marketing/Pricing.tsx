import { Helmet } from "react-helmet-async";
import { MarketingShell, MarketingSection } from "@/aperture/components/marketing/MarketingShell";
import {
  ApertureCard, ApertureButton, ApertureMonoLabel, ApertureSectionTitle, ApertureChip,
} from "@/aperture/components/primitives";

const TIERS = [
  {
    name: "Starter", price: "Free", cadence: "forever",
    pitch: "One integration, one playbook. Try the loop.",
    features: ["1 integration", "1 playbook", "Business Memory (basic)", "Community support"],
    cta: "Get started", variant: "default" as const,
  },
  {
    name: "Operator", price: "$49", cadence: "per month",
    pitch: "All integrations, unlimited playbooks. Built for founders.",
    features: ["All integrations", "Unlimited playbooks", "Grounded chat", "Document memory", "Email + chat support"],
    cta: "Start 14-day trial", variant: "accent" as const, featured: true,
  },
  {
    name: "Team", price: "$149", cadence: "per month",
    pitch: "Multi-seat with shared memory and roles.",
    features: ["Everything in Operator", "Up to 5 seats", "Shared business memory", "SAML / SSO", "Priority support"],
    cta: "Talk to us", variant: "default" as const,
  },
];

export default function AperturePricing() {
  return (
    <>
      <Helmet>
        <title>Pricing — Aperture</title>
        <meta name="description" content="Simple pricing for Aperture. Start free with one integration. Upgrade when you want every playbook." />
        <link rel="canonical" href="/aperture/pricing" />
      </Helmet>
      <MarketingShell>
        <MarketingSection pad="80px 24px 32px">
          <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 720 }}>
            <ApertureChip tone="signal">PRICING</ApertureChip>
            <h1 style={{ margin: 0, fontSize: "clamp(36px, 5vw, 52px)", lineHeight: 1.05, letterSpacing: "-0.03em", fontWeight: 600, color: "var(--ap-ink-1)" }}>
              Pay for output, not seats of dashboards.
            </h1>
            <p style={{ margin: 0, fontSize: 17, color: "var(--ap-ink-2)" }}>
              Start free. Upgrade when one finished playbook saves you a workday.
            </p>
          </div>
        </MarketingSection>

        <MarketingSection pad="16px 24px 32px">
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14,
          }}>
            {TIERS.map(t => (
              <ApertureCard key={t.name} padding={28} raised={!!t.featured}
                style={t.featured ? { borderColor: "var(--ap-signal)" } : undefined}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <ApertureMonoLabel>{t.name.toUpperCase()}</ApertureMonoLabel>
                  {t.featured && <ApertureChip tone="signal">RECOMMENDED</ApertureChip>}
                </div>
                <div style={{ marginTop: 16, display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.03em", color: "var(--ap-ink-1)" }}>{t.price}</span>
                  <span style={{ fontSize: 13, color: "var(--ap-ink-3)" }}>{t.cadence}</span>
                </div>
                <p style={{ margin: "10px 0 18px", fontSize: 13.5, color: "var(--ap-ink-2)" }}>{t.pitch}</p>
                <ApertureButton variant={t.variant} style={{ width: "100%" }}>{t.cta}</ApertureButton>
                <ul style={{ marginTop: 22, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                  {t.features.map(f => (
                    <li key={f} style={{ fontSize: 13.5, color: "var(--ap-ink-1)", display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ color: "var(--ap-signal)", fontFamily: "var(--ap-font-mono)" }}>+</span>{f}
                    </li>
                  ))}
                </ul>
              </ApertureCard>
            ))}
          </div>
        </MarketingSection>

        <MarketingSection pad="48px 24px 32px">
          <ApertureSectionTitle index="FAQ" title="Common questions" />
          <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            {[
              { q: "Is my data safe?", a: "Read-only by default. Every connection uses OAuth scopes limited to what a playbook actually needs. SOC 2 in progress." },
              { q: "What if I need a custom playbook?", a: "Operator and Team can write custom playbooks in plain English. We'll help you wire it up." },
              { q: "Can I export everything?", a: "Yes. Memory, playbooks, and run outputs export to JSON or Markdown at any time." },
              { q: "Do you charge per playbook run?", a: "No. Operator is unlimited runs. We may rate-limit at extreme volume — we'll always tell you first." },
            ].map(f => (
              <ApertureCard key={f.q} padding={22}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--ap-ink-1)" }}>{f.q}</h3>
                <p style={{ margin: "8px 0 0", fontSize: 13.5, color: "var(--ap-ink-2)", lineHeight: 1.55 }}>{f.a}</p>
              </ApertureCard>
            ))}
          </div>
        </MarketingSection>
      </MarketingShell>
    </>
  );
}