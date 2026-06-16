import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, AI_GATEWAY, DEFAULT_MODEL, CHAT_MODEL, LITE_MODEL } from "../_shared/aperture-cors.ts";
import { logApertureEvent } from "../_shared/aperture-events.ts";

/**
 * aperture-chat
 *
 * Streaming chat for the Aperture business advisor.
 * Injects the user's compressed "business memory card" into the system prompt
 * on every turn so the model never has to re-read the underlying buckets.
 *
 * Request body:
 *   { chatId: string, messages: [{role,content}], stream?: boolean }
 */

const SYSTEM_BASE = `You are Aperture, a direct, experienced AI business advisor for small business owners and solopreneurs.

How you talk:
- Plain language. No corporate fluff, no "as an AI" disclaimers.
- Give a real opinion, not a list of options. If the user is wrong, say so kindly.
- Short answers by default. Expand only when the user asks for depth.
- Reference what you already know about their business (from the memory card below).
- When you don't know something, ask ONE specific question instead of a generic one.
- Never recommend tools or apps unless asked.

Your job is to move them forward — name the next action, write the thing they're stuck on, or pressure-test an idea.`;

const OPTIONS_INSTRUCTIONS = `

CLICKABLE OPTIONS — formatting contract.

When the conditions below are met, you MUST end your message with an OPTIONS
block. The block is the LAST thing in your message, with NO text after the
closing tag:

[OPTIONS]
- First short option
- Second short option
- Third short option
[/OPTIONS]

ALWAYS use OPTIONS when:
- Your question has 3 or more clear, finite answers (yes/no/maybe, ranges, multi-choice).
- The answer belongs to a known set of categories (industry, team size, revenue range, channel, frequency, etc.).
- You are opening a brand-new conversation with no prior user message in this chat.

NEVER use OPTIONS when:
- The question requires free text (e.g. "describe your best customer", "tell me the story").
- You're asking for a story, reason, or explanation.
- You're following up on something the user just said and a short text reply is more natural.

Hard rules for the block itself:
- 2–6 options. Each under 60 characters. No numbering, no punctuation prefixes.
- Each option text IS the user's reply if they tap it — write it as the user would say it.
- Never wrap normal prose in the block. The block is options only.`;

const SYSTEM_PROMPT_BASE = SYSTEM_BASE + OPTIONS_INSTRUCTIONS;

const GUESS_INSTRUCTIONS = `

GUESSES vs CONFIRMED FACTS — read carefully.

Some lines in the BUSINESS MEMORY CARD are tagged with "(guess)". Those are
low-confidence inferences made from the user's industry before they answered
the question themselves. They are NOT confirmed.

- Never present a (guess) as if the user told you it.
- Before relying on a (guess) to recommend an action, verify it in one short
  sentence ("I'm assuming X — true?" / "Quick check: is X right?").
- If the user corrects a guess, treat the new answer as the truth going forward.
- Lines without "(guess)" are confirmed by the user — use them directly.`;

