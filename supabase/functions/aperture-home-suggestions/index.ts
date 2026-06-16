import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, AI_GATEWAY, DEFAULT_MODEL } from "../_shared/aperture-cors.ts";
import { logApertureEvent } from "../_shared/aperture-events.ts";

/**
 * aperture-home-suggestions
 *
 * Returns 3–5 short, concrete next-actions tailored to what we already
 * know about the user's business. Reads the user's memory pool +
 * memory card and asks the model to produce a tight JSON list.
 *
 * Response: { suggestions: [{ title, why, prompt }] }
 *   - title:  short imperative (≤ 7 words)
 *   - why:    one sentence justification rooted in their memory
 *   - prompt: full message text to seed a chat when the user taps it
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

    const [{ data: items }, { data: card }, { data: profile }] = await Promise.all([
      supabase.from("aperture_memory_items")
        .select("bucket_slug,content,source")
        .eq("user_id", user.id).eq("is_active", true)
        .order("updated_at", { ascending: false }).limit(120),
      supabase.from("aperture_memory_card")
        .select("summary").eq("user_id", user.id).maybeSingle(),
      supabase.from("aperture_user_profile")
        .select("business_name,industry_slug").eq("user_id", user.id).maybeSingle(),
    ]);

    if (!items || items.length === 0) {
      return json({ suggestions: [] });
    }

    const grouped: Record<string, string[]> = {};
    for (const it of items) {
      const slug = (it as any).bucket_slug ?? "notes";
      (grouped[slug] ||= []).push(String((it as any).content ?? "").slice(0, 240));
    }
    const memoryBrief = Object.entries(grouped)
      .map(([slug, lines]) => `## ${slug}\n${lines.slice(0, 10).map(l => `- ${l}`).join("\n")}`)
      .join("\n\n");

    const system = `You are Aperture — a direct, experienced business advisor for solopreneurs and small business owners.

Given what we already know about the user's business, propose 3–5 SHORT, CONCRETE next-actions they could take in the next 7 days.

Rules:
- Each title is an imperative under 7 words. No fluff, no "consider".
- "why" is ONE sentence that points to a specific fact from their memory.
- "prompt" is the exact message that gets sent if the user taps it — written as the user speaking to Aperture, asking for help with that next action. Keep it under 240 chars.
- Never recommend tools or apps unless they're already in the memory.
- Avoid generic advice ("post on social media"). Be specific to their situation.
- Output STRICT JSON only, matching the schema below. No prose, no markdown fences.

Schema:
{ "suggestions": [ { "title": string, "why": string, "prompt": string } ] }`;

    const userMsg = `Business: ${(profile as any)?.business_name ?? "(unknown)"} · Industry: ${(profile as any)?.industry_slug ?? "(unknown)"}

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

    await logApertureEvent(supabase, user.id, "suggestion_shown", {
      count: clean.length,
      titles: clean.map((s: any) => s.title),
    });

    return json({ suggestions: clean });
  } catch (e) {
    console.error("aperture-home-suggestions error", e);
    return json({ error: String((e as any)?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}