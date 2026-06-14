import { Helmet } from "react-helmet-async";
import { AppShell } from "@/aperture/components/AppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureCard, ApertureButton, ApertureChip, ApertureMonoLabel, ApertureIntegrationDot,
} from "@/aperture/components/primitives";
import { INTEGRATIONS } from "@/aperture/data/integrations";

const CATS = ["Payments", "Commerce", "Accounting", "Social", "CRM", "Analytics", "Ads"] as const;

export default function ApertureIntegrations() {
  return (
    <>
      <Helmet>
        <title>Integrations · Aperture</title>
        <meta name="description" content="Connect Aperture to Stripe, Square, Shopify, QuickBooks, Instagram, and more." />
      </Helmet>
      <AppShell>
        <PageHeader
          index="04 · INTEGRATIONS"
          title="Connect your stack"
          sub="Every connection becomes grounding context for chat and playbooks."
        />

        {CATS.map(cat => {
          const items = INTEGRATIONS.filter(i => i.category === cat);
          if (!items.length) return null;
          return (
            <section key={cat} style={{ marginBottom: 28 }}>
              <ApertureMonoLabel style={{ marginBottom: 10, display: "block" }}>{cat}</ApertureMonoLabel>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                {items.map(i => {
                  const connected = i.status === "live" || i.status === "syncing";
                  return (
                    <ApertureCard key={i.slug} padding={16} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${i.color}22`, color: i.color, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                          {i.name[0]}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, color: "var(--ap-ink-1)", fontWeight: 600 }}>{i.name}</div>
                          <div style={{ fontSize: 11.5, color: "var(--ap-ink-3)" }}>{i.category}</div>
                        </div>
                        {i.status === "live" && <ApertureChip tone="live" icon={<ApertureIntegrationDot color="var(--ap-live)" size={5} status="live" />}>Live</ApertureChip>}
                        {i.status === "syncing" && <ApertureChip tone="neutral">Syncing</ApertureChip>}
                        {i.status === "beta" && <ApertureChip tone="signal">Beta</ApertureChip>}
                        {i.status === "soon" && <ApertureChip tone="neutral">Soon</ApertureChip>}
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--ap-ink-2)", lineHeight: 1.5, minHeight: 36 }}>
                        {i.signal ?? "Not connected yet."}
                      </div>
                      <ApertureButton variant={connected ? "default" : "accent"} size="sm">
                        {connected ? "Manage" : i.status === "soon" ? "Notify me" : "Connect"}
                      </ApertureButton>
                    </ApertureCard>
                  );
                })}
              </div>
            </section>
          );
        })}
      </AppShell>
    </>
  );
}