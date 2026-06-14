import { Link } from "react-router-dom";
import { ApertureWordmark } from "@/aperture/brand/ApertureLogo";
import { ApertureMonoLabel } from "@/aperture/components/primitives";

const COLS = [
  { title: "Product", links: [
    { to: "/aperture/playbooks", label: "Playbooks" },
    { to: "/aperture/integrations", label: "Integrations" },
    { to: "/aperture/pricing", label: "Pricing" },
    { to: "/aperture/app", label: "Open app" },
  ]},
  { title: "Company", links: [
    { to: "/aperture/manifesto", label: "Manifesto" },
    { to: "/aperture/brand", label: "Brand" },
  ]},
  { title: "Trust", links: [
    { to: "/aperture", label: "Security" },
    { to: "/aperture", label: "Privacy" },
    { to: "/aperture", label: "Contact" },
  ]},
];

export function MarketingFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--ap-hairline)", marginTop: 96 }}>
      <div style={{
        maxWidth: 1180, margin: "0 auto", padding: "48px 24px 32px",
        display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 32,
      }}>
        <div>
          <ApertureWordmark size={18} />
          <p style={{ marginTop: 14, fontSize: 13.5, color: "var(--ap-ink-2)", maxWidth: 280, lineHeight: 1.55 }}>
            Your business has a memory. Aperture is how you use it.
          </p>
        </div>
        {COLS.map(col => (
          <div key={col.title}>
            <ApertureMonoLabel>{col.title}</ApertureMonoLabel>
            <ul style={{ marginTop: 12, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {col.links.map(l => (
                <li key={l.label}>
                  <Link to={l.to} style={{ fontSize: 13.5, color: "var(--ap-ink-2)", textDecoration: "none" }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{
        maxWidth: 1180, margin: "0 auto", padding: "20px 24px 32px",
        borderTop: "1px solid var(--ap-hairline)",
        display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
      }}>
        <span className="ap-mono" style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ap-ink-3)" }}>
          © 2026 Aperture Labs
        </span>
        <span className="ap-mono" style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ap-ink-3)" }}>
          SOC 2 · GDPR · Read-only by default
        </span>
      </div>
    </footer>
  );
}