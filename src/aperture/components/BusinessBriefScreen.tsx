import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureCard, ApertureMonoLabel, ApertureButton, ApertureLoading, ApertureChip,
} from "@/aperture/components/primitives";

type Brief = {
  summary: string;
  bullets: { label: string; value: string }[];
  next_moves: string[];
  risks: string[];
};

/**
 * Post-onboarding mini-report. Calls aperture-business-brief once,
 * then shows the result with an "Enter Aperture →" CTA. Not persisted —
 * this is a one-time "you've been heard" moment before Home.
 */
export function BusinessBriefScreen({
  closingAnswer,
  flow,
  onDone,
}: {
  closingAnswer: string;
  flow: "quick" | "full";
  onDone: () => void;
}) {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("aperture-business-brief", {
          body: { closing_answer: closingAnswer, flow },
        });
        if (cancelled) return;
        if (error || !data?.brief) {
          setErrored(true);
          return;
        }
        setBrief(data.brief as Brief);
      } catch {
        if (!cancelled) setErrored(true);
      }
    })();
    return () => { cancelled = true; };
  }, [closingAnswer, flow]);

  if (errored) {
    return (
      <>
        <PageHeader
          index="ALL SET"
          title="You're ready to go."
          sub="I couldn't draft your brief right now, but everything you shared is saved. We can build on it together."
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
          <ApertureButton variant="accent" onClick={onDone}>Enter Aperture →</ApertureButton>
        </div>
      </>
    );
  }

  if (!brief) {
    return (
      <>
        <PageHeader
          index="ONE MOMENT"
          title="Reading everything you shared…"
          sub="I'm pulling your answers together into a short snapshot of your business so we're on the same page before we begin."
        />
        <ApertureLoading sublabel="Synthesizing memory, closing answer, and source notes into a mini-report." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        index="YOUR BRIEF"
        title="Here's what I've got on your business."
        sub="A quick read-back of what you shared. If something's off, you can fix it in Memory anytime."
        action={<ApertureChip tone="signal">Draft</ApertureChip>}
      />

      {brief.summary && (
        <ApertureCard padding={20}>
          <ApertureMonoLabel>Summary</ApertureMonoLabel>
          <p style={{
            margin: "10px 0 0", fontSize: 15, lineHeight: 1.55,
            color: "var(--ap-ink-1)",
          }}>{brief.summary}</p>
        </ApertureCard>
      )}

      {brief.bullets.length > 0 && (
        <ApertureCard padding={20} style={{ marginTop: 12 }}>
          <ApertureMonoLabel>The shape of it</ApertureMonoLabel>
          <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            {brief.bullets.map((b, i) => (
              <li key={i} style={{ paddingTop: i === 0 ? 0 : 12, borderTop: i === 0 ? "none" : "1px solid var(--ap-hairline)" }}>
                <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ap-ink-3)", marginBottom: 4 }}>{b.label}</div>
                <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--ap-ink-1)" }}>{b.value}</div>
              </li>
            ))}
          </ul>
        </ApertureCard>
      )}

      {brief.next_moves.length > 0 && (
        <ApertureCard padding={20} style={{ marginTop: 12 }}>
          <ApertureMonoLabel>First moves</ApertureMonoLabel>
          <ol style={{ margin: "10px 0 0", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            {brief.next_moves.map((m, i) => (
              <li key={i} style={{ fontSize: 14, lineHeight: 1.5, color: "var(--ap-ink-1)" }}>{m}</li>
            ))}
          </ol>
        </ApertureCard>
      )}

      {brief.risks.length > 0 && (
        <ApertureCard padding={20} style={{ marginTop: 12 }}>
          <ApertureMonoLabel>Blind spots</ApertureMonoLabel>
          <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {brief.risks.map((r, i) => (
              <li key={i} style={{
                fontSize: 13.5, lineHeight: 1.5, color: "var(--ap-ink-2)",
                paddingLeft: 12, borderLeft: "2px solid var(--ap-hairline)",
              }}>{r}</li>
            ))}
          </ul>
        </ApertureCard>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
        <ApertureButton variant="accent" onClick={onDone}>Enter Aperture →</ApertureButton>
      </div>
    </>
  );
}