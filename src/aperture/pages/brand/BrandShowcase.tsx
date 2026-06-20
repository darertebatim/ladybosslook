import { useRef, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { ApertureLogo, ApertureWordmark } from "@/aperture/brand/ApertureLogo";
import {
  ApertureCard,
  ApertureButton,
  ApertureChip,
  ApertureIntegrationDot,
  ApertureMonoLabel,
  ApertureSectionTitle,
  ApertureThemeSwitch,
} from "@/aperture/components/primitives";
import { useApertureTheme } from "@/aperture/components/ApertureLayout";

/* ---- color helpers ---- */
function rgbToHex(rgb: string): string {
  const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/);
  if (!match) return rgb;
  const toHex = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(parseInt(match[1]))}${toHex(parseInt(match[2]))}${toHex(parseInt(match[3]))}`;
}

function useResolvedHex(ref: React.RefObject<HTMLDivElement>): string {
  const [hex, setHex] = useState("");
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const rgb = getComputedStyle(el).backgroundColor;
      setHex(rgbToHex(rgb));
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(el, { attributes: true, attributeFilter: ["style", "class"] });
    return () => observer.disconnect();
  }, []);
  return hex;
}

/* ---- swatch / token helpers ---- */
function Swatch({ token, label }: { token: string; label: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const hex = useResolvedHex(boxRef);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!hex) return;
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        ref={boxRef}
        style={{
          height: 64,
          borderRadius: "var(--ap-radius-sm)",
          background: `var(${token})`,
          border: "1px solid var(--ap-hairline)",
          cursor: "pointer",
          position: "relative",
        }}
        onClick={copy}
        title="Click to copy hex"
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 12.5, color: "var(--ap-ink-1)", fontWeight: 500 }}>
          {label}
        </span>
        <ApertureMonoLabel size={9}>{token}</ApertureMonoLabel>
        <button
          onClick={copy}
          title="Copy hex"
          style={{
            background: "none",
            border: "none",
            padding: 0,
            margin: 0,
            cursor: "pointer",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <ApertureMonoLabel size={9} style={{ color: copied ? "var(--ap-live)" : "var(--ap-ink-3)" }}>
            {copied ? "Copied!" : hex || "..."}
          </ApertureMonoLabel>
        </button>
      </div>
    </div>
  );
}

function TypeRow({
  size,
  weight,
  letterSpacing,
  label,
  sample,
  mono,
}: {
  size: number;
  weight: number;
  letterSpacing?: string;
  label: string;
  sample: string;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "120px 1fr",
        gap: 24,
        alignItems: "baseline",
        padding: "16px 0",
        borderTop: "1px solid var(--ap-hairline)",
      }}
    >
      <ApertureMonoLabel>{label}</ApertureMonoLabel>
      <div
        style={{
          fontSize: size,
          fontWeight: weight,
          letterSpacing,
          color: "var(--ap-ink-1)",
          fontFamily: mono ? "var(--ap-font-mono)" : "var(--ap-font-sans)",
          lineHeight: 1.15,
        }}
      >
        {sample}
      </div>
    </div>
  );
}

const INTEGRATIONS = [
  { name: "Stripe", color: "#635BFF", status: "live" as const },
  { name: "Instagram", color: "#E1306C", status: "live" as const },
  { name: "Square", color: "#3B6CF6", status: "live" as const },
  { name: "Salesforce", color: "#00A1E0", status: "syncing" as const },
  { name: "QuickBooks", color: "#2CA01C", status: "live" as const },
  { name: "Shopify", color: "#95BF47", status: "live" as const },
  { name: "HubSpot", color: "#FF7A59", status: "off" as const },
  { name: "GA4", color: "#F9AB00", status: "live" as const },
];

export default function BrandShowcase() {
  const { theme } = useApertureTheme();

  return (
    <div style={{ minHeight: "100vh" }}>
      <Helmet>
        <title>Aperture — Brand</title>
        <meta
          name="description"
          content="Aperture visual system — logo, color tokens, typography, and primitive components."
        />
      </Helmet>

      {/* ---- top bar ---- */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: theme === "dark" ? "rgba(10,10,10,0.72)" : "rgba(246,246,247,0.78)",
          backdropFilter: "saturate(140%) blur(14px)",
          WebkitBackdropFilter: "saturate(140%) blur(14px)",
          borderBottom: "1px solid var(--ap-hairline)",
        }}
      >
        <div
          style={{
            maxWidth: 1240,
            margin: "0 auto",
            padding: "16px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <ApertureWordmark size={18} />
            <ApertureMonoLabel>Brand · v0.1</ApertureMonoLabel>
          </div>
          <ApertureThemeSwitch />
        </div>
      </header>

      <main
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "64px 32px 96px",
          display: "flex",
          flexDirection: "column",
          gap: 80,
        }}
      >
        {/* ---- hero ---- */}
        <section>
          <ApertureMonoLabel>00 · The Mark</ApertureMonoLabel>
          <h1
            style={{
              margin: "16px 0 12px",
              fontSize: 56,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1.04,
              color: "var(--ap-ink-1)",
              maxWidth: 720,
            }}
          >
            Your business has a memory.
            <br />
            <span style={{ color: "var(--ap-signal)" }}>Aperture</span> is how you use it.
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 16,
              color: "var(--ap-ink-2)",
              maxWidth: 560,
              lineHeight: 1.55,
            }}
          >
            Connected playbooks for small businesses — grounded in Stripe, Square,
            Instagram, QuickBooks, and the rest of your stack.
          </p>
        </section>

        {/* ---- logo lockups ---- */}
        <section>
          <ApertureSectionTitle
            index="01 · LOCKUPS"
            title="Logo"
            sub="The mark is monoline and reads from 16px to 512px. Lockups inherit ink color."
          />
          <div
            style={{
              marginTop: 24,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
            }}
          >
            <ApertureCard padding={32} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, minHeight: 200, justifyContent: "center" }}>
              <ApertureLogo size={72} color="var(--ap-ink-1)" />
              <ApertureMonoLabel>Mark</ApertureMonoLabel>
            </ApertureCard>
            <ApertureCard padding={32} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, minHeight: 200, justifyContent: "center" }}>
              <ApertureLogo size={72} color="var(--ap-signal)" />
              <ApertureMonoLabel>Mark · Signal</ApertureMonoLabel>
            </ApertureCard>
            <ApertureCard padding={32} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, minHeight: 200, justifyContent: "center" }}>
              <ApertureWordmark size={28} />
              <ApertureMonoLabel>Horizontal</ApertureMonoLabel>
            </ApertureCard>
            <ApertureCard padding={32} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, minHeight: 200, justifyContent: "center" }}>
              <ApertureWordmark size={28} showMark={false} />
              <ApertureMonoLabel>Wordmark only</ApertureMonoLabel>
            </ApertureCard>
          </div>
        </section>

        {/* ---- color tokens ---- */}
        <section>
          <ApertureSectionTitle
            index="02 · TOKENS"
            title="Color"
            sub="Tokens are scoped to .aperture-root and never leak into Rilo's design system."
          />

          <div style={{ marginTop: 32 }}>
            <ApertureMonoLabel>Canvas · Surfaces</ApertureMonoLabel>
            <div
              style={{
                marginTop: 12,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 16,
              }}
            >
              <Swatch token="--ap-canvas" label="Canvas" />
              <Swatch token="--ap-surface-1" label="Surface 1" />
              <Swatch token="--ap-surface-2" label="Surface 2" />
              <Swatch token="--ap-surface-3" label="Surface 3" />
              <Swatch token="--ap-hairline" label="Hairline" />
            </div>
          </div>

          <div style={{ marginTop: 32 }}>
            <ApertureMonoLabel>Ink</ApertureMonoLabel>
            <div
              style={{
                marginTop: 12,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 16,
              }}
            >
              <Swatch token="--ap-ink-1" label="Ink 1 · Primary" />
              <Swatch token="--ap-ink-2" label="Ink 2 · Secondary" />
              <Swatch token="--ap-ink-3" label="Ink 3 · Tertiary" />
            </div>
          </div>

          <div style={{ marginTop: 32 }}>
            <ApertureMonoLabel>Signal · Semantic</ApertureMonoLabel>
            <div
              style={{
                marginTop: 12,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 16,
              }}
            >
              <Swatch token="--ap-signal" label="Signal" />
              <Swatch token="--ap-signal-pressed" label="Signal · Pressed" />
              <Swatch token="--ap-live" label="Live" />
              <Swatch token="--ap-warn" label="Warn" />
              <Swatch token="--ap-danger" label="Danger" />
            </div>
          </div>
        </section>

        {/* ---- typography ---- */}
        <section>
          <ApertureSectionTitle
            index="03 · TYPE"
            title="Typography"
            sub="Inter for UI and body. JetBrains Mono for labels, step numbers, IDs, and data."
          />
          <div style={{ marginTop: 24 }}>
            <TypeRow size={48} weight={600} letterSpacing="-0.03em" label="Display · 48" sample="Connected business memory" />
            <TypeRow size={32} weight={600} letterSpacing="-0.02em" label="H1 · 32" sample="Weekly revenue digest" />
            <TypeRow size={22} weight={600} letterSpacing="-0.02em" label="H2 · 22" sample="Run output · 4 sources" />
            <TypeRow size={16} weight={400} label="Body · 16" sample="Stripe and QuickBooks are in sync. Net revenue is up 12% week over week — driven by the Pro plan." />
            <TypeRow size={13.5} weight={400} label="Body · 13.5" sample="Connected · 7 of 8 sources live. Last sync 2 minutes ago." />
            <TypeRow size={11} weight={500} letterSpacing="0.14em" label="Mono · 11" sample="LIVE · 2M AGO · STRIPE + QUICKBOOKS" mono />
          </div>
        </section>

        {/* ---- primitives ---- */}
        <section>
          <ApertureSectionTitle
            index="04 · PRIMITIVES"
            title="Components"
            sub="Reusable building blocks for the product surface. All Aperture pages compose from these."
          />

          <div
            style={{
              marginTop: 24,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {/* Buttons */}
            <ApertureCard>
              <ApertureMonoLabel>Buttons</ApertureMonoLabel>
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <ApertureButton variant="accent">Run playbook</ApertureButton>
                <ApertureButton variant="default">Connect a source</ApertureButton>
                <ApertureButton variant="ghost">Open in chat</ApertureButton>
                <ApertureButton variant="default" size="sm">Small action</ApertureButton>
              </div>
            </ApertureCard>

            {/* Chips */}
            <ApertureCard>
              <ApertureMonoLabel>Chips</ApertureMonoLabel>
              <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
                <ApertureChip tone="live" icon={<span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--ap-live)", display: "inline-block" }} className="ap-pulse" />}>Live · 2m ago</ApertureChip>
                <ApertureChip tone="signal">Suggested</ApertureChip>
                <ApertureChip tone="neutral">Draft</ApertureChip>
              </div>
            </ApertureCard>

            {/* Integrations */}
            <ApertureCard style={{ gridColumn: "span 1" }}>
              <ApertureMonoLabel>Integrations · 7 of 8</ApertureMonoLabel>
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                {INTEGRATIONS.slice(0, 5).map((i) => (
                  <div key={i.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <ApertureIntegrationDot color={i.color} status={i.status} />
                    <span style={{ fontSize: 13, color: "var(--ap-ink-1)" }}>{i.name}</span>
                    <ApertureMonoLabel style={{ marginLeft: "auto" }}>{i.status}</ApertureMonoLabel>
                  </div>
                ))}
              </div>
            </ApertureCard>

            {/* Playbook card preview */}
            <ApertureCard style={{ gridColumn: "span 2", minWidth: 0 }} raised>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <ApertureMonoLabel>Playbook · 03</ApertureMonoLabel>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--ap-ink-1)", letterSpacing: "-0.015em" }}>
                    Weekly revenue digest
                  </h3>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <ApertureChip tone="live" icon={<span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--ap-live)", display: "inline-block" }} className="ap-pulse" />}>Live · 2m ago</ApertureChip>
                  <ApertureButton variant="accent" size="sm">Run</ApertureButton>
                </div>
              </div>
              <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
                {INTEGRATIONS.filter(i => ["Stripe", "QuickBooks"].includes(i.name)).map(i => (
                  <div key={i.name} style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "6px 10px",
                    background: "var(--ap-surface-2)",
                    border: "1px solid var(--ap-hairline)",
                    borderRadius: 999,
                    fontSize: 12,
                    color: "var(--ap-ink-2)",
                  }}>
                    <ApertureIntegrationDot color={i.color} size={7} />
                    {i.name}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 18, padding: 14, background: "var(--ap-surface-2)", borderRadius: "var(--ap-radius-sm)", border: "1px solid var(--ap-hairline)" }}>
                <ApertureMonoLabel>Output draft</ApertureMonoLabel>
                <p style={{ margin: "8px 0 0", fontSize: 13.5, color: "var(--ap-ink-1)", lineHeight: 1.55 }}>
                  Net revenue this week is <strong style={{ color: "var(--ap-signal)" }}>$48,210</strong> — up 12% from last week.
                  Pro plan drove $31,400 (+18%). 3 lapsed customers reactivated. Refund volume held flat.
                </p>
              </div>
            </ApertureCard>
          </div>
        </section>

        {/* ---- footer ---- */}
        <footer style={{ paddingTop: 32, borderTop: "1px solid var(--ap-hairline)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <ApertureWordmark size={14} />
          <ApertureMonoLabel>© Aperture · {new Date().getFullYear()} · System v0.1</ApertureMonoLabel>
        </footer>
      </main>
    </div>
  );
}