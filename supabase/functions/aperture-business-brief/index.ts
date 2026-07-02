import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, AI_GATEWAY, CHAT_MODEL, logAiUsage } from "../_shared/aperture-cors.ts";
import { logApertureEvent } from "../_shared/aperture-events.ts";

/**
 * Business Brief — generated AFTER onboarding completes (quick or full).
 * Reads all confirmed memory + profile + closing answer and returns a
 * short structured mini-report shown one time before the user lands on Home.
 *
 * Body: { closing_answer?: string, flow?: "quick" | "full" }
 * Response: {
 *   summary: string,              // 2-3 sentence narrative
 *   bullets: { label, value }[],  // who you serve, what you sell, edge, etc.
 *   next_moves: string[],         // 3 imperatives
 *   risks: string[],              // 2-3 blind spots
 * }
 */
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

    let body: any = {};
    try { body = await req.json(); } catch { /* empty body ok */ }
    const closingAnswer = String(body?.closing_answer ?? "").trim().slice(0, 1200);
    const flow = body?.flow === "full" ? "full" : "quick";

    const [{ data: items }, { data: profile }] = await Promise.all([
      supabase.from("aperture_memory_items")
        .select("bucket_slug,content,source")
        .eq("user_id", user.id).eq("is_active", true)
        .order("updated_at", { ascending: false }).limit(200),
      supabase.from("aperture_user_profile")
        .select("business_name,industry_slug,website,instagram").eq("user_id", user.id).maybeSingle(),
    ]);

    const grouped: Record<string, string[]> = {};
    for (const it of (items ?? [])) {
      const slug = (it as any).bucket_slug ?? "notes";
      (grouped[slug] ||= []).push(String((it as any).content ?? "").slice(0, 400));
    }
    const memoryBrief = Object.entries(grouped)
      .map(([slug, lines]) => `## ${slug}\n${lines.slice(0, 20).map(l => `- ${l}`).join("\n")}`)
      .join("\n\n") || "(memory pool is still mostly empty)";

    // PASS 1 — deep, free-form analysis. Model thinks out loud before structuring.
    // We deliberately don't constrain it to JSON here so it can reason fully.
    const analystSystem = `You are a senior operator who has built and advised dozens of small businesses across creator, services, e-commerce, and local categories. You are NOT a generic AI assistant. You think like a partner who is about to invest their own time into this business.

You just received a dump of everything a real owner shared during onboarding. Read it the way an experienced operator reads it: looking for what's actually going on underneath the surface, where the money really comes from, what they're avoiding, what they're proud of but shouldn't be, and the ONE bottleneck that — if removed — would change everything in the next 30 days.

Think out loud in plain text. Cover:
1. What this business REALLY is (in plain language — strip the marketing).
2. The math: how do they actually make money? What does a typical week of revenue look like based on what they said? Where is it leaking?
3. The owner's blindspot. What did they NOT say that's screaming at you?
4. The one bottleneck. If you could only fix one thing in 30 days, what is it and why?
5. Two or three SPECIFIC moves (named tools, named tactics, real numbers, real channels — never "post more" or "research X" or "explore Y").
6. What you'd quietly worry about if you were their partner.

Be direct, specific, and evidence-based — every claim must trace back to something they actually said. Reference their exact words when you can. No filler, no hedging, no "consider", no "explore", no "you might want to". If memory is too thin to know something, SAY THAT instead of inventing.`;

    const analystUser = `Business: ${(profile as any)?.business_name ?? "(unknown)"} · Industry: ${(profile as any)?.industry_slug ?? "(unknown)"}
Website: ${(profile as any)?.website ?? "(none)"} · Instagram: ${(profile as any)?.instagram ?? "(none)"}

THE ONE THING THEY ASKED FOR HELP WITH (weight this heavily):
${closingAnswer || "(skipped — infer the real ask from memory)"}

Everything they shared, by bucket:
${memoryBrief}`;

    const analysis = await callGateway(LOVABLE_API_KEY, CHAT_MODEL, [
      { role: "system", content: analystSystem },
      { role: "user", content: analystUser },
    ]);
    if (analysis.usage) {
      await logAiUsage(supabase, { userId: user.id, fn: "aperture-business-brief:pass1", model: CHAT_MODEL, usage: analysis.usage });
    }
    if (analysis.error) return json({ error: analysis.error }, analysis.status);
    // Pass 1 occasionally returns empty (model refusal, safety filter, or
    // upstream truncation). When that happens, fall back to feeding the
    // formatter the raw memory dump directly — better than a blank brief.
    const analysisText = analysis.text && analysis.text.length > 40
      ? analysis.text
      : `(Pass 1 returned empty — work directly from the raw memory dump below.)\n\n${analystUser}`;

    // PASS 2 — compress the deep analysis into the strict UI schema, preserving specificity.
    const formatterSystem = `You convert a senior operator's free-form analysis of a business into a STRICT JSON brief shown to the owner.

Hard rules (a violation = a failed brief):
- Preserve the analysis's specificity. Keep named tools, real numbers, real channels, the owner's own phrases. Never soften to "consider", "explore", "research", "look into", "think about".
- Tone: warm, direct, partner-grade. Talk TO the owner ("you", "your"). Zero corporate filler.
- "summary": 3-4 sentences. Name what the business REALLY is, who it's for, how it makes money today, and the ONE bottleneck — in the owner's own voice where possible.
- "bullets": exactly 4. label is 1-3 words ("Who you serve", "How money flows", "Your real edge", "The bottleneck" or similar). value is ONE sharp sentence under 160 chars, evidence-based (anchored to something they said).
- "next_moves": exactly 3 imperative actions. Each must include EITHER a specific number, a named tool/platform, or a named tactic. No vague verbs. Under 14 words each.
- "risks": exactly 2 blind spots they didn't mention but that matter. Each under 140 chars. Be brave — name the thing they're avoiding.
- If the analysis itself says memory is thin, reflect that honestly in summary rather than inventing.
- Output STRICT JSON only. No prose, no markdown fences.

Schema:
{ "summary": string, "bullets": [{"label": string, "value": string}], "next_moves": string[], "risks": string[] }`;

    const formatterUser = `Senior operator's analysis of this business:

${analysisText}

Now compress this into the strict JSON brief.`;

    const upstream = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: [
          { role: "system", content: formatterSystem },
          { role: "user", content: formatterUser },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!upstream.ok) {
      const t = await upstream.text();
      if (upstream.status === 429) return json({ error: "Rate limited. Try again shortly." }, 429);
      if (upstream.status === 402) return json({ error: "AI credits exhausted." }, 402);
      return json({ error: `AI gateway error: ${t.slice(0, 300)}` }, 500);
    }

    const data = await upstream.json();
    await logAiUsage(supabase, { userId: user.id, fn: "aperture-business-brief:pass2", model: CHAT_MODEL, usage: data?.usage });
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }

    const brief = {
      summary: String(parsed?.summary ?? "").trim().slice(0, 800),
      bullets: Array.isArray(parsed?.bullets)
        ? parsed.bullets.slice(0, 4).map((b: any) => ({
            label: String(b?.label ?? "").trim().slice(0, 40),
            value: String(b?.value ?? "").trim().slice(0, 200),
          })).filter((b: any) => b.label && b.value)
        : [],
      next_moves: Array.isArray(parsed?.next_moves)
        ? parsed.next_moves.slice(0, 3).map((s: any) => String(s ?? "").trim().slice(0, 120)).filter(Boolean)
        : [],
      risks: Array.isArray(parsed?.risks)
        ? parsed.risks.slice(0, 3).map((s: any) => String(s ?? "").trim().slice(0, 200)).filter(Boolean)
        : [],
    };

    await logApertureEvent(supabase, user.id, "business_brief_generated", {
      flow,
      bullets: brief.bullets.length,
      next_moves: brief.next_moves.length,
      risks: brief.risks.length,
      had_closing_answer: closingAnswer.length > 0,
      analysis_chars: analysisText.length,
      model: CHAT_MODEL,
    });

    return json({ brief });
  } catch (e) {
    console.error("aperture-business-brief error", e);
    return json({ error: String((e as any)?.message ?? e) }, 500);
  }
});

async function callGateway(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
): Promise<{ text: string; usage?: any; error?: string; status?: number }> {
  const r = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages }),
  });
  if (!r.ok) {
    const t = await r.text();
    if (r.status === 429) return { text: "", error: "Rate limited. Try again shortly.", status: 429 };
    if (r.status === 402) return { text: "", error: "AI credits exhausted.", status: 402 };
    return { text: "", error: `AI gateway error: ${t.slice(0, 300)}`, status: 500 };
  }
  const d = await r.json();
  return { text: String(d?.choices?.[0]?.message?.content ?? "").trim(), usage: d?.usage };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}