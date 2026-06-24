import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ApertureLogo, ApertureWordmark } from "@/aperture/brand/ApertureLogo";
import {
  ApertureCard,
  ApertureButton,
  ApertureChip,
  ApertureMonoLabel,
  ApertureSectionTitle,
  ApertureThemeSwitch,
} from "@/aperture/components/primitives";

/* ----- tiny helpers ----- */
function H1({ children }: { children: React.ReactNode }) {
  return (
    <h1
      style={{
        margin: 0,
        fontSize: "clamp(28px, 6vw, 64px)",
        lineHeight: 1.05,
        letterSpacing: "-0.035em",
        fontWeight: 600,
        color: "var(--ap-ink-1)",
      }}
    >
      {children}
    </h1>
  );
}

function Lede({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: 0,
        fontSize: "clamp(14px, 1.4vw, 18px)",
        lineHeight: 1.55,
        color: "var(--ap-ink-2)",
        maxWidth: 620,
      }}
    >
      {children}
    </p>
  );
}

function Stat({ k, v, sub }: { k: string; v: string; sub: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <ApertureMonoLabel>{k}</ApertureMonoLabel>
      <div
        style={{
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "var(--ap-ink-1)",
        }}
      >
        {v}
      </div>
      <div style={{ fontSize: 12, color: "var(--ap-ink-3)" }}>{sub}</div>
    </div>
  );
}

function BenefitCard({
  idx,
  title,
  body,
}: {
  idx: string;
  title: string;
  body: string;
}) {
  return (
    <ApertureCard padding={20}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <ApertureMonoLabel>{idx}</ApertureMonoLabel>
        <h3
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "var(--ap-ink-1)",
          }}
        >
          {title}
        </h3>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--ap-ink-2)" }}>
          {body}
        </p>
      </div>
    </ApertureCard>
  );
}

function LossCard({
  label,
  daily,
  monthly,
  yearly,
}: {
  label: string;
  daily: string;
  monthly: string;
  yearly: string;
}) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: "var(--ap-radius-sm)",
        background: "var(--ap-surface-2)",
        border: "1px solid var(--ap-hairline)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ap-ink-1)" }}>{label}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <div>
          <ApertureMonoLabel size={9}>Daily</ApertureMonoLabel>
          <div className="ap-mono" style={{ fontSize: 13, color: "var(--ap-ink-2)", marginTop: 4 }}>{daily}</div>
        </div>
        <div>
          <ApertureMonoLabel size={9}>Monthly</ApertureMonoLabel>
          <div className="ap-mono" style={{ fontSize: 13, color: "var(--ap-ink-2)", marginTop: 4 }}>{monthly}</div>
        </div>
        <div>
          <ApertureMonoLabel size={9}>Yearly</ApertureMonoLabel>
          <div className="ap-mono" style={{ fontSize: 13, color: "var(--ap-signal)", fontWeight: 600, marginTop: 4 }}>{yearly}</div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * Marketing landing page for RiloBiz
 * ============================================================ */
