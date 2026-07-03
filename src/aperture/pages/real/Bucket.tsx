import { Helmet } from "react-helmet-async";
import { Link, useParams, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { RealAppShell } from "@/aperture/components/RealAppShell";
import { PageHeader } from "@/aperture/components/PageHeader";
import {
  ApertureCard, ApertureMonoLabel, ApertureLoading, ApertureButton,
} from "@/aperture/components/primitives";
import { useApertureBucketsDB } from "@/aperture/hooks/db/useApertureBucketsDB";
import type { ApertureQuestionRow } from "@/aperture/hooks/db/useApertureBucketsDB";
import {
  useApertureMemoryDB, type MemoryItem,
} from "@/aperture/hooks/db/useApertureMemoryDB";
import { useApertureChatsDB } from "@/aperture/hooks/db/useApertureChatsDB";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MemorySourcePill } from "@/aperture/components/MemorySourcePill";
import { composeBucketSpecificOpener } from "@/aperture/lib/composeOpener";
import { BriefCard } from "@/aperture/components/BriefCard";
import { Check, Pencil, Trash2, Clock, X } from "lucide-react";

/**
 * Bucket detail — readable, correctable record of what RiloBiz knows
 * about this territory of the user's business. Replaces the old static
 * Q&A form. Two surfaces:
 *
 *   1. Continue chat CTA → opens a `bucket_specific` chat scoped here.
 *   2. Fact view        → every memory item in this bucket, with source
 *                         pills, timestamps, edit/confirm/delete actions,
 *                         and a per-slot History expander.
 */
