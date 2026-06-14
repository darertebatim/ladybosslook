import { Helmet } from "react-helmet-async";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { AppShell } from "@/aperture/components/AppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureButton, ApertureCard, ApertureChip, ApertureMonoLabel,
} from "@/aperture/components/primitives";
import { getAction } from "@/aperture/data/playbooks";
import { BUCKETS } from "@/aperture/data/buckets";
import { useApertureMemory } from "@/aperture/hooks/useApertureMemory";
import { useApertureChats } from "@/aperture/hooks/useApertureChats";

/**
 * Action page — same route for playbooks (multi-step) and quick prompts (one shot).
 * Either kind ends up as a chat thread, so the user keeps the result.
 */
export default function ActionPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const action = slug ? getAction(slug) : undefined;
  const { buckets, getBucket } = useApertureMemory();
  const { createChat, appendMessage } = useApertureChats();

  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

  if (!action) return <Navigate to="/aperture/brand/mockup/library" replace />;

  const missingBuckets = action.needs
    .map(s => ({ slug: s, state: getBucket(s), meta: BUCKETS.find(b => b.slug === s)! }))
    .filter(b => b.state.status === "empty");

  function handlePromptRun() {
    if (!action) return;
    const thread = createChat(`Quick prompt: ${action.title}`, action.title);
    appendMessage(thread.id, { role: "user", text: action.title });
    setTimeout(() => {
      appendMessage(thread.id, {
        role: "assistant",
        text:
          (action.output ?? "Here's a quick take grounded in your memory.") +
          "\n\n— Want me to revise the tone or length? Just say so.",
      });
      navigate(`/aperture/brand/mockup/chats/${thread.id}`);
    }, 400);
  }

  function handleStepAnswer() {
    if (!action?.steps) return;
    const next = [...answers, draft.trim()];
    setAnswers(next);
    setDraft("");
    if (next.length >= action.steps.length) {
      // Finish playbook → push to chat as a summary
      const thread = createChat(`Playbook: ${action.title}`, action.title);
      appendMessage(thread.id, { role: "user", text: `Ran the "${action.title}" playbook.` });
      const summary =
        `Here's where we landed on "${action.title}":\n\n` +
        action.steps.map((s, i) => `${i + 1}. ${s.prompt}\n   → ${next[i] || "(skipped)"}`).join("\n\n") +
        `\n\nMy take: based on these answers, the next concrete thing to do this week is to pick the smallest version of the easiest answer above and ship it in 48 hours. Reply here if you want me to draft what that looks like.`;
      setTimeout(() => {
        appendMessage(thread.id, { role: "assistant", text: summary });
        navigate(`/aperture/brand/mockup/chats/${thread.id}`);
      }, 300);
    } else {
      setStepIdx(i => i + 1);
    }
  }

  return (
    <>
      <Helmet>
        <title>{action.title} · Aperture</title>
        <meta name="description" content={action.blurb} />
      </Helmet>
      <AppShell>
        <div style={{ marginBottom: 8 }}>
          <Link to="/aperture/brand/mockup/library" style={{ fontSize: 11, color: "var(--ap-ink-3)", textDecoration: "none", fontFamily: "var(--ap-font-mono)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            ← Library
          </Link>
        </div>
        <PageHeader
          index={action.kind === "playbook" ? "PLAYBOOK" : "QUICK PROMPT"}
          title={action.title}
          sub={action.blurb}
          action={
            <div style={{ display: "flex", gap: 8 }}>
              <ApertureChip tone="neutral">{action.category}</ApertureChip>
              <ApertureChip tone="signal">{action.duration}</ApertureChip>
            </div>
          }
        />

        <ApertureCard padding={16} style={{ marginBottom: 18 }}>
          <ApertureMonoLabel color="var(--ap-signal)">Why Aperture picked this</ApertureMonoLabel>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--ap-ink-1)", lineHeight: 1.55 }}>{action.why}</p>
        </ApertureCard>

        {/* What it pulls from */}
        <div style={{ marginBottom: 18 }}>
          <ApertureMonoLabel>Pulls from memory</ApertureMonoLabel>
          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {action.needs.map(slug => {
              const meta = BUCKETS.find(b => b.slug === slug)!;
              const empty = getBucket(slug).status === "empty";
              return (
                <Link
                  key={slug}
                  to={`/aperture/brand/mockup/memory/${slug}`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "5px 10px", borderRadius: 999,
                    background: empty ? "transparent" : "var(--ap-surface-2)",
                    border: `1px ${empty ? "dashed" : "solid"} var(--ap-hairline)`,
                    color: empty ? "var(--ap-ink-3)" : "var(--ap-ink-2)",
                    textDecoration: "none", fontSize: 12,
                  }}
                >
                  <span style={{ fontFamily: "var(--ap-font-mono)" }}>{meta.glyph}</span>
                  {meta.title}{empty && " · empty"}
                </Link>
              );
            })}
          </div>
        </div>

        {missingBuckets.length > 0 && (
          <ApertureCard padding={16} style={{ marginBottom: 18, borderColor: "var(--ap-signal-soft)" }}>
            <ApertureMonoLabel color="var(--ap-signal)">Heads up</ApertureMonoLabel>
            <p style={{ margin: "6px 0 10px", fontSize: 13.5, color: "var(--ap-ink-1)", lineHeight: 1.55 }}>
              This will work better if you fill {missingBuckets.map(b => b.meta.title).join(" + ")} first — but you can run it anyway.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {missingBuckets.map(b => (
                <Link key={b.slug} to={`/aperture/brand/mockup/memory/${b.slug}`} style={{ textDecoration: "none" }}>
                  <ApertureButton variant="ghost">Fill {b.meta.title} →</ApertureButton>
                </Link>
              ))}
            </div>
          </ApertureCard>
        )}

        {/* Run surface */}
        {action.kind === "prompt" ? (
          <ApertureCard padding={20}>
            <ApertureMonoLabel>Preview output</ApertureMonoLabel>
            <p style={{ margin: "10px 0 0", fontSize: 14.5, color: "var(--ap-ink-1)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{action.output}</p>
            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              <ApertureButton variant="accent" onClick={handlePromptRun}>Run & open in chat</ApertureButton>
            </div>
          </ApertureCard>
        ) : (
          <ApertureCard padding={20}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <ApertureMonoLabel>Step {stepIdx + 1} of {action.steps?.length}</ApertureMonoLabel>
              <div style={{ display: "flex", gap: 4 }}>
                {action.steps?.map((_, i) => (
                  <span key={i} style={{ width: 18, height: 3, borderRadius: 2, background: i <= stepIdx ? "var(--ap-signal)" : "var(--ap-hairline-strong)" }} />
                ))}
              </div>
            </div>
            <h3 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 600, color: "var(--ap-ink-1)", letterSpacing: "-0.015em", lineHeight: 1.4 }}>
              {action.steps?.[stepIdx]?.prompt}
            </h3>
            {action.steps?.[stepIdx]?.exampleAnswer && (
              <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "var(--ap-ink-3)", fontStyle: "italic" }}>
                e.g. {action.steps[stepIdx].exampleAnswer}
              </p>
            )}
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={3}
              placeholder="Your answer…"
              style={{
                width: "100%", resize: "vertical",
                appearance: "none", outline: "none",
                background: "var(--ap-surface-2)",
                border: "1px solid var(--ap-hairline)",
                borderRadius: "var(--ap-radius-sm)",
                padding: "10px 12px",
                fontSize: 14, color: "var(--ap-ink-1)",
                fontFamily: "var(--ap-font-sans)", lineHeight: 1.5,
              }}
            />
            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <ApertureButton variant="ghost" onClick={() => { setDraft(""); handleStepAnswer(); }}>
                Skip
              </ApertureButton>
              <ApertureButton variant="accent" onClick={handleStepAnswer}>
                {stepIdx + 1 === action.steps?.length ? "Finish & open in chat" : "Next →"}
              </ApertureButton>
            </div>
          </ApertureCard>
        )}
      </AppShell>
    </>
  );
}