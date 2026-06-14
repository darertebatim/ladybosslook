import { Helmet } from "react-helmet-async";
import { MarketingShell, MarketingSection } from "@/aperture/components/marketing/MarketingShell";
import { ApertureMonoLabel, ApertureChip } from "@/aperture/components/primitives";

export default function ApertureManifesto() {
  return (
    <>
      <Helmet>
        <title>Manifesto — Aperture</title>
        <meta name="description" content="Software should produce finished work, not more dashboards. The Aperture manifesto." />
        <link rel="canonical" href="/aperture/manifesto" />
      </Helmet>
      <MarketingShell>
        <MarketingSection pad="96px 24px 48px">
          <div style={{ maxWidth: 720 }}>
            <ApertureChip tone="signal">MANIFESTO</ApertureChip>
            <h1 style={{ margin: "18px 0 24px", fontSize: "clamp(40px, 6vw, 56px)", lineHeight: 1.05, letterSpacing: "-0.03em", fontWeight: 600, color: "var(--ap-ink-1)" }}>
              We don't need more dashboards.
            </h1>
            <Body />
          </div>
        </MarketingSection>
      </MarketingShell>
    </>
  );
}

function Body() {
  const P = ({ children }: { children: React.ReactNode }) => (
    <p style={{ margin: "0 0 18px", fontSize: 17, lineHeight: 1.7, color: "var(--ap-ink-2)" }}>{children}</p>
  );
  const H = ({ children, idx }: { children: React.ReactNode; idx: string }) => (
    <div style={{ marginTop: 36, marginBottom: 12 }}>
      <ApertureMonoLabel>{idx}</ApertureMonoLabel>
      <h2 style={{ margin: "8px 0 0", fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--ap-ink-1)" }}>{children}</h2>
    </div>
  );
  return (
    <>
      <P>For twenty years, business software has handed founders charts and told them to figure it out. Aperture starts from a different premise: <strong style={{ color: "var(--ap-ink-1)", fontWeight: 600 }}>your business already knows what to do next</strong>. It's encoded in your Stripe, your Shopify, your QuickBooks, your Instagram. The problem isn't a lack of data. It's that the memory is scattered and the output is missing.</P>
      <H idx="01">Memory before features</H>
      <P>Every Aperture decision starts with one question: does this make the business memory richer, or does it add another tab? If it adds a tab, we don't ship it.</P>
      <H idx="02">Output, not interpretation</H>
      <P>A chart is a question. A draft is an answer. Aperture writes the answer — the digest, the email, the reconciled list — and cites which source it came from so you can trust it.</P>
      <H idx="03">Read-only by default</H>
      <P>Aperture asks for the narrowest possible scope, and never writes back to a connected tool unless a playbook explicitly says so. Your data is yours.</P>
      <H idx="04">Quiet power</H>
      <P>No dancing AI mascots. No "✨ magic". Aperture is precision-instrument software for people running real businesses. The interface gets out of the way so the work can show up.</P>
    </>
  );
}