export default function ApertureMarketing() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      <Helmet>
        <title>RiloBiz — The business advisor that actually knows your business</title>
        <meta
          name="description"
          content="RiloBiz builds a persistent memory of your business and turns it into an AI advisor that protects revenue, cuts losses, and spots growth windows before they close."
        />
      </Helmet>

      <div
        style={{
          minHeight: "100vh",
          background: "var(--ap-canvas)",
          color: "var(--ap-ink-1)",
        }}
      >
        {/* ---------------- Nav ---------------- */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "color-mix(in srgb, var(--ap-canvas) 82%, transparent)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid var(--ap-hairline)",
          }}
        >
          <div
            style={{
              maxWidth: 1180,
              margin: "0 auto",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <Link
              to="/rilobiz/marketing"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
                color: "var(--ap-ink-1)",
                flexShrink: 0,
              }}
            >
              <ApertureLogo size={26} />
              <ApertureWordmark />
            </Link>

            <nav style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              {!isMobile && (
                <>
                  <a href="#benefits" style={{ fontSize: 13, color: "var(--ap-ink-2)", textDecoration: "none" }}>
                    Benefits
                  </a>
                  <a href="#patterns" style={{ fontSize: 13, color: "var(--ap-ink-2)", textDecoration: "none" }}>
                    Patterns
                  </a>
                  <a href="#how" style={{ fontSize: 13, color: "var(--ap-ink-2)", textDecoration: "none" }}>
                    How it works
                  </a>
                </>
              )}
              <ApertureThemeSwitch />
              <Link to="/app/rilobiz/auth" style={{ textDecoration: "none" }}>
                <ApertureButton variant="accent" size="sm">Start free</ApertureButton>
              </Link>
            </nav>
          </div>
        </header>

        {/* ---------------- Hero ---------------- */}
        <section
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: isMobile ? "40px 16px 32px" : "80px 24px 60px",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr",
            gap: isMobile ? 28 : 48,
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <ApertureChip tone="signal">For small business owners</ApertureChip>
            <H1>
              The AI advisor that actually <em style={{ fontStyle: "normal", color: "var(--ap-signal)" }}>knows your business.</em>
            </H1>
            <Lede>
              Generic AI gives generic advice. RiloBiz builds a persistent memory of your
              business — your customers, pricing, finances, team, goals — and turns every
              answer into one tailored to <em>your</em> situation.
            </Lede>
            <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
              <Link to="/app/rilobiz/auth" style={{ textDecoration: "none" }}>
                <ApertureButton variant="accent">Start free →</ApertureButton>
              </Link>
              <a href="#how" style={{ textDecoration: "none" }}>
                <ApertureButton variant="ghost">See how it works</ApertureButton>
              </a>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: isMobile ? 20 : 36,
                marginTop: 16,
              }}
            >
              <Stat k="Avg. leakage caught" v="$2.1K/mo" sub="across small operators" />
              <Stat k="Decision speed" v="3.4×" sub="vs. generic AI tools" />
              <Stat k="Memory buckets" v="12+" sub="auto-organized" />
            </div>
          </div>

          {/* Right: visual memory mockup */}
          <ApertureCard padding={isMobile ? 14 : 20} raised>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <ApertureMonoLabel>Business memory</ApertureMonoLabel>
              <ApertureChip tone="live">Live</ApertureChip>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                ["Customers", "184 facts"],
                ["Pricing", "27 facts"],
                ["Finances", "92 facts"],
                ["Marketing", "61 facts"],
                ["Operations", "44 facts"],
                ["Goals", "18 facts"],
              ].map(([name, n]) => (
                <div
                  key={name}
                  style={{
                    padding: 12,
                    borderRadius: "var(--ap-radius-sm)",
                    background: "var(--ap-surface-2)",
                    border: "1px solid var(--ap-hairline)",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ap-ink-1)" }}>{name}</div>
                  <div className="ap-mono" style={{ fontSize: 10.5, color: "var(--ap-ink-3)", marginTop: 4 }}>
                    {n}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 16,
                padding: 12,
                borderRadius: "var(--ap-radius-sm)",
                background: "var(--ap-signal-soft)",
                border: "1px solid transparent",
                fontSize: 12.5,
                color: "var(--ap-ink-1)",
                lineHeight: 1.5,
              }}
            >
              <ApertureMonoLabel color="var(--ap-signal)">Pattern alert</ApertureMonoLabel>
              <div style={{ marginTop: 6 }}>
                Your tools spend climbed <strong>$80/mo</strong> for 6 months unnoticed —
                $480 leaked. Cancel 3 unused seats to recover it.
              </div>
            </div>
          </ApertureCard>
        </section>

        {/* ---------------- Problem ---------------- */}
        <section
          style={{
            borderTop: "1px solid var(--ap-hairline)",
            background: "var(--ap-surface-1)",
          }}
        >
          <div style={{ maxWidth: 1180, margin: "0 auto", padding: isMobile ? "40px 16px" : "60px 24px" }}>
            <ApertureSectionTitle
              index="01 / The problem"
              title="Generic AI doesn't know your numbers."
              sub="Ask ChatGPT 'how do I get more customers' and you'll get a blog post. It doesn't know your pricing, your margins, your team size, or your last 3 launches."
            />
          </div>
        </section>

        {/* ---------------- Benefits ---------------- */}
        <section id="benefits" style={{ maxWidth: 1180, margin: "0 auto", padding: isMobile ? "48px 16px" : "72px 24px" }}>
          <div style={{ maxWidth: 720, marginBottom: 28 }}>
            <ApertureSectionTitle
              index="02 / What you get"
              title="Not features. Outcomes."
              sub="RiloBiz is judged by what it changes in your business, not by what it does on a screen."
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 12,
            }}
          >
            <BenefitCard
              idx="B.01"
              title="More revenue, less guessing"
              body="RiloBiz remembers your pricing, products, and customers, then recommends tactics that fit your real model — not someone else's."
            />
            <BenefitCard
              idx="B.02"
              title="Lower expenses, better margins"
              body="Tracks spending and flags cash leaks. Specific, dollar-amount cost cuts for your actual operations."
            />
            <BenefitCard
              idx="B.03"
              title="New ways to fund growth"
              body="Maps your profile to grants, loans, investor angles, and revenue-based financing based on stage and industry."
            />
            <BenefitCard
              idx="B.04"
              title="More clients with less effort"
              body="Channels and messaging tailored to your audience and budget. Stops wasted marketing time."
            />
            <BenefitCard
              idx="B.05"
              title="Team that scales without you"
              body="Documents processes, assigns responsibilities, and onboards people without you being in every chat."
            />
            <BenefitCard
              idx="B.06"
              title="More time for the owner"
              body="Holds your context so answers are fast and clear — freeing hours to focus on growth, or step away."
            />
          </div>
        </section>

        {/* ---------------- Pattern / loss math ---------------- */}
        <section
          id="patterns"
          style={{
            borderTop: "1px solid var(--ap-hairline)",
            background: "var(--ap-surface-1)",
          }}
        >
          <div style={{ maxWidth: 1180, margin: "0 auto", padding: isMobile ? "48px 16px" : "72px 24px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1.2fr",
                gap: isMobile ? 28 : 48,
                alignItems: "start",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <ApertureSectionTitle
                  index="03 / Pattern radar · Coming soon"
                  title="The losses you never see are the ones that add up."
                  sub="Most owners don't lose money to one big mistake. They lose it to delays that compound, leaks that stack, and windows that close. RiloBiz makes those patterns visible while there's still time to act."
                />
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    "The true cost of delay — pushing a $10K/mo move by 3 months isn't a 3-month delay. It's $30K gone.",
                    "Invisible leakage — $10/day looks harmless. In a year it's $3,650 you didn't budget for.",
                    "Opportunity windows — RiloBiz flags the $40K bet that returns $70K when timing is right.",
                  ].map((t) => (
                    <li
                      key={t}
                      style={{
                        fontSize: 14,
                        lineHeight: 1.55,
                        color: "var(--ap-ink-2)",
                        paddingLeft: 18,
                        position: "relative",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 8,
                          width: 6,
                          height: 6,
                          borderRadius: 999,
                          background: "var(--ap-signal)",
                        }}
                      />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <ApertureCard padding={isMobile ? 16 : 24}>
                <ApertureMonoLabel>Loss compounding ledger</ApertureMonoLabel>
                {isMobile ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                    <LossCard label="Small daily leak ($10/day)" daily="$10" monthly="$300" yearly="$3,650" />
                    <LossCard label="Delayed $10K/mo launch" daily="—" monthly="$10,000" yearly="$120,000" />
                    <LossCard label="$30K overspend on launch" daily="—" monthly="—" yearly="$30,000" />
                    <LossCard label="Wrong-fit client (3× time)" daily="$120" monthly="$3,600" yearly="$43,200" />
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
                        gap: 12,
                        marginTop: 16,
                        paddingBottom: 10,
                      }}
                    >
                      <ApertureMonoLabel size={9}>Scenario</ApertureMonoLabel>
                      <ApertureMonoLabel size={9}>Daily</ApertureMonoLabel>
                      <ApertureMonoLabel size={9}>Monthly</ApertureMonoLabel>
                      <ApertureMonoLabel size={9}>Yearly</ApertureMonoLabel>
                    </div>
                    {/* Desktop table rows */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
                        gap: 12,
                        padding: "14px 0",
                        borderTop: "1px solid var(--ap-hairline)",
                        alignItems: "baseline",
                      }}
                    >
                      <div style={{ fontSize: 13.5, color: "var(--ap-ink-1)" }}>Small daily leak ($10/day)</div>
                      <div className="ap-mono" style={{ fontSize: 13, color: "var(--ap-ink-2)" }}>$10</div>
                      <div className="ap-mono" style={{ fontSize: 13, color: "var(--ap-ink-2)" }}>$300</div>
                      <div className="ap-mono" style={{ fontSize: 13, color: "var(--ap-signal)", fontWeight: 600 }}>$3,650</div>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
                        gap: 12,
                        padding: "14px 0",
                        borderTop: "1px solid var(--ap-hairline)",
                        alignItems: "baseline",
                      }}
                    >
                      <div style={{ fontSize: 13.5, color: "var(--ap-ink-1)" }}>Delayed $10K/mo launch</div>
                      <div className="ap-mono" style={{ fontSize: 13, color: "var(--ap-ink-2)" }}>—</div>
                      <div className="ap-mono" style={{ fontSize: 13, color: "var(--ap-ink-2)" }}>$10,000</div>
                      <div className="ap-mono" style={{ fontSize: 13, color: "var(--ap-signal)", fontWeight: 600 }}>$120,000</div>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
                        gap: 12,
                        padding: "14px 0",
                        borderTop: "1px solid var(--ap-hairline)",
                        alignItems: "baseline",
                      }}
                    >
                      <div style={{ fontSize: 13.5, color: "var(--ap-ink-1)" }}>$30K overspend on launch</div>
                      <div className="ap-mono" style={{ fontSize: 13, color: "var(--ap-ink-2)" }}>—</div>
                      <div className="ap-mono" style={{ fontSize: 13, color: "var(--ap-ink-2)" }}>—</div>
                      <div className="ap-mono" style={{ fontSize: 13, color: "var(--ap-signal)", fontWeight: 600 }}>$30,000</div>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
                        gap: 12,
                        padding: "14px 0",
                        borderTop: "1px solid var(--ap-hairline)",
                        alignItems: "baseline",
                      }}
                    >
                      <div style={{ fontSize: 13.5, color: "var(--ap-ink-1)" }}>Wrong-fit client (3× time)</div>
                      <div className="ap-mono" style={{ fontSize: 13, color: "var(--ap-ink-2)" }}>$120</div>
                      <div className="ap-mono" style={{ fontSize: 13, color: "var(--ap-ink-2)" }}>$3,600</div>
                      <div className="ap-mono" style={{ fontSize: 13, color: "var(--ap-signal)", fontWeight: 600 }}>$43,200</div>
                    </div>
                  </>
                )}
                <div
                  style={{
                    marginTop: 18,
                    padding: 14,
                    borderRadius: "var(--ap-radius-sm)",
                    background: "var(--ap-surface-2)",
                    border: "1px solid var(--ap-hairline)",
                    fontSize: 12.5,
                    color: "var(--ap-ink-2)",
                    lineHeight: 1.5,
                  }}
                >
                  RiloBiz cross-references your expenses, time logs, and contracts against
                  benchmarks in memory — and surfaces these patterns as alerts, not reports.
                </div>
              </ApertureCard>
            </div>
          </div>
        </section>

        {/* ---------------- How it works ---------------- */}
        <section id="how" style={{ maxWidth: 1180, margin: "0 auto", padding: isMobile ? "48px 16px" : "72px 24px" }}>
          <div style={{ maxWidth: 720, marginBottom: 28 }}>
            <ApertureSectionTitle
              index="04 / How it works"
              title="Three steps. No spreadsheets."
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 12,
            }}
          >
            {[
              {
                k: "Step 01",
                t: "Quick onboarding",
                b: "Answer a few questions — or just chat. RiloBiz extracts and organizes what matters about your business.",
              },
              {
                k: "Step 02",
                t: "Memory grows with you",
                b: "Every conversation, document, and decision becomes structured memory — across customers, pricing, finance, ops, and goals.",
              },
              {
                k: "Step 03",
                t: "Tailored advice & alerts",
                b: "Ask anything and get answers grounded in your business. RiloBiz also surfaces patterns you didn't ask about.",
              },
            ].map((s) => (
              <BenefitCard key={s.k} idx={s.k} title={s.t} body={s.b} />
            ))}
          </div>
        </section>

        {/* ---------------- CTA ---------------- */}
        <section
          style={{
            borderTop: "1px solid var(--ap-hairline)",
            background: "var(--ap-surface-1)",
          }}
        >
          <div
            style={{
              maxWidth: 1180,
              margin: "0 auto",
              padding: isMobile ? "48px 16px" : "72px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 16,
            }}
          >
            <ApertureChip tone="signal">Free to start</ApertureChip>
            <H1>Make the patterns visible.</H1>
            <Lede>
              Stop guessing. Start operating with an advisor that remembers everything about
              your business — and tells you what it's costing you.
            </Lede>
            <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap", justifyContent: "center" }}>
              <Link to="/app/rilobiz/auth" style={{ textDecoration: "none" }}>
                <ApertureButton variant="accent">Start free →</ApertureButton>
              </Link>
              <Link to="/aperture/brand" style={{ textDecoration: "none" }}>
                <ApertureButton variant="ghost">View brand</ApertureButton>
              </Link>
            </div>
          </div>
        </section>

        {/* ---------------- Footer ---------------- */}
        <footer
          style={{
            borderTop: "1px solid var(--ap-hairline)",
            padding: isMobile ? "20px 16px" : "28px 24px",
          }}
        >
          <div
            style={{
              maxWidth: 1180,
              margin: "0 auto",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <ApertureLogo size={20} />
              <ApertureMonoLabel>RiloBiz · Business memory, working for you</ApertureMonoLabel>
            </div>
            <ApertureMonoLabel>© {new Date().getFullYear()}</ApertureMonoLabel>
          </div>
        </footer>
      </div>
    </>
  );
}
