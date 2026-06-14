import { Helmet } from "react-helmet-async";
import { MarketingShell, MarketingSection } from "@/aperture/components/marketing/MarketingShell";
import {
  ApertureCard, ApertureMonoLabel, ApertureChip, ApertureIntegrationDot,
} from "@/aperture/components/primitives";
import { INTEGRATIONS } from "@/aperture/data/integrations";

export default function ApertureIntegrationsPublic() {
  const byCat = INTEGRATIONS.reduce<Record<string, typeof INTEGRATIONS>>((acc, i) => {
    (acc[i.category] ||= []).push(i); return acc;
  }, {});
  return (
    <>
      <Helmet>
        <title>Integrations — Aperture</title>
        <meta name="description" content="Aperture connects to Stripe, Shopify, QuickBooks, Instagram, Square, GA4, Salesforce, HubSpot, and Meta Ads — read-only by default." />
        <link rel="canonical" href="/aperture/integrations" />
      </Helmet>
      <MarketingShell>
        <MarketingSection pad="80px 24px 32px">
          <ApertureChip tone="signal">INTEGRATIONS</ApertureChip>
          <h1 style={{ margin: "16px 0 12px", fontSize: "clamp(36px, 5vw, 52px)", lineHeight: 1.05, letterSpacing: "-0.03em", fontWeight: 600, color: "var(--ap-ink-1)" }}>
            Where your business already lives.
          </h1>
          <p style={{ margin: 0, fontSize: 17, color: "var(--ap-ink-2)", maxWidth: 640 }}>
            Connect once. Aperture reads with the minimum scope, syncs continuously, and never writes back unless a playbook explicitly asks.
          </p>
        </MarketingSection>

        <MarketingSection pad="16px 24px 32px">
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {Object.entries(byCat).map(([cat, items]) => (
              <div key={cat}>
                <ApertureMonoLabel>{cat.toUpperCase()}</ApertureMonoLabel>
                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                  {items.map(i => (
                    <ApertureCard key={i.slug} padding={16}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <ApertureIntegrationDot color={i.color} status={i.status === "off" ? "off" : "live"} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, color: "var(--ap-ink-1)", fontWeight: 500 }}>{i.name}</div>
                          <div className="ap-mono" style={{ fontSize: 10, color: "var(--ap-ink-3)", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 2 }}>
                            {i.status === "beta" ? "Beta" : i.status === "off" ? "Available" : i.status === "soon" ? "Coming soon" : "Live"}
                          </div>
                        </div>
                      </div>
                    </ApertureCard>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </MarketingSection>
      </MarketingShell>
    </>
  );
}