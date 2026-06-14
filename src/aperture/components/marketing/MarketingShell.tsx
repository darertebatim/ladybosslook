import { ReactNode } from "react";
import { MarketingHeader } from "./MarketingHeader";
import { MarketingFooter } from "./MarketingFooter";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <MarketingHeader />
      <div style={{ flex: 1 }}>{children}</div>
      <MarketingFooter />
    </div>
  );
}

export function MarketingSection({
  children,
  bleed = false,
  pad = "80px 24px",
}: { children: ReactNode; bleed?: boolean; pad?: string }) {
  if (bleed) return <section style={{ padding: pad }}>{children}</section>;
  return (
    <section style={{ padding: pad }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>{children}</div>
    </section>
  );
}