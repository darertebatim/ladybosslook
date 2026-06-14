import { ReactNode } from "react";
import { ApertureMonoLabel } from "./primitives";

export function PageHeader({
  index, title, sub, action,
}: {
  index?: string;
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
        {index && <ApertureMonoLabel>{index}</ApertureMonoLabel>}
        <h1
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "-0.025em",
            color: "var(--ap-ink-1)",
          }}
        >
          {title}
        </h1>
        {sub && <p style={{ margin: 0, fontSize: 14, color: "var(--ap-ink-2)", maxWidth: 620, lineHeight: 1.5 }}>{sub}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}