import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  ApertureCard, ApertureChip, ApertureMonoLabel, ApertureButton, ApertureSectionTitle, ApertureLoading,
} from "@/aperture/components/primitives";
import { TOOL_CATEGORY_GROUPS, bucketForCategory } from "@/aperture/data/tools";
import { ChevronDown, ChevronUp, Sparkles, Check } from "lucide-react";

type CardKind = "tool" | "gap_nothing" | "gap_manual" | "multi";

interface CardDef {
  key: string;             // unique card_key
  kind: CardKind;
  label: string;           // display title
  category: string;
  bucket_slug: string;
  related_tools?: string[]; // for multi cards
  priority: number;         // lower = higher priority (0-1 expanded by default)
}

interface QRow {
  id: string;
  card_key: string;
  row_kind: "question" | "suggestion";
  question_index: number;
  question_text: string;
  answer_text: string | null;
  generation_batch: number;
  is_active: boolean;
  options: string[];
  open_field: boolean;
}

interface Props {
  userToolRows: {
    tool_slug: string;
    tool_name: string;
    category: string | null;
    custom: boolean;
    is_active: boolean;
  }[];
}

/**
 * Wave B — one card per active tool, per gap, or per multi-tool category.
 * Cards render collapsed. Tapping opens; first open generates 3 questions.
 * Answering all 3 unlocks 3 suggestions. "Ask me something new" regenerates.
 */
