import { NavLink, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { ApertureWordmark } from "@/aperture/brand/ApertureLogo";
import { ApertureMonoLabel, ApertureThemeSwitch } from "@/aperture/components/primitives";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

function IconHome() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z"/></svg>
  );
}
function IconPlay() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M10 9l5 3-5 3z"/></svg>
  );
}
function IconChat() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.8 7L4 20l1-4.5A8 8 0 1 1 21 12z"/></svg>
  );
}
function IconMemory() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>
  );
}
function IconPlug() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 7V3M15 7V3M7 7h10v4a5 5 0 0 1-5 5 5 5 0 0 1-5-5z"/><path d="M12 16v5"/></svg>
  );
}
function IconGear() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.3l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1A2 2 0 1 1 19.7 7l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>
  );
}

const NAV: NavItem[] = [
  { to: "/aperture/app",              label: "Home",         icon: <IconHome />, end: true },
  { to: "/aperture/app/playbooks",    label: "Playbooks",    icon: <IconPlay /> },
  { to: "/aperture/app/chat",         label: "Chat",         icon: <IconChat /> },
  { to: "/aperture/app/memory",       label: "Memory",       icon: <IconMemory /> },
  { to: "/aperture/app/integrations", label: "Integrations", icon: <IconPlug /> },
  { to: "/aperture/app/settings",     label: "Settings",     icon: <IconGear /> },
];

export function AppSidebar() {
  const loc = useLocation();
  return (
    <aside
      style={{
        position: "sticky",
        top: 0,
        alignSelf: "flex-start",
        height: "100vh",
        width: 240,
        flexShrink: 0,
        background: "var(--ap-surface-1)",
        borderRight: "1px solid var(--ap-hairline)",
        display: "flex",
        flexDirection: "column",
        padding: "20px 16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <ApertureWordmark size={16} />
      </div>

      <ApertureMonoLabel style={{ padding: "0 8px 8px" }}>Workspace</ApertureMonoLabel>
      <div
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 10px",
          background: "var(--ap-surface-2)",
          border: "1px solid var(--ap-hairline)",
          borderRadius: "var(--ap-radius-sm)",
          marginBottom: 24,
        }}
      >
        <div style={{
          width: 22, height: 22, borderRadius: 6,
          background: "var(--ap-signal)", color: "var(--ap-on-signal)",
          fontWeight: 700, fontSize: 11,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>M</div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
          <span style={{ fontSize: 13, color: "var(--ap-ink-1)", fontWeight: 500 }}>Maven & Co.</span>
          <span style={{ fontSize: 11, color: "var(--ap-ink-3)" }}>Operator plan</span>
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(item => {
          const active = item.end ? loc.pathname === item.to : loc.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 10px",
                borderRadius: "var(--ap-radius-xs)",
                fontSize: 13.5,
                color: active ? "var(--ap-ink-1)" : "var(--ap-ink-2)",
                background: active ? "var(--ap-surface-2)" : "transparent",
                textDecoration: "none",
                transition: "background 120ms ease, color 120ms ease",
              }}
            >
              <span style={{ color: active ? "var(--ap-signal)" : "var(--ap-ink-3)", display: "inline-flex" }}>{item.icon}</span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid var(--ap-hairline)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <ApertureMonoLabel>Theme</ApertureMonoLabel>
        <ApertureThemeSwitch />
      </div>
    </aside>
  );
}