export default function RealBucketPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { buckets, questionsFor, loading: bLoading } = useApertureBucketsDB();
  const memory = useApertureMemoryDB();
  const { createChat } = useApertureChatsDB();
  const [starting, setStarting] = useState(false);

  const bucket = slug ? buckets.find(b => b.slug === slug) : undefined;
  const questions = slug ? questionsFor(slug) : [];

  // Question prompts live in TWO tables: `aperture_bucket_questions`
  // (post-onboarding designed Qs) and `aperture_onboarding_questions`
  // (the quick + full onboarding questionnaire). Bucket answers carry
  // `question_key`s that can come from either, so we merge both into a
  // single lookup to render plain-language labels in the Fact View.
  const [onbPrompts, setOnbPrompts] = useState<Record<string, string>>({});
  useEffect(() => {
    let alive = true;
    void supabase
      .from("aperture_onboarding_questions")
      .select("question_key,prompt")
      .then(({ data }) => {
        if (!alive || !data) return;
        const map: Record<string, string> = {};
        for (const r of data as any[]) map[r.question_key] = r.prompt;
        setOnbPrompts(map);
      });
    return () => { alive = false; };
  }, []);

  // Wave questions (Wave 2+) are generated per-user by the selector and stored
  // as `question_payload` on `aperture_waves`. They don't live in either of the
  // static prompt tables, so we merge in the actual `question_text` for every
  // wave question this user has seen — that way the label above a fact is the
  // real question the AI asked, not a title-cased key.
  const [wavePrompts, setWavePrompts] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!user) return;
    let alive = true;
    void supabase
      .from("aperture_waves")
      .select("question_payload")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (!alive || !data) return;
        const map: Record<string, string> = {};
        for (const row of data as any[]) {
          const qs = row?.question_payload?.questions;
          if (!Array.isArray(qs)) continue;
          for (const q of qs) {
            if (q?.id && typeof q.question_text === "string") {
              map[q.id] = q.question_text;
            }
          }
        }
        setWavePrompts(map);
      });
    return () => { alive = false; };
  }, [user]);

  const promptFor = useMemo(() => {
    const map: Record<string, string> = { ...onbPrompts, ...wavePrompts };
    for (const q of questions) map[q.question_key] = q.prompt;
    return map;
  }, [questions, onbPrompts, wavePrompts]);

  // Log a bucket_visit signal on mount — feeds the (future) relevance scorer.
  useEffect(() => {
    if (!user || !slug) return;
    void supabase.from("aperture_user_bucket_signals").insert({
      user_id: user.id,
      bucket_slug: slug,
      signal_type: "bucket_visit",
    });
  }, [user, slug]);

  const facts = useMemo(
    () => memory.items
      .filter(i => i.bucket_slug === slug)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
    [memory.items, slug],
  );

  async function continueChat() {
    if (!bucket || starting) return;
    setStarting(true);
    // Opener B: reference the most recent confirmed fact (never a guess).
    // Falls back to the bucket's designed opening question, then to a
    // neutral prompt if neither exists.
    const confirmedSources = new Set(["user_confirmed", "chat_extracted", "ai_extracted", "bucket_answer"]);
    const recent = facts.find(f => confirmedSources.has(f.source as string)) ?? null;
    const designed = [...questions].sort((a, b) => a.sort_order - b.sort_order)[0]?.prompt ?? null;
    const opener = composeBucketSpecificOpener(
      { title: bucket.title },
      recent ? { content: recent.content, source: recent.source } : null,
      designed,
    );
    const chat = await createChat({
      title: `${bucket.title} · chat`,
      entry_point: "bucket_specific",
      bucket_slug: bucket.slug,
      opener,
    });
    setStarting(false);
    if (chat) navigate(`/app/rilobiz/app/chats/${chat.id}`);
  }

  if (bLoading) return <RealAppShell><ApertureLoading label="Loading bucket…" /></RealAppShell>;
  if (!slug) return <Navigate to="/app/rilobiz/app/memory" replace />;
  if (!bucket) return <Navigate to="/app/rilobiz/app/memory" replace />;

  // Split the "What I know" counter into three trust tiers, matching the
  // MemorySourcePill styling. Direct = the user said it. Noticed = the AI
  // pulled it from a chat/file/site. Guess = pre-onboarding inference.
  const DIRECT_SOURCES = new Set(["user_confirmed", "bucket_answer", "chat_extracted"]);
  const NOTICED_SOURCES = new Set(["ai_extracted", "file_extracted", "mcp_extracted", "freeform"]);
  const directCount = facts.filter(f => DIRECT_SOURCES.has(f.source as string)).length;
  const noticedCount = facts.filter(f => NOTICED_SOURCES.has(f.source as string)).length;
  const guessCount = facts.filter(f => f.source === "ai_inferred_pre_onboarding").length;
  const counterSegments = [
    directCount > 0 ? `${directCount} confirmed` : null,
    noticedCount > 0 ? `${noticedCount} noticed` : null,
    guessCount > 0 ? `${guessCount} guess${guessCount === 1 ? "" : "es"}` : null,
  ].filter(Boolean);
  const counterLabel = counterSegments.length > 0 ? counterSegments.join(" · ") : "0 confirmed";
  // Keep an aggregate for the chat CTA copy ("pick up where we left off").
  const confirmedCount = directCount + noticedCount;

  return (
    <>
      <Helmet><title>{bucket.title} · Memory · RiloBiz</title></Helmet>
      <RealAppShell>
        <div style={{ marginBottom: 8 }}>
          <Link to="/app/rilobiz/app/memory" style={{
            fontSize: 11, color: "var(--ap-ink-3)", textDecoration: "none",
            fontFamily: "var(--ap-font-mono)", textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}>
            ← All buckets
          </Link>
        </div>
        <PageHeader
          index={`BUCKET · ${bucket.source.toUpperCase()}`}
          title={bucket.title}
          sub={bucket.blurb ?? ""}
        />

        {/* Conversation + Brief CTA row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12, marginBottom: 18,
        }}>
          <ApertureCard padding={16}>
            <ApertureMonoLabel>Conversation</ApertureMonoLabel>
            <h3 style={{ margin: "6px 0 4px", fontSize: 15, fontWeight: 600, color: "var(--ap-ink-1)" }}>
              Continue chat about {bucket.title}
            </h3>
            <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "var(--ap-ink-2)", lineHeight: 1.5 }}>
              {confirmedCount > 0
                ? "I'll pick up where we left off — what's changed, or what's on your mind here now?"
                : "Let's open this up. I'll ask the first question and we'll go from there."}
            </p>
            <ApertureButton variant="accent" onClick={continueChat} disabled={starting}>
              {starting ? "Opening…" : "Start →"}
            </ApertureButton>
          </ApertureCard>

          <BriefCard
            label="Brief"
            title={`What I know about ${bucket.title}`}
            teaser="A short read-back of what I've pieced together for this bucket. Reset anytime to refresh."
            load={async () => {
              if (!user || !slug) return null;
              const { data } = await supabase
                .from("aperture_bucket_briefs")
                .select("summary,generated_at")
                .eq("user_id", user.id).eq("bucket_slug", slug)
                .maybeSingle();
              return data ? { summary: (data as any).summary, generated_at: (data as any).generated_at } : null;
            }}
            regenerate={async () => {
              if (!slug) throw new Error("Missing bucket");
              const { data, error } = await supabase.functions.invoke("aperture-bucket-brief", {
                body: { bucket_slug: slug, force: true },
              });
              if (error) throw new Error(error.message);
              const b = (data as any)?.brief;
              if (!b) throw new Error("No brief returned");
              return { summary: b.summary, generated_at: b.generated_at };
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
          <ApertureMonoLabel>What I know</ApertureMonoLabel>
          <span style={{ fontSize: 11, color: "var(--ap-ink-3)" }}>
            {counterLabel}
          </span>
        </div>

        {memory.loading ? (
          <ApertureLoading label="Loading what I know…" />
        ) : facts.length === 0 ? (
          <ApertureCard padding={20}>
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--ap-ink-2)", lineHeight: 1.55 }}>
              Nothing here yet. Start a chat above — anything you share will show up here.
            </p>
          </ApertureCard>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {facts.map(f => (
              <FactRow key={f.id} fact={f} memory={memory} promptFor={promptFor} />
            ))}
          </div>
        )}
      </RealAppShell>
    </>
  );
}

function FactRow({
  fact,
  memory,
  promptFor,
}: {
  fact: MemoryItem;
  memory: ReturnType<typeof useApertureMemoryDB>;
  promptFor: Record<string, string>;
}) {
  const isGuess = fact.source === "ai_inferred_pre_onboarding";
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [draft, setDraft] = useState(fact.content);
  const [busy, setBusy] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<MemoryItem[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => { setDraft(fact.content); }, [fact.content]);

  async function loadHistory() {
    if (historyLoaded) { setShowHistory(s => !s); return; }
    const rows = await memory.historyFor(fact.bucket_slug ?? "", fact.question_key);
    // Exclude the row itself — show only prior versions.
    setHistory(rows.filter(r => r.id !== fact.id));
    setHistoryLoaded(true);
    setShowHistory(true);
  }

  async function onConfirm() {
    setBusy(true);
    try { await memory.confirmGuess(fact.id); } finally { setBusy(false); }
  }
  async function onSaveEdit() {
    if (!draft.trim() || draft.trim() === fact.content.trim()) {
      setMode("view"); return;
    }
    setBusy(true);
    try { await memory.editFact(fact.id, draft.trim()); setMode("view"); }
    finally { setBusy(false); }
  }
  async function onDelete() {
    if (!confirm("Remove this from memory? (It stays in history.)")) return;
    setBusy(true);
    try { await memory.deactivateFact(fact.id); } finally { setBusy(false); }
  }

  const when = relativeTime(fact.updated_at);
  // Plain-language label for what this fact answers. Without it, raw values
  // like "4155428062" or "Irvine" sit on the page with no context.
  // Only show a question label when we have the real prompt text. If the
  // lookup misses (unknown key, new question surface not wired up yet), omit
  // the label rather than leaking a title-cased internal key like
  // "W2 Q9 AD STATUS" — a missing label is invisible; a mangled one is not.
  const questionLabel = fact.question_key
    ? (promptFor[fact.question_key] ?? null)
    : null;

  return (
    <ApertureCard
      padding={14}
      style={{
        opacity: isGuess ? 0.78 : 1,
        borderStyle: isGuess ? "dashed" : undefined,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <MemorySourcePill source={fact.source} />
          {fact.source_kind === "website" && (
            <span style={{
              fontSize: 10, color: "var(--ap-ink-3)",
              fontFamily: "var(--ap-font-mono)",
              textTransform: "uppercase", letterSpacing: "0.08em",
              padding: "2px 6px", borderRadius: 4,
              background: "var(--ap-surface-2)", border: "1px solid var(--ap-hairline)",
            }}>🌐 website</span>
          )}
          {fact.source_kind === "instagram" && (
            <span style={{
              fontSize: 10, color: "var(--ap-ink-3)",
              fontFamily: "var(--ap-font-mono)",
              textTransform: "uppercase", letterSpacing: "0.08em",
              padding: "2px 6px", borderRadius: 4,
              background: "var(--ap-surface-2)", border: "1px solid var(--ap-hairline)",
            }}>📷 instagram</span>
          )}
        </div>
        <span
          title={new Date(fact.updated_at).toLocaleString()}
          style={{ fontSize: 11, color: "var(--ap-ink-3)", fontFamily: "var(--ap-font-mono)" }}
        >
          {when}
        </span>
      </div>

      {mode === "edit" ? (
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={3}
          autoFocus
          style={{
            width: "100%", resize: "vertical", outline: "none",
            background: "var(--ap-surface-2)",
            border: "1px solid var(--ap-hairline)",
            borderRadius: "var(--ap-radius-sm)",
            padding: "10px 12px",
            fontSize: 14, color: "var(--ap-ink-1)",
            fontFamily: "var(--ap-font-sans)", lineHeight: 1.5,
          }}
        />
      ) : (
        <>
          {questionLabel && (
            <div style={{
              fontSize: 11, color: "var(--ap-ink-3)",
              fontFamily: "var(--ap-font-mono)",
              textTransform: "uppercase", letterSpacing: "0.10em",
              marginBottom: 4, lineHeight: 1.4,
            }}>
              {questionLabel.replace(/\?$/, "")}
            </div>
          )}
          <p style={{
            margin: 0, fontSize: 14, color: "var(--ap-ink-1)", lineHeight: 1.5,
            fontStyle: isGuess ? "italic" : "normal",
          }}>
            {fact.content}
          </p>
        </>
      )}

      <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        {mode === "edit" ? (
          <>
            <ApertureButton variant="accent" size="sm" onClick={onSaveEdit} disabled={busy}>
              <Check size={12} /> Save
            </ApertureButton>
            <ApertureButton variant="ghost" size="sm" onClick={() => { setMode("view"); setDraft(fact.content); }} disabled={busy}>
              <X size={12} /> Cancel
            </ApertureButton>
          </>
        ) : (
          <>
            {isGuess && (
              <ApertureButton variant="accent" size="sm" onClick={onConfirm} disabled={busy}>
                <Check size={12} /> Confirm
              </ApertureButton>
            )}
            <ApertureButton variant="default" size="sm" onClick={() => setMode("edit")} disabled={busy}>
              <Pencil size={12} /> Edit
            </ApertureButton>
            <ApertureButton variant="ghost" size="sm" onClick={onDelete} disabled={busy}>
              <Trash2 size={12} /> Delete
            </ApertureButton>
            <button
              type="button"
              onClick={loadHistory}
              style={{
                marginLeft: "auto",
                appearance: "none", background: "none", border: "none",
                cursor: "pointer", color: "var(--ap-ink-3)",
                fontFamily: "var(--ap-font-mono)", fontSize: 10,
                letterSpacing: "0.12em", textTransform: "uppercase",
                display: "inline-flex", alignItems: "center", gap: 4,
              }}
            >
              <Clock size={11} /> History
            </button>
          </>
        )}
      </div>

      {showHistory && (
        <div style={{
          marginTop: 12, paddingTop: 10,
          borderTop: "1px solid var(--ap-hairline)",
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          {history.length === 0 ? (
            <span style={{ fontSize: 12, color: "var(--ap-ink-3)" }}>No prior versions.</span>
          ) : history.map(h => (
            <div key={h.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 10.5, color: "var(--ap-ink-3)", fontFamily: "var(--ap-font-mono)", minWidth: 84 }}>
                {relativeTime(h.updated_at)}
              </span>
              <span style={{ fontSize: 13, color: "var(--ap-ink-2)", lineHeight: 1.5, textDecoration: h.is_active ? "none" : "line-through" }}>
                {h.content}
              </span>
            </div>
          ))}
        </div>
      )}
    </ApertureCard>
  );
}

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const sec = Math.round(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.round(mo / 12)}y ago`;
}
