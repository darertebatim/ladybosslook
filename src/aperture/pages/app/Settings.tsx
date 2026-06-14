import { Helmet } from "react-helmet-async";
import { AppShell } from "@/aperture/components/AppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureCard, ApertureButton, ApertureMonoLabel, ApertureThemeSwitch, ApertureChip,
} from "@/aperture/components/primitives";

function Row({ label, hint, control }: { label: string; hint?: string; control: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 18px", borderTop: "1px solid var(--ap-hairline)" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, color: "var(--ap-ink-1)", fontWeight: 500 }}>{label}</div>
        {hint && <div style={{ fontSize: 12, color: "var(--ap-ink-3)", marginTop: 2 }}>{hint}</div>}
      </div>
      <div>{control}</div>
    </div>
  );
}

export default function ApertureSettings() {
  return (
    <>
      <Helmet>
        <title>Settings · Aperture</title>
        <meta name="description" content="Workspace, theme, billing, and account preferences for Aperture." />
      </Helmet>
      <AppShell>
        <PageHeader index="05 · SETTINGS" title="Settings" sub="Workspace, theme, and billing." />

        <ApertureCard padding={0}>
          <div style={{ padding: "16px 18px" }}>
            <ApertureMonoLabel>Workspace</ApertureMonoLabel>
          </div>
          <Row label="Workspace name" hint="Used in headers and exports." control={<span style={{ fontSize: 13.5, color: "var(--ap-ink-2)" }}>Maven & Co.</span>} />
          <Row label="Domain" control={<span style={{ fontSize: 13, color: "var(--ap-ink-2)", fontFamily: "var(--ap-font-mono)" }}>mavenandco.com</span>} />
          <Row label="Team" hint="Operator plan · 1 of 3 seats used." control={<ApertureButton variant="default" size="sm">Invite</ApertureButton>} />
        </ApertureCard>

        <ApertureCard padding={0} style={{ marginTop: 18 }}>
          <div style={{ padding: "16px 18px" }}>
            <ApertureMonoLabel>Appearance</ApertureMonoLabel>
          </div>
          <Row label="Theme" hint="Aperture is built for both light and dark." control={<ApertureThemeSwitch />} />
          <Row label="Density" hint="Compact reduces row height by 4px." control={<ApertureButton variant="default" size="sm">Comfortable</ApertureButton>} />
        </ApertureCard>

        <ApertureCard padding={0} style={{ marginTop: 18 }}>
          <div style={{ padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <ApertureMonoLabel>Billing</ApertureMonoLabel>
            <ApertureChip tone="signal">Operator</ApertureChip>
          </div>
          <Row label="Plan" hint="Unlimited playbooks, all integrations, 3 seats." control={<ApertureButton variant="ghost" size="sm">Change</ApertureButton>} />
          <Row label="Next invoice" hint="June 28, 2026" control={<span style={{ fontSize: 13, color: "var(--ap-ink-1)", fontFamily: "var(--ap-font-mono)" }}>$48.00</span>} />
          <Row label="Payment method" control={<span style={{ fontSize: 13, color: "var(--ap-ink-2)", fontFamily: "var(--ap-font-mono)" }}>•••• 4242</span>} />
        </ApertureCard>

        <ApertureCard padding={0} style={{ marginTop: 18 }}>
          <div style={{ padding: "16px 18px" }}>
            <ApertureMonoLabel>Danger zone</ApertureMonoLabel>
          </div>
          <Row label="Disconnect all sources" hint="Aperture stops reading from any integration." control={<ApertureButton variant="default" size="sm">Disconnect</ApertureButton>} />
          <Row label="Delete workspace" hint="Permanent. Cannot be undone." control={<ApertureButton variant="default" size="sm" style={{ borderColor: "var(--ap-danger)", color: "var(--ap-danger)" }}>Delete</ApertureButton>} />
        </ApertureCard>
      </AppShell>
    </>
  );
}