export function LivingToolCards({ userToolRows }: Props) {
  const { user } = useAuth();
  const [rows, setRows] = useState<QRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({}); // key = row id
  const [picks, setPicks] = useState<Record<string, string[]>>({}); // key = row id -> selected option labels
  // Batch "quick pass" mode: when true, saving an answer auto-advances to the
  // next card that still has an unanswered question, so the user can burn
  // through the queue in one pass without leaving Tools.
  const [batchMode, setBatchMode] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("aperture_tool_card_questions")
      .select("id,card_key,row_kind,question_index,question_text,answer_text,generation_batch,is_active,options,open_field")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("generation_batch", { ascending: true })
      .order("question_index", { ascending: true });
    setRows(((data ?? []) as any[]).map((r) => ({
      ...r,
      options: Array.isArray(r.options) ? r.options : [],
      open_field: r.open_field !== false,
    })) as QRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // Build card list from active picks.
  const cards: CardDef[] = useMemo(() => {
    const out: CardDef[] = [];
    let priorityCursor = 0;
    TOOL_CATEGORY_GROUPS.forEach((cat) => {
      const rowsHere = userToolRows.filter(
        (r) => r.is_active && r.category === cat.label,
      );
      const realTools = rowsHere.filter(
        (r) => !r.tool_slug.startsWith("nothing_yet__") && !r.tool_slug.startsWith("spreadsheet_or_notes__"),
      );
      const marker = rowsHere.find(
        (r) => r.tool_slug.startsWith("nothing_yet__") || r.tool_slug.startsWith("spreadsheet_or_notes__"),
      );
      const bucket = bucketForCategory(cat.label);
      if (realTools.length === 0 && !marker) return; // nothing picked, no gap card
      if (realTools.length === 0 && marker) {
        const kind: CardKind = marker.tool_slug.startsWith("nothing_yet__") ? "gap_nothing" : "gap_manual";
        out.push({
          key: `gap:${cat.label}`,
          kind,
          label: kind === "gap_nothing"
            ? `${cat.label} — nothing yet`
            : `${cat.label} — spreadsheet / notes`,
          category: cat.label,
          bucket_slug: bucket,
          priority: priorityCursor++,
        });
        return;
      }
      realTools.forEach((t) => {
        out.push({
          key: `tool:${t.tool_slug}`,
          kind: "tool",
          label: t.tool_name,
          category: cat.label,
          bucket_slug: bucket,
          priority: priorityCursor++,
        });
      });
      if (realTools.length >= 2) {
        out.push({
          key: `multi:${cat.label}`,
          kind: "multi",
          label: `${cat.label} — how ${realTools.map((r) => r.tool_name).join(" + ")} split the work`,
          category: cat.label,
          bucket_slug: bucket,
          related_tools: realTools.map((r) => r.tool_name),
          priority: priorityCursor++,
        });
      }
    });
    return out;
  }, [userToolRows]);

  const rowsByCard = useMemo(() => {
    const m = new Map<string, QRow[]>();
    rows.forEach((r) => {
      const arr = m.get(r.card_key) ?? [];
      arr.push(r);
      m.set(r.card_key, arr);
    });
    return m;
  }, [rows]);

  // Unanswered generated questions across all cards — for batch aggregator.
  const unansweredQs = useMemo(
    () => rows.filter((r) => r.row_kind === "question" && !r.answer_text),
    [rows],
  );
  const showBatch = unansweredQs.length >= 7;

  async function generate(card: CardDef, mode: "questions" | "suggestions" | "more_questions") {
    if (!user) return;
    setBusy(card.key + ":" + mode);
    try {
      const { error } = await supabase.functions.invoke("aperture-tool-card-generate", {
        body: {
          card_key: card.key,
          card_kind: card.kind,
          card_label: card.label,
          category: card.category,
          bucket_slug: card.bucket_slug,
          related_tools: card.related_tools ?? [],
          mode,
        },
      });
      if (error) console.error(error);
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  async function saveAnswer(card: CardDef, row: QRow) {
    if (!user) return;
    const selected = picks[row.id] ?? [];
    const typed = (drafts[row.id] ?? "").trim();
    const parts = [...selected];
    if (typed) parts.push(typed);
    const val = parts.join(", ").trim();
    if (!val) return;
    setBusy(row.id);
    try {
      await supabase
        .from("aperture_tool_card_questions")
        .update({ answer_text: val, answered_at: new Date().toISOString() })
        .eq("id", row.id);
      // Write fact to memory
      await supabase.from("aperture_memory_items").insert({
        user_id: user.id,
        content: `${row.question_text} — ${val}`,
        source: "user_confirmed",
        bucket_slug: card.bucket_slug,
        question_key: `tool_card__${card.key}__b${row.generation_batch}__i${row.question_index}`,
      } as any);
      setDrafts((d) => ({ ...d, [row.id]: "" }));
      setPicks((p) => ({ ...p, [row.id]: [] }));
      await refresh();
      // Auto-generate suggestions when all 3 in latest batch answered and none exist yet
      const cardRows = [...(rowsByCard.get(card.key) ?? []).filter((r) => r.id !== row.id), { ...row, answer_text: val }];
      const latestBatch = Math.max(...cardRows.filter((r) => r.row_kind === "question").map((r) => r.generation_batch), 1);
      const latestQs = cardRows.filter((r) => r.row_kind === "question" && r.generation_batch === latestBatch);
      const allAnswered = latestQs.length >= 3 && latestQs.every((r) => (r.id === row.id ? true : !!r.answer_text));
      const hasSugs = cardRows.some((r) => r.row_kind === "suggestion");
      if (allAnswered && !hasSugs) {
        await generate(card, "suggestions");
      }
      // Batch mode: hop to the next unanswered question across all cards.
      if (batchMode) {
        const remaining = rows.filter(
          (r) => r.row_kind === "question" && !r.answer_text && r.id !== row.id,
        );
        if (remaining.length > 0) {
          setOpenKey(remaining[0].card_key);
        } else {
          setBatchMode(false);
        }
      }
    } finally {
      setBusy(null);
    }
  }

  if (loading && cards.length === 0) return null;
  if (cards.length === 0) return null;

  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 10 }}>
        <ApertureSectionTitle
          index="LIVING CARDS"
          title="Your stack, one card at a time"
          sub="Tap a card to answer 3 quick questions. I'll then hand you 3 RiloBiz-native moves."
        />
      </div>

      {showBatch && (
        <ApertureCard padding={14} style={{ marginBottom: 12, background: "var(--ap-signal-soft)", border: "1px solid var(--ap-signal)" }}>
          <ApertureMonoLabel>Quick pass</ApertureMonoLabel>
          <h4 style={{ margin: "4px 0 8px", fontSize: 14, fontWeight: 600, color: "var(--ap-ink-1)" }}>
            You've got {unansweredQs.length} quick questions waiting — answer them in one pass?
          </h4>
          <ApertureButton
            variant="ghost"
            size="sm"
            onClick={() => {
              const first = unansweredQs[0];
              if (first) {
                setBatchMode(true);
                setOpenKey(first.card_key);
                // Scroll target card into view + focus its first empty answer.
                requestAnimationFrame(() => {
                  setTimeout(() => {
                    const el = document.querySelector<HTMLElement>(
                      `[data-card-key="${CSS.escape(first.card_key)}"]`,
                    );
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "start" });
                      const ta = el.querySelector<HTMLTextAreaElement>("textarea");
                      if (ta) ta.focus({ preventScroll: true });
                    }
                  }, 60);
                });
              }
            }}
          >
            {batchMode ? "In quick pass — keep going →" : "Start quick pass →"}
          </ApertureButton>
        </ApertureCard>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {cards.map((card) => {
          const isOpen = openKey === card.key || card.priority < 2;
          const cardRows = rowsByCard.get(card.key) ?? [];
          const latestBatch = Math.max(1, ...cardRows.filter((r) => r.row_kind === "question").map((r) => r.generation_batch));
          const questions = cardRows.filter((r) => r.row_kind === "question" && r.generation_batch === latestBatch);
          const suggestions = cardRows.filter((r) => r.row_kind === "suggestion");
          const allAnswered = questions.length >= 3 && questions.every((q) => !!q.answer_text);

          const kindTag =
            card.kind === "tool" ? "TOOL" :
            card.kind === "gap_nothing" ? "GAP" :
            card.kind === "gap_manual" ? "MANUAL" : "MULTI";

          return (
            <ApertureCard key={card.key} padding={14} data-card-key={card.key}>
              <button
                type="button"
                onClick={() => setOpenKey(isOpen ? null : card.key)}
                style={{
                  appearance: "none", background: "transparent", border: 0, padding: 0,
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 10, cursor: "pointer", textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <ApertureChip tone={card.kind === "tool" ? "signal" : "neutral"}>{kindTag}</ApertureChip>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ap-ink-1)", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {card.label}
                  </span>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {isOpen && (
                <div style={{ marginTop: 12 }}>
                  {questions.length === 0 ? (
                    <ApertureButton
                      variant="accent"
                      size="sm"
                      onClick={() => generate(card, "questions")}
                      loading={busy === card.key + ":questions"}
                    >
                      <Sparkles size={13} /> {busy === card.key + ":questions" ? "Thinking…" : "Generate 3 questions"}
                    </ApertureButton>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {questions.map((q, idx) => (
                        <div key={q.id}>
                          <div style={{ fontSize: 13, color: "var(--ap-ink-1)", fontWeight: 500, marginBottom: 6 }}>
                            {idx + 1}. {q.question_text}
                          </div>
                          {q.answer_text ? (
                            <div style={{
                              display: "flex", alignItems: "flex-start", gap: 6,
                              padding: "8px 10px", borderRadius: 8,
                              background: "var(--ap-surface-2)", color: "var(--ap-ink-2)", fontSize: 12.5,
                            }}>
                              <Check size={13} style={{ marginTop: 2, color: "var(--ap-signal)" }} />
                              <span>{q.answer_text}</span>
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: 6 }}>
                              <textarea
                                value={drafts[q.id] ?? ""}
                                onChange={(e) => setDrafts((d) => ({ ...d, [q.id]: e.target.value }))}
                                placeholder="Your answer…"
                                rows={2}
                                style={{
                                  flex: 1, padding: "8px 10px",
                                  borderRadius: 8,
                                  border: "1px solid var(--ap-hairline-strong)",
                                  background: "var(--ap-surface-1)", color: "var(--ap-ink-1)",
                                  fontSize: 13, fontFamily: "var(--ap-font-sans)", resize: "vertical",
                                }}
                              />
                              <ApertureButton
                                variant="ghost"
                                size="sm"
                                onClick={() => saveAnswer(card, q)}
                                loading={busy === q.id}
                                disabled={!(drafts[q.id] ?? "").trim()}
                              >
                                Save
                              </ApertureButton>
                            </div>
                          )}
                        </div>
                      ))}

                      {allAnswered && (
                        <div style={{ marginTop: 4, borderTop: "1px dashed var(--ap-hairline)", paddingTop: 12 }}>
                          <ApertureMonoLabel>Suggestions</ApertureMonoLabel>
                          {suggestions.length === 0 ? (
                            <div style={{ marginTop: 8 }}>
                              <ApertureButton
                                variant="accent"
                                size="sm"
                                onClick={() => generate(card, "suggestions")}
                                loading={busy === card.key + ":suggestions"}
                              >
                                <Sparkles size={13} /> {busy === card.key + ":suggestions" ? "Thinking…" : "Show 3 suggestions"}
                              </ApertureButton>
                            </div>
                          ) : (
                            <ul style={{ margin: "8px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                              {suggestions.map((s, i) => (
                                <li key={s.id} style={{
                                  padding: "10px 12px",
                                  borderRadius: 8,
                                  background: "var(--ap-signal-soft)",
                                  color: "var(--ap-ink-1)", fontSize: 13, lineHeight: 1.5,
                                }}>
                                  <strong style={{ color: "var(--ap-signal)", marginRight: 6 }}>{i + 1}.</strong>
                                  {s.question_text}
                                </li>
                              ))}
                            </ul>
                          )}
                          <div style={{ marginTop: 12 }}>
                            <ApertureButton
                              variant="ghost"
                              size="sm"
                              onClick={() => generate(card, "more_questions")}
                              loading={busy === card.key + ":more_questions"}
                            >
                              <Sparkles size={13} /> {busy === card.key + ":more_questions" ? "Thinking…" : "Ask me something new"}
                            </ApertureButton>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </ApertureCard>
          );
        })}
      </div>
    </section>
  );
}