const SYSTEM_PROMPT_FINAL = SYSTEM_PROMPT_BASE + GUESS_INSTRUCTIONS;

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

    const { chatId, messages, stream = true, escape = null } = await req.json();
    if (!chatId || !Array.isArray(messages) || messages.length === 0) {
      return json({ error: "chatId and messages required" }, 400);
    }

    // Verify chat ownership
    const { data: chat } = await supabase
      .from("aperture_chats").select("id,user_id").eq("id", chatId).maybeSingle();
    if (!chat || chat.user_id !== user.id) return json({ error: "Chat not found" }, 404);

    // Persist the latest user message (only when it's a real user turn — escape
    // actions don't create a visible user message).
    const lastUser = messages[messages.length - 1];
    if (!escape && lastUser?.role === "user") {
      await supabase.from("aperture_messages").insert({
        chat_id: chatId, user_id: user.id, role: "user", content: lastUser.content,
      });
      await logApertureEvent(supabase, user.id, "chat_message_user", {
        content: String(lastUser.content ?? ""),
      }, chatId);

      // Fire-and-forget: extract any business facts from this user turn
      // into the memory pool. Done out-of-band so it never blocks the
      // streaming chat response.
      const extractPromise = extractFactsFromMessage({
        supabase,
        userId: user.id,
        apiKey: LOVABLE_API_KEY,
        userMessage: String(lastUser.content ?? ""),
      }).catch(err => console.error("extractFactsFromMessage failed", err));
      // @ts-ignore – Deno deploy edge runtime exposes waitUntil for background work.
      if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
        // @ts-ignore
        EdgeRuntime.waitUntil(extractPromise);
      }
    }

    // Handle Skip / I don't know escape hatches. Log the gap as a memory_item
    // so the daily-question rotation can defer it, then nudge the AI to
    // acknowledge briefly and move on to a different territory.
    let escapeInstruction = "";
    if (escape && (escape.kind === "skip" || escape.kind === "unknown")) {
      const qText = String(escape.question ?? "").trim().slice(0, 500);
      let bucket = String(escape.bucket ?? "").trim().toLowerCase() || null;
      if (!bucket && qText) {
        bucket = await classifyBucket(supabase, LOVABLE_API_KEY, qText);
      }
      if (qText) {
        const content = escape.kind === "skip"
          ? qText
          : `Owner doesn't know: ${qText}`;
        const nowIso = new Date().toISOString();
        const metadata = escape.kind === "skip"
          ? { skipped_at: nowIso, source_view: "chat" }
          : { logged_at: nowIso, source_view: "chat" };
        await supabase.from("aperture_memory_items").insert({
          user_id: user.id,
          content,
          source: escape.kind === "skip" ? "skipped" : "unknown",
          bucket_slug: bucket,
          metadata,
          is_active: true,
        });
        await logApertureEvent(
          supabase, user.id,
          escape.kind === "skip" ? "daily_question_skipped" : "question_marked_unknown",
          { question: qText, bucket_slug: bucket },
          chatId,
        );
      }
      escapeInstruction = escape.kind === "skip"
        ? `\n\nESCAPE — the user tapped "Skip for now" on your previous question${qText ? ` ("${qText}")` : ""}. Reply with exactly ONE short, warm sentence acknowledging the skip (e.g. "No problem — we'll come back to that.") and then move to the next most relevant question. CRITICAL: the next question must come from a different topic or a different bucket — never repeat the skipped question or a near-paraphrase in this session. Do not ask why they skipped. Do not show urgency.`
        : `\n\nESCAPE — the user tapped "I don't know" on your previous question${qText ? ` ("${qText}")` : ""}. Reply with a brief, judgment-free acknowledgement (one short sentence, e.g. "That's okay — most owners haven't tracked this yet."). If — and only if — you genuinely know where they could find this answer in a common tool (QuickBooks, Square, Stripe, Shopify, their CRM, etc.), add ONE short sentence pointing them there. Otherwise skip that part entirely. Then move immediately to the next most relevant question from a different topic. Do not lecture, do not repeat the question, do not ask a follow-up about the gap.`;
    }

    // Load (or build) memory card
    const memoryCard = await getOrBuildMemoryCard(supabase, user.id, LOVABLE_API_KEY);
    const systemPrompt = `${SYSTEM_PROMPT_FINAL}\n\n=== BUSINESS MEMORY CARD ===\n${memoryCard || "(empty — ask the user about their business basics first)"}\n=== END MEMORY CARD ===${escapeInstruction}`;

    // When an escape was sent, the last "messages" entry may still be the
    // previous assistant turn. The model behaves better if we add a tiny
    // user-side cue at the end so it knows whose turn it is.
    const outboundMessages = escape
      ? [...messages, { role: "user", content: escape.kind === "skip" ? "[skip]" : "[i don't know]" }]
      : messages;

    const upstream = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        stream,
        messages: [{ role: "system", content: systemPrompt }, ...outboundMessages],
      }),
    });

    if (!upstream.ok) {
      const t = await upstream.text();
      if (upstream.status === 429) return json({ error: "Rate limited. Try again shortly." }, 429);
      if (upstream.status === 402) return json({ error: "AI credits exhausted." }, 402);
      return json({ error: `AI gateway error: ${t.slice(0, 300)}` }, 500);
    }

    if (!stream) {
      const data = await upstream.json();
      const text = data?.choices?.[0]?.message?.content ?? "";
      await supabase.from("aperture_messages").insert({
        chat_id: chatId, user_id: user.id, role: "assistant", content: text,
      });
      await logApertureEvent(supabase, user.id, "chat_message_ai", {
        content: text,
      }, chatId);
      return json({ content: text });
    }

    // Stream SSE through, and capture assembled text to persist at the end.
    let assembled = "";
    const stream2 = new ReadableStream({
      async start(controller) {
        const reader = upstream.body!.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            buf += chunk;
            // parse SSE lines for content deltas
            const lines = buf.split("\n");
            buf = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data:")) continue;
              const payload = line.slice(5).trim();
              if (payload === "[DONE]") continue;
              try {
                const obj = JSON.parse(payload);
                const delta = obj?.choices?.[0]?.delta?.content;
                if (typeof delta === "string") assembled += delta;
              } catch { /* ignore parse errors */ }
            }
            controller.enqueue(value);
          }
        } finally {
          controller.close();
          if (assembled.trim()) {
            await supabase.from("aperture_messages").insert({
              chat_id: chatId, user_id: user.id, role: "assistant", content: assembled,
            });
            await logApertureEvent(supabase, user.id, "chat_message_ai", {
              content: assembled,
            }, chatId);
          }
        }
      },
    });

    return new Response(stream2, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (e) {
    console.error("aperture-chat error", e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Reads the saved memory card. If stale or missing, regenerates it by summarizing
 * the user's bucket answers + AI facts. This is the "compressed brief" injected
 * into every chat so the model never has to re-read the raw buckets.
 */
async function getOrBuildMemoryCard(supabase: any, userId: string, apiKey: string): Promise<string> {
  const { data: card } = await supabase
    .from("aperture_memory_card").select("summary,stale").eq("user_id", userId).maybeSingle();
  if (card && !card.stale && card.summary) return card.summary;

  const [{ data: items }, { data: questions }] = await Promise.all([
    supabase.from("aperture_memory_items")
      .select("bucket_slug,question_key,source,content")
      .eq("user_id", userId).eq("is_active", true),
    supabase.from("aperture_bucket_questions").select("bucket_slug,question_key,prompt"),
  ]);

  const questionLookup = new Map<string, string>();
  (questions ?? []).forEach((q: any) =>
    questionLookup.set(`${q.bucket_slug}:${q.question_key}`, q.prompt),
  );

  const grouped: Record<string, string[]> = {};
  (items ?? []).forEach((it: any) => {
    const v = String(it.content ?? "").trim();
    if (!v) return;
    const slug = it.bucket_slug ?? "notes";
    if (it.source === "bucket_answer" && it.question_key) {
      const prompt = questionLookup.get(`${it.bucket_slug}:${it.question_key}`) ?? it.question_key;
      (grouped[slug] ??= []).push(`- ${prompt} → ${v}`);
    } else if (it.source === "ai_extracted") {
      (grouped[slug] ??= []).push(`- (noticed) ${v}`);
    } else if (it.source === "ai_inferred_pre_onboarding") {
      const prompt = it.question_key
        ? (questionLookup.get(`${it.bucket_slug}:${it.question_key}`) ?? it.question_key)
        : null;
      (grouped[slug] ??= []).push(prompt ? `- ${prompt} → ${v} (guess)` : `- ${v} (guess)`);
    } else {
      (grouped[slug] ??= []).push(`- ${v}`);
    }
  });

  const rawBrief = Object.entries(grouped)
    .map(([slug, lines]) => `## ${slug}\n${lines.join("\n")}`).join("\n\n");

  if (!rawBrief.trim()) {
    await supabase.from("aperture_memory_card").upsert({
      user_id: userId, summary: "", facts_count: 0, answers_count: 0,
      stale: false, regenerated_at: new Date().toISOString(),
    });
    return "";
  }

  // Compress into a tight brief via the model
  const summarized = await summarize(apiKey, rawBrief);

  await supabase.from("aperture_memory_card").upsert({
    user_id: userId,
    summary: summarized,
    facts_count: (items ?? []).filter((i: any) => i.source === "ai_extracted").length,
    answers_count: (items ?? []).filter((i: any) => i.source === "bucket_answer").length,
    stale: false,
    regenerated_at: new Date().toISOString(),
  });
  return summarized;
}

async function summarize(apiKey: string, raw: string): Promise<string> {
  const res = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content:
          "You compress notes about a small business into a dense brief for another AI advisor to load as context. Keep ALL specific facts (numbers, names, products, locations). Drop fluff. Use short bulleted sections. No more than ~400 words." },
        { role: "user", content: raw },
      ],
    }),
  });
  if (!res.ok) return raw.slice(0, 4000);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? raw.slice(0, 4000);
}

