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

    const sys = `You are a sharp, direct business advisor. You have just read everything Aperture knows about one specific area of this owner's business. Your job is to write a two-part brief.

The facts you are reading come from different sources:
- Facts marked (guess) are AI inferences — treat them as plausible but unconfirmed
- Facts marked (noticed) were pulled from the owner's website or Instagram
- All other facts are things the owner directly told Aperture

---

PART 0 — AT A GLANCE
Before the prose brief, output a 3-line scannable summary. Each line is a single short phrase (max ~12 words), prefixed with one of these exact labels, in this exact order:
- METRIC: one concrete fact, number, channel, product, or named asset from the data that defines this territory right now
- WATCH: one thing that is quietly costing the business or about to — the hidden risk in this territory
- MOVE: one specific next action grounded in the facts (name the thing, not a vague verb)

Label this section exactly: "At a glance"

---

PART 1 — WHAT WE KNOW
Write 3–5 sentences summarizing the current state of this territory based purely on the facts. Use the owner's own words and specific details where they exist (real numbers, real names, real channels). If the bucket is thin or mostly guesses, say so honestly — do not pad or fabricate. End Part 1 with a single line that names the biggest gap: what is most noticeably missing from this picture.

Break the section into 2–3 short paragraphs separated by a blank line so it reads in scannable chunks instead of a wall of text. Wrap the single most important sentence in **bold** using markdown — usually the one naming the biggest gap.

Label this section exactly: "What we know"

---

PART 2 — WHAT I SEE
Now step back from the facts and tell the owner what you actually notice. This is your interpretation, not a summary. Write 3–5 sentences. You must include:
- One pattern in the data that the owner probably hasn't named for themselves
- One thing that looks like a hidden problem or risk — something that sounds fine on the surface but has a real cost
- One thing that looks like an underused opportunity — something already present in the facts that could be doing more work

Be specific. Reference actual details from the facts. Do not give generic business advice that could apply to anyone. If the data is too thin to say something real, say: "There isn't enough here yet to give you a useful read — the more you share in this area, the sharper this gets."

Do not soften. Do not hedge. Do not use the words: consider, explore, leverage, optimize, ensure, streamline.

Break the section into 2–3 short paragraphs separated by a blank line. Wrap the single sharpest sentence (the pattern, the hidden problem, or the opportunity — whichever lands hardest) in **bold** using markdown.

Label this section exactly: "What I see"

---

FORMAT RULES:
- Plain prose paragraphs only inside Part 1 and Part 2 — no bullets, no headings beyond the three section labels. The At a glance lines ARE the only bullets allowed.
- Use blank lines between paragraphs so the brief breathes. Aim for 2–3 paragraphs per part.
- You may wrap exactly one sentence per part in **bold** to mark the key takeaway. Do not bold more than one sentence per part.
- Address the owner as "you" / "your"
- Length: keep Part 1 and Part 2 at the full 3–5 sentences each. Do NOT shorten the prose. Longer and more specific is better than shorter.
- Never end with a question or a call to action`;

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