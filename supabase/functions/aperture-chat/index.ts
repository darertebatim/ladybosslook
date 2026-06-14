import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, AI_GATEWAY, DEFAULT_MODEL } from "../_shared/aperture-cors.ts";

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

    const { chatId, messages, stream = true } = await req.json();
    if (!chatId || !Array.isArray(messages) || messages.length === 0) {
      return json({ error: "chatId and messages required" }, 400);
    }

    // Verify chat ownership
    const { data: chat } = await supabase
      .from("aperture_chats").select("id,user_id").eq("id", chatId).maybeSingle();
    if (!chat || chat.user_id !== user.id) return json({ error: "Chat not found" }, 404);

    // Persist the latest user message
    const lastUser = messages[messages.length - 1];
    if (lastUser?.role === "user") {
      await supabase.from("aperture_messages").insert({
        chat_id: chatId, user_id: user.id, role: "user", content: lastUser.content,
      });
    }

    // Load (or build) memory card
    const memoryCard = await getOrBuildMemoryCard(supabase, user.id, LOVABLE_API_KEY);
    const systemPrompt = `${SYSTEM_BASE}\n\n=== BUSINESS MEMORY CARD ===\n${memoryCard || "(empty — ask the user about their business basics first)"}\n=== END MEMORY CARD ===`;

    const upstream = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        stream,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
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

  const [{ data: answers }, { data: facts }, { data: buckets }] = await Promise.all([
    supabase.from("aperture_memory_answers")
      .select("bucket_slug,question_key,value").eq("user_id", userId),
    supabase.from("aperture_ai_facts")
      .select("bucket_slug,fact").eq("user_id", userId).eq("is_active", true),
    supabase.from("aperture_bucket_questions").select("bucket_slug,question_key,prompt"),
  ]);

  const questionLookup = new Map<string, string>();
  (buckets ?? []).forEach((q: any) =>
    questionLookup.set(`${q.bucket_slug}:${q.question_key}`, q.prompt),
  );

  const grouped: Record<string, string[]> = {};
  (answers ?? []).forEach((a: any) => {
    const v = typeof a.value === "string" ? a.value : a.value?.text ?? JSON.stringify(a.value);
    if (!v || !String(v).trim()) return;
    const prompt = questionLookup.get(`${a.bucket_slug}:${a.question_key}`) ?? a.question_key;
    (grouped[a.bucket_slug] ??= []).push(`- ${prompt} → ${v}`);
  });
  (facts ?? []).forEach((f: any) => {
    (grouped[f.bucket_slug ?? "notes"] ??= []).push(`- (noticed) ${f.fact}`);
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
    facts_count: facts?.length ?? 0,
    answers_count: answers?.length ?? 0,
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