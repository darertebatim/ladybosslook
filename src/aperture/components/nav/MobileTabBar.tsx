import { NavLink, useLocation } from "react-router-dom";

const TABS = [
  { to: "/aperture/app",              label: "Home",     end: true,
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z"/></svg> },
  { to: "/aperture/app/chats",        label: "Chats",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.8 7L4 20l1-4.5A8 8 0 1 1 21 12z"/></svg> },
  { to: "/aperture/app/memory",       label: "Memory",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg> },
  { to: "/aperture/app/library",      label: "Library",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M10 9l5 3-5 3z"/></svg> },
];

export function MobileTabBar() {
  const loc = useLocation();
  return (
    <nav
      style={{
        position: "fixed",
        left: 12, right: 12, bottom: 12,
        zIndex: 50,
        padding: 6,
        display: "grid",
        gridTemplateColumns: `repeat(${TABS.length}, 1fr)`,
        gap: 2,
        background: "var(--ap-surface-1)",
        border: "1px solid var(--ap-hairline)",
        borderRadius: 999,
        backdropFilter: "saturate(140%) blur(14px)",
        WebkitBackdropFilter: "saturate(140%) blur(14px)",
        boxShadow: "var(--ap-shadow-raised)",
      }}
    >
      {TABS.map(tab => {
        const active = tab.end ? loc.pathname === tab.to : loc.pathname.startsWith(tab.to);
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              padding: "8px 0",
              borderRadius: 999,
              fontSize: 10,
              fontFamily: "var(--ap-font-mono)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              textDecoration: "none",
              color: active ? "var(--ap-ink-1)" : "var(--ap-ink-3)",
              background: active ? "var(--ap-surface-3)" : "transparent",
              transition: "background 120ms ease",
            }}
          >
            <span style={{ color: active ? "var(--ap-signal)" : "currentColor" }}>{tab.icon}</span>
            {tab.label}
          </NavLink>
        );
      })}
    </nav>
  );
}