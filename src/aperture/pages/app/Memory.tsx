import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { AppShell } from "@/aperture/components/AppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import { ApertureChip, ApertureMonoLabel } from "@/aperture/components/primitives";
import { BUCKETS } from "@/aperture/data/buckets";
import { useApertureMemory } from "@/aperture/hooks/useApertureMemory";

/**
 * Memory overview — "what the AI knows about my business".
 * Lists every bucket with completion + a peek at filled facts.
 */
export default function MemoryOverview() {
  const { buckets, completion, totalAnswered, totalQuestions } = useApertureMemory();

  return (
    <>
      <Helmet>
        <title>Memory · RiloBiz</title>
        <meta name="description" content="The business memory RiloBiz uses to personalize every conversation." />
      </Helmet>
      <AppShell>
        <PageHeader
          index="01 · MEMORY"
          title="What I know about your business"
          sub={`The buckets I draw from in every chat. The more you fill, the sharper I get. Today: ${totalAnswered} of ${totalQuestions} facts.`}
          action={<ApertureChip tone={completion === 100 ? "live" : completion === 0 ? "neutral" : "signal"}>{completion}% filled</ApertureChip>}
        />

        <div style={{ display: "flex", flexDirection: "column", border: "1px solid var(--ap-hairline)", borderRadius: "var(--ap-radius-md)", overflow: "hidden", background: "var(--ap-surface-1)" }}>
          {buckets.map((b, i) => {
            const meta = BUCKETS.find(x => x.slug === b.slug)!;
            const samples = Object.entries(b.answers).slice(0, 2);
            return (
              <Link
                key={b.slug}
                to={`/aperture/brand/mockup/memory/${b.slug}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  alignItems: "center",
                  gap: 18,
                  padding: "18px 20px",
                  borderTop: i === 0 ? "none" : "1px solid var(--ap-hairline)",
                  textDecoration: "none",
                }}
              >
                <span style={{ fontFamily: "var(--ap-font-mono)", fontSize: 28, color: b.status === "empty" ? "var(--ap-ink-3)" : b.status === "full" ? "var(--ap-signal)" : "var(--ap-ink-2)" }}>{meta.glyph}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <ApertureMonoLabel>{meta.index}</ApertureMonoLabel>
                    <h3 style={{ margin: 0, fontSize: 15.5, color: "var(--ap-ink-1)", fontWeight: 600 }}>{meta.title}</h3>
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--ap-ink-2)", lineHeight: 1.5 }}>
                    {samples.length > 0
                      ? samples.map(([qid, v]) => {
                          const q = meta.questions.find(x => x.id === qid);
                          return `${q?.label.replace(/\?$/, "")}: ${v}`;
                        }).join(" · ")
                      : meta.blurb}
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <ApertureMonoLabel color={b.status === "full" ? "var(--ap-signal)" : undefined}>
                    {b.status === "empty" ? "Empty" : `${b.filled} / ${b.total}`}
                  </ApertureMonoLabel>
                  <div style={{ display: "flex", gap: 4 }}>
                    {Array.from({ length: b.total }).map((_, idx) => (
                      <span key={idx} style={{ width: 14, height: 3, borderRadius: 2, background: idx < b.filled ? "var(--ap-signal)" : "var(--ap-hairline-strong)" }} />
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </AppShell>
    </>
  );
}