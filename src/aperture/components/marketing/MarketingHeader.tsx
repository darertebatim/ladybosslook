import { Link, NavLink } from "react-router-dom";
import { ApertureWordmark } from "@/aperture/brand/ApertureLogo";
import { ApertureButton, ApertureThemeSwitch } from "@/aperture/components/primitives";

const NAV = [
  { to: "/aperture/playbooks", label: "Playbooks" },
  { to: "/aperture/integrations", label: "Integrations" },
  { to: "/aperture/pricing", label: "Pricing" },
  { to: "/aperture/manifesto", label: "Manifesto" },
];

export function MarketingHeader() {
  return (
    <header
      style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "color-mix(in oklab, var(--ap-canvas) 88%, transparent)",
        backdropFilter: "saturate(140%) blur(10px)",
        WebkitBackdropFilter: "saturate(140%) blur(10px)",
        borderBottom: "1px solid var(--ap-hairline)",
      }}
    >
      <div style={{
        maxWidth: 1180, margin: "0 auto", padding: "14px 24px",
        display: "flex", alignItems: "center", gap: 24,
      }}>
        <Link to="/aperture" style={{ textDecoration: "none" }}>
          <ApertureWordmark size={17} />
        </Link>
        <nav style={{ display: "flex", gap: 4, marginLeft: 12, flex: 1 }}>
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              style={({ isActive }) => ({
                fontSize: 13.5, padding: "6px 10px", borderRadius: 8,
                textDecoration: "none",
                color: isActive ? "var(--ap-ink-1)" : "var(--ap-ink-2)",
                background: isActive ? "var(--ap-surface-2)" : "transparent",
              })}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ApertureThemeSwitch />
          <Link to="/aperture/app" style={{ textDecoration: "none" }}>
            <ApertureButton variant="ghost" size="sm">Sign in</ApertureButton>
          </Link>
          <ApertureButton variant="accent" size="sm">Join waitlist</ApertureButton>
        </div>
      </div>
    </header>
  );
}