/**
 * Lightweight bucket classifier for chat-side skip / "I don't know" actions.
 * Returns one of the active bucket slugs, or null if the model is unsure.
 * Used so daily-question rotation can defer questions by (bucket, prompt).
 */
async function classifyBucket(
  supabase: any, apiKey: string, questionText: string,
  userId?: string,
): Promise<string | null> {
  try {
    const list = await getAllowedBuckets(supabase, userId);
    if (list.length === 0) return null;
    const allowed = list.map(b => b.slug);
    const catalog = list.map(b => `- ${b.slug} (${b.title})`).join("\n");

    const res = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: LITE_MODEL,
        messages: [
          { role: "system", content:
            `Classify the following business question into ONE bucket slug. Respond with STRICT JSON only: {"bucket_slug": "<slug>"} or {"bucket_slug": null} if unsure. Allowed slugs:\n${catalog}` },
          { role: "user", content: questionText.slice(0, 800) },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    const slug = String(parsed?.bucket_slug ?? "").trim().toLowerCase();
    return slug && allowed.includes(slug) ? slug : null;
  } catch {
    return null;
  }
}

/**
 * Background fact-extraction from a single chat message.
 *
 * Asks the model to return STRICT JSON of new business facts found in the
 * user's message and the bucket they belong to. Writes each fact as a
 * memory_item with source='ai_extracted' and marks the memory card stale.
 *
 * Never throws — failures are logged and swallowed.
 */
async function extractFactsFromMessage(args: {
  supabase: any; userId: string; apiKey: string; userMessage: string;
}): Promise<void> {
  const { supabase, userId, apiKey, userMessage } = args;
  const trimmed = (userMessage ?? "").trim();
  if (trimmed.length < 12) return; // not worth extracting from a tiny ack

  // Allowed bucket slugs for routing the fact.
  const allowedList = await getAllowedBuckets(supabase, userId);
  const allowed = allowedList.map(b => b.slug);
  if (allowed.length === 0) return;

  // Existing facts so the model can avoid restating known things.
  const { data: existing } = await supabase
    .from("aperture_memory_items")
    .select("bucket_slug,content")
    .eq("user_id", userId).eq("is_active", true)
    .order("updated_at", { ascending: false }).limit(80);
  const knownBrief = (existing ?? [])
    .map((i: any) => `- (${i.bucket_slug ?? "?"}) ${String(i.content).slice(0, 160)}`)
    .join("\n");

  const system = `You extract NEW business facts from a single user message so an AI advisor can remember them.

Allowed bucket slugs (use EXACTLY one of these per fact): ${allowed.join(", ")}.

Rules:
- Only extract concrete factual statements about the user's business (numbers, names, products, customers, channels, hires, locations, decisions, plans). Skip opinions, questions, hypotheticals, and small talk.
- Skip anything already in the "known facts" list below — even if reworded.
- One fact per item. Keep each fact short (under 220 chars), self-contained, written in third person ("They…", "The business…").
- If the message has no extractable new facts, return an empty array.
- Output STRICT JSON only — no prose, no markdown fences.

Schema:
{ "facts": [ { "bucket_slug": string, "content": string } ] }`;

  const userPayload = `Known facts:
${knownBrief || "(none)"}

User message:
${trimmed.slice(0, 4000)}`;

  let parsed: any = {};
  try {
    const res = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPayload },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return;
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    parsed = JSON.parse(raw);
  } catch {
    return;
  }

  const facts: Array<{ bucket_slug: string; content: string }> = Array.isArray(parsed?.facts)
    ? parsed.facts : [];
  const clean = facts
    .map(f => ({
      bucket_slug: String(f?.bucket_slug ?? "").trim().toLowerCase(),
      content: String(f?.content ?? "").trim().slice(0, 240),
    }))
    .filter(f => f.content && allowed.includes(f.bucket_slug))
    .slice(0, 6);

  if (clean.length === 0) return;

  const rows = clean.map(f => ({
    user_id: userId,
    content: f.content,
    source: "ai_extracted",
    bucket_slug: f.bucket_slug,
    is_active: true,
  }));
  const { error: insertErr } = await supabase.from("aperture_memory_items").insert(rows);
  if (insertErr) {
    console.error("ai_extracted insert error", insertErr);
    return;
  }
  for (const f of clean) {
    await logApertureEvent(supabase, userId, "memory_item_written", {
      bucket_slug: f.bucket_slug, content: f.content, source: "ai_extracted",
    });
  }
  // Mark the compressed brief stale so the next chat turn regenerates it.
  await supabase.from("aperture_memory_card")
    .update({ stale: true })
    .eq("user_id", userId);
}