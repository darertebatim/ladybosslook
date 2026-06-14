import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { MarketingShell, MarketingSection } from "@/aperture/components/marketing/MarketingShell";
import {
  ApertureCard, ApertureMonoLabel, ApertureChip, ApertureIntegrationDot, ApertureButton,
} from "@/aperture/components/primitives";
import { PLAYBOOKS } from "@/aperture/data/playbooks";
import { getIntegration } from "@/aperture/data/integrations";

export default function AperturePlaybooksPublic() {
  return (
    <>
      <Helmet>
        <title>Playbooks — Aperture</title>
        <meta name="description" content="A growing library of Aperture playbooks: weekly digests, lapsed-customer lists, social drafts, board updates and more — all grounded in your real data." />
        <link rel="canonical" href="/aperture/playbooks" />
      </Helmet>
      <MarketingShell>
        <MarketingSection pad="80px 24px 32px">
          <ApertureChip tone="signal">PLAYBOOKS</ApertureChip>
          <h1 style={{ margin: "16px 0 12px", fontSize: "clamp(36px, 5vw, 52px)", lineHeight: 1.05, letterSpacing: "-0.03em", fontWeight: 600, color: "var(--ap-ink-1)" }}>
            Finished work, on a cadence.
          </h1>
          <p style={{ margin: 0, fontSize: 17, color: "var(--ap-ink-2)", maxWidth: 640 }}>
            Every playbook reads from your business memory and produces something you can ship — a digest, a post, a list, a reconciled report.
          </p>
        </MarketingSection>

        <MarketingSection pad="16px 24px 32px">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
            {PLAYBOOKS.map(pb => (
              <ApertureCard key={pb.slug} padding={22}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <ApertureMonoLabel>{pb.index} · {pb.category.toUpperCase()}</ApertureMonoLabel>
                  <ApertureMonoLabel>{pb.cadence.toUpperCase()}</ApertureMonoLabel>
                </div>
                <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 600, color: "var(--ap-ink-1)", letterSpacing: "-0.015em" }}>{pb.title}</h3>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "var(--ap-ink-2)" }}>{pb.summary}</p>
                <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 6 }}>
                  {pb.sources.map(s => {
                    const it = getIntegration(s); return it ? <ApertureIntegrationDot key={s} color={it.color} size={6} /> : null;
                  })}
                  <span style={{ fontSize: 11.5, color: "var(--ap-ink-3)", marginLeft: 4 }}>
                    {pb.sources.map(s => getIntegration(s)?.name).filter(Boolean).join(" · ")}
                  </span>
                </div>
              </ApertureCard>
            ))}
          </div>
          <div style={{ marginTop: 32, textAlign: "center" }}>
            <Link to="/aperture/app" style={{ textDecoration: "none" }}>
              <ApertureButton variant="accent">Open the app to run one →</ApertureButton>
            </Link>
          </div>
        </MarketingSection>
      </MarketingShell>
    </>
  );
}