import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, AI_GATEWAY, DEFAULT_MODEL, logAiUsage } from "../_shared/aperture-cors.ts";
import { logApertureEvent } from "../_shared/aperture-events.ts";

/**
 * Pass 2 — Post-onboarding personalized home suggestions.
 *
 * Runs once at the end of quick onboarding (after the closing question).
 * Generates 3–5 tailored next-actions weighted heavily on the closing
 * answer ("how can I help you most right now") and persists them to
 * `aperture_generated_items` (kind='home_suggestion') so the very first
 * Home render is already personal — even before any chat history exists.
 *
 * Body: { closing_answer?: string }
 * Response: { suggestions: [{ title, why, prompt }] }
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

    const [{ data: items }, { data: card }, { data: profile }] = await Promise.all([
      supabase.from("aperture_memory_items")
        .select("bucket_slug,content,source")
        .eq("user_id", user.id).eq("is_active", true)
        .order("updated_at", { ascending: false }).limit(150),
      supabase.from("aperture_memory_card")
        .select("summary").eq("user_id", user.id).maybeSingle(),
      supabase.from("aperture_user_profile")
        .select("business_name,industry_slug").eq("user_id", user.id).maybeSingle(),
    ]);

    const grouped: Record<string, string[]> = {};
    for (const it of (items ?? [])) {
      const slug = (it as any).bucket_slug ?? "notes";
      (grouped[slug] ||= []).push(String((it as any).content ?? "").slice(0, 240));
    }
    const memoryBrief = Object.entries(grouped)
      .map(([slug, lines]) => `## ${slug}\n${lines.slice(0, 8).map(l => `- ${l}`).join("\n")}`)
      .join("\n\n") || "(memory pool is still mostly empty)";

    const system = `You are Aperture — a direct, experienced business advisor for solopreneurs and small business owners.

The user just finished a quick onboarding and told you the ONE thing they want help with most right now. Your job is to generate 3–5 SHORT, CONCRETE next-actions tailored to that stated need AND what little we know about their business so far.

Rules:
- Weight the closing answer heavily — it is the single clearest signal of intent.
- Each title is an imperative under 7 words. No fluff, no "consider", no "explore".
- "why" is ONE sentence that ties the suggestion back to either the closing answer or a specific fact from memory.
- "prompt" is the exact message that gets sent if the user taps it — written in the user's voice asking Aperture for help. Under 240 chars. Concrete enough that the AI can produce a useful first response immediately.
- Never recommend tools or apps unless they're already in memory.
- Avoid generic advice ("post on social media"). Specific to their situation.
- Output STRICT JSON only — no prose, no markdown fences.

Schema:
{ "suggestions": [ { "title": string, "why": string, "prompt": string } ] }`;

    const userMsg = `Business: ${(profile as any)?.business_name ?? "(unknown)"} · Industry: ${(profile as any)?.industry_slug ?? "(unknown)"}

CLOSING ANSWER (what they want help with most right now):
${closingAnswer || "(they skipped the closing question — infer from memory)"}

Compressed brief:
${(card as any)?.summary?.trim() || "(none yet)"}

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
    const suggestions = Array.isArray(parsed?.suggestions) ? parsed.suggestions.slice(0, 5) : [];
    const clean = suggestions
      .map((s: any) => ({
        title: String(s?.title ?? "").trim().slice(0, 80),
        why: String(s?.why ?? "").trim().slice(0, 240),
        prompt: String(s?.prompt ?? "").trim().slice(0, 400),
      }))
      .filter((s: any) => s.title && s.prompt);

    // Persist to the unified generated items table so Home reads them
    // immediately on first render (no extra AI roundtrip needed).
    if (clean.length > 0) {
      const slugify = (s: string) =>
        s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
      const rows = clean.map((s: any) => ({
        user_id: user.id,
        kind: "home_suggestion",
        payload: { title: s.title, why: s.why, prompt: s.prompt },
        status: "active",
        generator: "pass2_post_onboarding",
        generator_version: "v1",
        dedupe_key: `pass2:${slugify(s.title)}`,
      }));
      const { error: insErr } = await supabase
        .from("aperture_generated_items")
        .upsert(rows, { onConflict: "user_id,kind,dedupe_key", ignoreDuplicates: false });
      if (insErr) console.error("pass2 persist error", insErr);
    }

    await logApertureEvent(supabase, user.id, "pass2_completed", {
      count: clean.length,
      titles: clean.map((s: any) => s.title),
      had_closing_answer: closingAnswer.length > 0,
    });

    return json({ suggestions: clean });
  } catch (e) {
    console.error("aperture-pass2-suggestions error", e);
    return json({ error: String((e as any)?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}