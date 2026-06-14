import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, AI_GATEWAY, DEFAULT_MODEL } from "../_shared/aperture-cors.ts";

/**
 * Forces a rebuild of the user's business memory card from their bucket answers
 * and AI-extracted facts. Called from the UI after major memory edits.
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

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI gateway not configured" }, 500);

    // Mark stale so the build path takes effect
    await supabase.from("aperture_memory_card").upsert({
      user_id: user.id, stale: true,
    });

    const [{ data: items }, { data: questions }] = await Promise.all([
      supabase.from("aperture_memory_items")
        .select("bucket_slug,question_key,source,content")
        .eq("user_id", user.id).eq("is_active", true),
      supabase.from("aperture_bucket_questions").select("bucket_slug,question_key,prompt"),
    ]);

    const lookup = new Map<string, string>();
    (questions ?? []).forEach((q: any) =>
      lookup.set(`${q.bucket_slug}:${q.question_key}`, q.prompt));

    const grouped: Record<string, string[]> = {};
    (items ?? []).forEach((it: any) => {
      const v = String(it.content ?? "").trim();
      if (!v) return;
      const slug = it.bucket_slug ?? "notes";
      if (it.source === "bucket_answer" && it.question_key) {
        const prompt = lookup.get(`${it.bucket_slug}:${it.question_key}`) ?? it.question_key;
        (grouped[slug] ??= []).push(`- ${prompt} → ${v}`);
      } else if (it.source === "ai_extracted") {
        (grouped[slug] ??= []).push(`- (noticed) ${v}`);
      } else {
        (grouped[slug] ??= []).push(`- ${v}`);
      }
    });

    const raw = Object.entries(grouped)
      .map(([slug, lines]) => `## ${slug}\n${lines.join("\n")}`).join("\n\n");

    let summary = "";
    if (raw.trim()) {
      const res = await fetch(AI_GATEWAY, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages: [
            { role: "system", content:
              "You compress notes about a small business into a dense brief for another AI advisor. Keep ALL specific facts (numbers, names, products, locations). Drop fluff. Use short bulleted sections. Max ~400 words." },
            { role: "user", content: raw },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        summary = data?.choices?.[0]?.message?.content ?? raw.slice(0, 4000);
      } else {
        summary = raw.slice(0, 4000);
      }
    }

    await supabase.from("aperture_memory_card").upsert({
      user_id: user.id,
      summary,
      facts_count: (items ?? []).filter((i: any) => i.source === "ai_extracted").length,
      answers_count: (items ?? []).filter((i: any) => i.source === "bucket_answer").length,
      stale: false,
      regenerated_at: new Date().toISOString(),
    });

    return json({ ok: true, summary, length: summary.length });
  } catch (e) {
    console.error(e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), {
    status: s, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}