import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, AI_GATEWAY, DEFAULT_MODEL, logAiUsage } from "../_shared/aperture-cors.ts";

/**
 * aperture-tool-card-generate
 *
 * Generates a small structured payload for one Tools-page card, on demand.
 *
 * Request body:
 *   {
 *     card_key: string,         // e.g. "tool:quickbooks__accounting" | "gap:Payments" | "multi:Payments"
 *     card_kind: "tool"|"gap_nothing"|"gap_manual"|"multi",
 *     card_label: string,       // tool name, category name, etc.
 *     category: string,         // display category (e.g. "Payments")
 *     bucket_slug: string,      // memory bucket for facts
 *     mode: "questions"|"suggestions"|"more_questions",
 *     related_tools?: string[], // for multi: the tools in the category
 *     batch?: number,           // for more_questions: batch number
 *     prior_qa?: { q: string; a: string|null }[], // context for regen
 *   }
 *
 * Response for questions: { questions: [{text}, {text}, {text}], batch }
 * Response for suggestions: { suggestions: [{text}, {text}, {text}] }
 */

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

const SYSTEM = `You are the RiloBiz Tools coach. RiloBiz is a business memory system for small business owners; it is NOT a referral service. You generate short, specific payloads for one Tools-page card at a time.

RULES for QUESTIONS:
- Return exactly 3 questions.
- Question 1 is ALWAYS a satisfaction/priority check ("Are you happy with…", "Is this something you'd change or is it fine?"), never assume something is broken.
- Questions 2 and 3 vary by card_kind:
    tool -> usage depth (are they using core value or just basics?)
    gap_nothing -> current situation (how they track it now — memory, paper, nothing)
    gap_manual -> what the spreadsheet/notes actually covers, how often updated
    multi -> intentional split vs redundancy, what each tool specifically handles
- Each question is one sentence, plain language, answerable in a short text box.

QUESTION FORMAT RULE (per question — MUST decide for each):
- Question 1 (satisfaction/priority check) is ALWAYS open_field: true, options: []. Never force options on Q1.
- For every OTHER question (Q2, Q3, and any more_questions follow-ups), apply this test:
    • If it's OPERATIONAL or DIAGNOSTIC (asking what the user is doing, using, or measuring — e.g. "are you using the pixel, custom audiences, and A/B tests, or mainly just boosting posts?"), generate 4–6 short tappable "options" in the user's own voice — direct, specific, spoken-language phrases they might actually say. Also set open_field: false. The UI adds "Skip" and an open-text fallback itself; do NOT include them.
    • If it's PERSONAL or REFLECTIVE ("in your own words", opinion, story, "how do you feel about X"), set open_field: true and options: [] — no options.
- Never rewrite a question that already implies a fixed set of answers into freeform text.
- Multi-tool card questions follow the same test — "different jobs or is one redundant?" is diagnostic → options + open_field:false; any personal follow-up stays open_field:true.

RULES for SUGGESTIONS:
- Return exactly 3 suggestions.
- Suggestion 1 ALWAYS leads with what RiloBiz itself can do for this user right now (hold numbers, organize spreadsheet, cross-tool leverage).
- For real tools, every suggestion must depend on business-wide context that only RiloBiz sees — never generic tool tips the tool's own help center would give.
- Each suggestion is 1–2 sentences, specific, actionable.

RULES for MORE_QUESTIONS:
- Return 3 NEW questions that go deeper than what's already in prior_qa. Do not repeat prior topics.
- Apply the same QUESTION FORMAT RULE. Since these are follow-ups (not the opening satisfaction check), most will be operational/diagnostic → options + open_field:false.

OUTPUT — JSON only, no prose, no code fences:
{ "questions": [{"text":"...", "options": ["...","..."], "open_field": false}, ...] }
or
{ "suggestions": [{"text":"..."},{"text":"..."},{"text":"..."}] }`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: { user } } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    if (!user) return json({ error: "Invalid token" }, 401);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI gateway not configured" }, 500);

    const body = await req.json().catch(() => ({}));
    const {
      card_key, card_kind, card_label, category, bucket_slug,
      mode = "questions", related_tools = [], batch = 1, prior_qa = [],
    } = body ?? {};

    if (!card_key || !card_kind || !card_label || !category || !bucket_slug) {
      return json({ error: "Missing card fields" }, 400);
    }
    if (!["questions", "suggestions", "more_questions"].includes(mode)) {
      return json({ error: "Bad mode" }, 400);
    }

    // Small memory snapshot for context (recent user-confirmed facts, capped).
    const { data: memRows } = await supabase
      .from("aperture_memory_items")
      .select("bucket_slug,content")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(60);
    const memorySnapshot = (memRows ?? [])
      .map((r: any) => `[${r.bucket_slug}] ${r.content}`)
      .join("\n");

    // Existing tool-card Q/A for this card (for suggestions + more_questions context).
    const { data: existing } = await supabase
      .from("aperture_tool_card_questions")
      .select("row_kind,question_text,answer_text,generation_batch")
      .eq("user_id", user.id)
      .eq("card_key", card_key)
      .eq("is_active", true)
      .order("generation_batch", { ascending: true });
    const priorFromDb = (existing ?? [])
      .filter((r: any) => r.row_kind === "question")
      .map((r: any) => ({ q: r.question_text, a: r.answer_text }));
    const priorQa = prior_qa.length ? prior_qa : priorFromDb;

    const userMsg = JSON.stringify({
      mode,
      card_kind,
      card_label,
      category,
      bucket_slug,
      related_tools,
      batch,
      prior_qa: priorQa.slice(-12),
      memory_snapshot: memorySnapshot,
    });

    const aiRes = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI gateway error", aiRes.status, t);
      return json({ error: "AI gateway failed" }, 502);
    }
    const aiData = await aiRes.json();
    logAiUsage(supabase, {
      userId: user.id,
      fn: "aperture-tool-card-generate",
      model: DEFAULT_MODEL,
      usage: aiData?.usage,
    });
    const content = aiData?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(content); } catch { parsed = {}; }

    if (mode === "suggestions") {
      const suggestions = Array.isArray(parsed?.suggestions) ? parsed.suggestions.slice(0, 3) : [];
      if (suggestions.length === 0) return json({ error: "Empty payload" }, 502);
      // Persist as rows so they survive reloads.
      // Clear prior suggestions on this card first.
      await supabase
        .from("aperture_tool_card_questions")
        .update({ is_active: false })
        .eq("user_id", user.id)
        .eq("card_key", card_key)
        .eq("row_kind", "suggestion");
      const inserts = suggestions.map((s: any, i: number) => ({
        user_id: user.id,
        card_key,
        card_kind,
        card_label,
        category,
        bucket_slug,
        row_kind: "suggestion",
        question_index: i,
        question_text: String(s?.text ?? "").slice(0, 800),
        generation_batch: batch,
        is_active: true,
      }));
      await supabase.from("aperture_tool_card_questions").insert(inserts as any);
      return json({ suggestions });
    }

    // questions or more_questions
    const questions = Array.isArray(parsed?.questions) ? parsed.questions.slice(0, 3) : [];
    if (questions.length === 0) return json({ error: "Empty payload" }, 502);
    const nextBatch = mode === "more_questions"
      ? (Math.max(0, ...(existing ?? []).map((r: any) => r.generation_batch ?? 1)) + 1)
      : 1;
    const inserts = questions.map((q: any, i: number) => ({
      user_id: user.id,
      card_key,
      card_kind,
      card_label,
      category,
      bucket_slug,
      row_kind: "question",
      question_index: i,
      question_text: String(q?.text ?? "").slice(0, 500),
      question_options: Array.isArray(q?.options)
        ? q.options.filter((o: any) => typeof o === "string" && o.trim().length > 0).slice(0, 6)
        : [],
      open_field: q?.open_field === false ? false : (Array.isArray(q?.options) && q.options.length > 0 ? false : true),
      generation_batch: nextBatch,
      is_active: true,
    }));
    await supabase.from("aperture_tool_card_questions").insert(inserts as any);
    return json({ questions, batch: nextBatch });
  } catch (e) {
    console.error(e);
    return json({ error: String((e as any)?.message ?? e) }, 500);
  }
});