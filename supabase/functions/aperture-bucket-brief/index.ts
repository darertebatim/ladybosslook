import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, AI_GATEWAY, CHAT_MODEL } from "../_shared/aperture-cors.ts";

/**
 * Per-bucket brief — short, user-facing summary of what Aperture currently
 * knows in a single bucket. Cached in `aperture_bucket_briefs` keyed by
 * (user_id, bucket_slug). Body: { bucket_slug: string, force?: boolean }.
 * - If `force` is true OR no cached row exists, regenerate via AI.
 * - Otherwise return the cached summary.
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

    const body = await req.json().catch(() => ({}));
    const bucketSlug = String(body?.bucket_slug ?? "").trim();
    if (!bucketSlug) return json({ error: "bucket_slug required" }, 400);
    const force = body?.force === true;

    // Cached?
    if (!force) {
      const { data: existing } = await supabase
        .from("aperture_bucket_briefs")
        .select("summary,facts_count,generated_at")
        .eq("user_id", user.id).eq("bucket_slug", bucketSlug)
        .maybeSingle();
      if (existing) return json({ brief: existing });
    }

    // Pull all active memory items for this bucket + bucket title + question prompts.
    const [{ data: items }, { data: bucket }, { data: bq }, { data: oq }] = await Promise.all([
      supabase.from("aperture_memory_items")
        .select("content,source,question_key,updated_at")
        .eq("user_id", user.id).eq("bucket_slug", bucketSlug).eq("is_active", true)
        .order("updated_at", { ascending: false }).limit(200),
      supabase.from("aperture_buckets")
        .select("title,blurb").eq("slug", bucketSlug)
        .or(`user_id.is.null,user_id.eq.${user.id}`).maybeSingle(),
      supabase.from("aperture_bucket_questions")
        .select("question_key,prompt").eq("bucket_slug", bucketSlug),
      supabase.from("aperture_onboarding_questions")
        .select("question_key,prompt"),
    ]);

    const promptFor: Record<string, string> = {};
    for (const r of (oq ?? []) as any[]) promptFor[r.question_key] = r.prompt;
    for (const r of (bq ?? []) as any[]) promptFor[r.question_key] = r.prompt;

    const rows = (items ?? []) as any[];
    const lines = rows.map((it) => {
      const v = String(it.content ?? "").trim();
      const label = it.question_key ? (promptFor[it.question_key] ?? it.question_key) : null;
      const tag = it.source === "ai_inferred_pre_onboarding"
        ? "(guess)"
        : it.source === "ai_extracted" ? "(noticed)" : "";
      return label ? `- ${label} → ${v} ${tag}`.trim() : `- ${v} ${tag}`.trim();
    });
    const corpus = lines.join("\n") || "(no facts yet in this bucket)";

    const sys = `You write a SHORT user-facing brief that summarizes what an AI advisor currently knows about ONE territory of a small business (a "bucket"). The owner reads this to verify what you understand.

Hard rules:
- 3-5 sentences max. No bullet lists, no headings. Just plain prose paragraphs.
- Use the owner's own words and concrete details (numbers, names, places) wherever possible.
- If a fact is tagged (guess) or (noticed), treat it as soft — phrase as "looks like" or "you mentioned" rather than as confirmed.
- If memory in this bucket is thin, say so honestly in one sentence.
- No filler, no advice, no "consider/explore". Just a faithful read-back.
- Address the owner directly ("you", "your"). Warm but tight.`;

    const usr = `Bucket: ${(bucket as any)?.title ?? bucketSlug}
Bucket description: ${(bucket as any)?.blurb ?? ""}

Everything I know in this bucket:
${corpus}`;

    let summary = "";
    if (rows.length > 0) {
      const r = await fetch(AI_GATEWAY, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: CHAT_MODEL,
          messages: [
            { role: "system", content: sys },
            { role: "user", content: usr },
          ],
        }),
      });
      if (r.ok) {
        const d = await r.json();
        summary = String(d?.choices?.[0]?.message?.content ?? "").trim();
      } else {
        const t = await r.text();
        if (r.status === 429) return json({ error: "Rate limited. Try again shortly." }, 429);
        if (r.status === 402) return json({ error: "AI credits exhausted." }, 402);
        return json({ error: `AI gateway error: ${t.slice(0, 300)}` }, 500);
      }
    } else {
      summary = "Nothing in this bucket yet. Start a chat above and what you share will show up here.";
    }

    const now = new Date().toISOString();
    const { error: upErr } = await supabase
      .from("aperture_bucket_briefs")
      .upsert({
        user_id: user.id,
        bucket_slug: bucketSlug,
        summary,
        facts_count: rows.length,
        generated_at: now,
      }, { onConflict: "user_id,bucket_slug" });
    if (upErr) return json({ error: upErr.message }, 500);

    return json({ brief: { summary, facts_count: rows.length, generated_at: now } });
  } catch (e) {
    console.error("aperture-bucket-brief error", e);
    return json({ error: String((e as any)?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}