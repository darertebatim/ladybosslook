import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { AppSidebar } from "./nav/AppSidebar";
import { MobileTabBar } from "./nav/MobileTabBar";
import { ApertureWordmark } from "@/aperture/brand/ApertureLogo";
import { ApertureThemeSwitch } from "./primitives";

/**
 * Shared chrome for /aperture/app/*. Sidebar on desktop, fixed bottom tab
 * bar on mobile. Main column is constrained to a comfortable reading width
 * and pages handle their own internal layout.
 */
export function AppShell({ children, rightRail }: { children: ReactNode; rightRail?: ReactNode }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div style={{ minHeight: "100vh", paddingBottom: 92 }}>
        <header
          style={{
            position: "sticky", top: 0, zIndex: 30,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 18px",
            background: "var(--ap-canvas)",
            borderBottom: "1px solid var(--ap-hairline)",
          }}
        >
          <ApertureWordmark size={15} />
          <ApertureThemeSwitch />
        </header>
        <main style={{ padding: "20px 18px 24px" }}>{children}</main>
        <MobileTabBar />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <AppSidebar />
      <div style={{ flex: 1, display: "flex", minWidth: 0 }}>
        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: "32px 40px 64px",
            maxWidth: rightRail ? "none" : 1080,
            margin: rightRail ? 0 : "0 auto",
            width: "100%",
          }}
        >
          {children}
        </main>
        {rightRail && (
          <aside
            style={{
              width: 320,
              flexShrink: 0,
              borderLeft: "1px solid var(--ap-hairline)",
              padding: "32px 24px",
              background: "var(--ap-surface-1)",
            }}
          >
            {rightRail}
          </aside>
        )}
      </div>
    </div>
  );
}