import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, AI_GATEWAY, DEFAULT_MODEL } from "../_shared/aperture-cors.ts";
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
      (grouped[slug] ||= []).push(String((it as any).content ?? "").slice(0, 280));
    }
    const memoryBrief = Object.entries(grouped)
      .map(([slug, lines]) => `## ${slug}\n${lines.slice(0, 10).map(l => `- ${l}`).join("\n")}`)
      .join("\n\n") || "(memory pool is still mostly empty)";

    const system = `You are Aperture — a direct, experienced business advisor.

The user just finished ${flow === "full" ? "the deep-dive questionnaire" : "quick onboarding"}. Based on EVERYTHING they shared (profile + memory + closing answer), write a short mini-report that proves you actually read and understood their business.

Rules:
- Tone: warm but sharp. Talk TO the owner ("you", "your"). No corporate filler.
- "summary" = 2-3 sentences. Name what their business actually is and who it's for, in their voice.
- "bullets" = exactly 4 entries. label is 1-3 words (e.g. "Who you serve", "What you sell", "Your edge", "Biggest gap"). value is one sharp sentence under 140 chars.
- "next_moves" = exactly 3 imperative actions, under 9 words each. Concrete, weighted toward the closing answer.
- "risks" = exactly 2 blind spots — things they didn't mention that matter. Each under 120 chars.
- If memory is thin, say so honestly in summary rather than inventing.
- Output STRICT JSON only — no prose, no markdown fences.

Schema:
{ "summary": string, "bullets": [{"label": string, "value": string}], "next_moves": string[], "risks": string[] }`;

    const userMsg = `Business: ${(profile as any)?.business_name ?? "(unknown)"} · Industry: ${(profile as any)?.industry_slug ?? "(unknown)"}
Website: ${(profile as any)?.website ?? "(none)"} · Instagram: ${(profile as any)?.instagram ?? "(none)"}

CLOSING ANSWER (what they want help with most right now):
${closingAnswer || "(skipped)"}

Raw memory by bucket:
${memoryBrief}`;

    const upstream = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg },
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
    });

    return json({ brief });
  } catch (e) {
    console.error("aperture-business-brief error", e);
    return json({ error: String((e as any)?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}