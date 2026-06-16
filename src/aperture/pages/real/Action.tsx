import { Helmet } from "react-helmet-async";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { RealAppShell } from "@/aperture/components/RealAppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureButton, ApertureCard, ApertureChip, ApertureMonoLabel,
} from "@/aperture/components/primitives";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface PlaybookStep {
  prompt: string;
  exampleAnswer?: string;
}

interface ActionRow {
  slug: string;
  kind: "playbook" | "prompt";
  category: string | null;
  title: string;
  blurb: string | null;
  why: string | null;
  duration: string | null;
  needs: string[] | null;
  steps: PlaybookStep[] | null;
  output: string | null;
}

/** Real playbook/prompt run page — backed by aperture_actions + aperture_chats. */
export default function RealAction() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [action, setAction] = useState<ActionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error } = await supabase
        .from("aperture_actions")
        .select("slug,kind,category,title,blurb,why,duration,needs,steps,output,is_published")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error || !data) { setNotFound(true); setLoading(false); return; }
      setAction(data as unknown as ActionRow);
      setLoading(false);
    })();
  }, [slug]);

  const steps = useMemo(() => action?.steps ?? [], [action]);

  if (notFound) return <Navigate to="/aperture/app/library" replace />;

  async function recordRun(chatId: string, status: "completed" | "running", state: unknown) {
    if (!user || !action) return;
    await supabase.from("aperture_action_runs").insert({
      user_id: user.id,
      action_slug: action.slug,
      chat_id: chatId,
      status,
      current_step: stepIdx,
      state: state as never,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    });
  }

  async function runPrompt() {
    if (!user || !action || running) return;
    setRunning(true);
    try {
      const { data: chat, error } = await supabase
        .from("aperture_chats")
        .insert({ user_id: user.id, title: action.title.slice(0, 60) })
        .select("id")
        .single();
      if (error || !chat) throw error ?? new Error("Could not create chat");

      const intro =
        `Ran the **${action.title}** prompt for you.` +
        (action.blurb ? `\n\n${action.blurb}` : "");
      const body = action.output ?? "Here's a quick take grounded in your memory.";

      await supabase.from("aperture_messages").insert([
        { chat_id: chat.id, user_id: user.id, role: "user", content: action.title },
        { chat_id: chat.id, user_id: user.id, role: "assistant", content: `${intro}\n\n---\n\n${body}\n\n---\n\nWant me to tailor this to your business — tone, length, or audience? Just say so.` },
      ]);

      await recordRun(chat.id, "completed", { output: body });
      navigate(`/aperture/app/chats/${chat.id}`);
    } catch (e: any) {
      toast({ title: "Couldn't run prompt", description: e?.message ?? "Try again.", variant: "destructive" });
      setRunning(false);
    }
  }

  async function finishPlaybook(finalAnswers: string[]) {
    if (!user || !action) return;
    setRunning(true);
    try {
      const { data: chat, error } = await supabase
        .from("aperture_chats")
        .insert({ user_id: user.id, title: action.title.slice(0, 60) })
        .select("id")
        .single();
      if (error || !chat) throw error ?? new Error("Could not create chat");

      const summary =
        `Finished the **${action.title}** playbook. Here's what you said:\n\n` +
        steps.map((s, i) => `**${i + 1}. ${s.prompt}**\n→ ${finalAnswers[i]?.trim() || "_(skipped)_"}`).join("\n\n") +
        `\n\n---\n\nLet's turn this into action. Reply with what you want me to do next — draft the message, build the plan, or pressure-test the idea.`;

      await supabase.from("aperture_messages").insert([
        { chat_id: chat.id, user_id: user.id, role: "user", content: `Ran the "${action.title}" playbook.` },
        { chat_id: chat.id, user_id: user.id, role: "assistant", content: summary },
      ]);

      await recordRun(chat.id, "completed", { answers: finalAnswers });
      navigate(`/aperture/app/chats/${chat.id}`);
    } catch (e: any) {
      toast({ title: "Couldn't finish playbook", description: e?.message ?? "Try again.", variant: "destructive" });
      setRunning(false);
    }
  }

  function handleStepAnswer(skip = false) {
    const value = skip ? "" : draft.trim();
    const next = [...answers, value];
    setAnswers(next);
    setDraft("");
    if (next.length >= steps.length) {
      void finishPlaybook(next);
    } else {
      setStepIdx(i => i + 1);
    }
  }

  return (
    <>
      <Helmet>
        <title>{action?.title ?? "Action"} · Aperture</title>
        {action?.blurb && <meta name="description" content={action.blurb} />}
      </Helmet>
      <RealAppShell>
        <div style={{ marginBottom: 8 }}>
          <Link to="/aperture/app/library" style={{ fontSize: 11, color: "var(--ap-ink-3)", textDecoration: "none", fontFamily: "var(--ap-font-mono)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            ← Library
          </Link>
        </div>

        {loading || !action ? (
          <ApertureMonoLabel>Loading…</ApertureMonoLabel>
        ) : (
          <>
            <PageHeader
              index={action.kind === "playbook" ? "PLAYBOOK" : "QUICK PROMPT"}
              title={action.title}
              sub={action.blurb ?? undefined}
              action={
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {action.category && <ApertureChip tone="neutral">{action.category}</ApertureChip>}
                  {action.duration && <ApertureChip tone="signal">{action.duration}</ApertureChip>}
                </div>
              }
            />

            {action.why && (
              <ApertureCard padding={16} style={{ marginBottom: 18 }}>
                <ApertureMonoLabel color="var(--ap-signal)">Why this matters</ApertureMonoLabel>
                <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--ap-ink-1)", lineHeight: 1.55 }}>{action.why}</p>
              </ApertureCard>
            )}

            {action.kind === "prompt" ? (
              <ApertureCard padding={20}>
                <ApertureMonoLabel>Preview</ApertureMonoLabel>
                <p style={{ margin: "10px 0 0", fontSize: 14.5, color: "var(--ap-ink-1)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {action.output ?? "Aperture will draft this from your memory when you run it."}
                </p>
                <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                  <ApertureButton variant="accent" onClick={runPrompt} disabled={running}>
                    {running ? "Running…" : "Run & open in chat"}
                  </ApertureButton>
                </div>
              </ApertureCard>
            ) : steps.length === 0 ? (
              <ApertureCard padding={20}>
                <p style={{ margin: 0, fontSize: 14, color: "var(--ap-ink-2)" }}>
                  This playbook hasn't been authored with steps yet.
                </p>
              </ApertureCard>
            ) : (
              <ApertureCard padding={20}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <ApertureMonoLabel>Step {stepIdx + 1} of {steps.length}</ApertureMonoLabel>
                  <div style={{ display: "flex", gap: 4 }}>
                    {steps.map((_, i) => (
                      <span key={i} style={{ width: 18, height: 3, borderRadius: 2, background: i <= stepIdx ? "var(--ap-signal)" : "var(--ap-hairline-strong)" }} />
                    ))}
                  </div>
                </div>
                <h3 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 600, color: "var(--ap-ink-1)", letterSpacing: "-0.015em", lineHeight: 1.4 }}>
                  {steps[stepIdx]?.prompt}
                </h3>
                {steps[stepIdx]?.exampleAnswer && (
                  <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "var(--ap-ink-3)", fontStyle: "italic" }}>
                    e.g. {steps[stepIdx].exampleAnswer}
                  </p>
                )}
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  rows={3}
                  placeholder="Your answer…"
                  disabled={running}
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
                  <ApertureButton variant="ghost" onClick={() => handleStepAnswer(true)} disabled={running}>
                    Skip
                  </ApertureButton>
                  <ApertureButton variant="accent" onClick={() => handleStepAnswer(false)} disabled={running || !draft.trim()}>
                    {stepIdx + 1 === steps.length ? (running ? "Finishing…" : "Finish & open in chat") : "Next →"}
                  </ApertureButton>
                </div>
              </ApertureCard>
            )}
          </>
        )}
      </RealAppShell>
    </>
  );
}