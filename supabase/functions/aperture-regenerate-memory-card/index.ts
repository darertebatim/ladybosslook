import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, AI_GATEWAY, DEFAULT_MODEL, logAiUsage } from "../_shared/aperture-cors.ts";

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
`You are a sharp, direct business advisor. You have just read everything Aperture knows about this owner's entire business — across all territories: story, customers, products, sales, marketing, money, team, operations, partners, competitors, tools, and vision. Your job is to write a two-part business brief.

The facts you are reading come from different sources:
- Facts marked (guess) are AI inferences — treat them as plausible but unconfirmed
- Facts marked (noticed) were pulled from the owner's website or Instagram
- All other facts are things the owner directly told Aperture

---

PART 0 — AT A GLANCE
Before the prose brief, output a 3-line scannable summary of the whole business. Each line is a single short phrase (max ~14 words), prefixed with one of these exact labels, in this exact order:
- METRIC: one concrete fact, number, named product, named channel, or named customer segment that defines this business right now
- WATCH: the single biggest hidden risk across the whole business — the thing quietly costing them
- MOVE: one specific next action grounded in the facts (name the thing, not a vague verb)

Label this section exactly: "At a glance"

---

PART 1 — WHAT WE KNOW
Write 5–7 sentences giving an honest picture of this business as it stands today. Cover the most important territories — what the business does, who it serves, how it makes money, what the owner is working toward, and what the current constraints are. Use specific details from the facts: real numbers, real channels, real products, real goals. Do not genericize. If certain areas are thin or mostly guesses, acknowledge it briefly. End Part 1 with one sentence naming the single most important thing that is currently missing from the picture.

Break the section into 2–4 short paragraphs separated by a blank line so it reads in scannable chunks instead of a wall of text. Wrap the single most important sentence in **bold** using markdown — usually the one naming what is most missing.

Label this section exactly: "What we know"

---

PART 2 — WHAT I SEE
Now step back and tell the owner what you actually see when you read this business as a whole. Write 5–7 sentences. You must include:
- The most important pattern across the whole business — something that shows up in multiple territories and explains a lot
- The single biggest hidden problem — something that sounds acceptable or normal but is quietly costing the business
- The single most underused asset or opportunity — something already present in the facts that the business is not fully using
- One thing about the trajectory: where this business is likely heading if nothing changes

Be specific. Reference actual details. Do not give advice that could apply to any small business. If the data across the whole business is too thin to say something real, name which territories need filling first and why they matter most.

Do not soften. Do not hedge. Do not use the words: consider, explore, leverage, optimize, ensure, streamline, journey.

Break the section into 2–4 short paragraphs separated by a blank line. Wrap the single sharpest sentence (the pattern, the hidden problem, the opportunity, or the trajectory — whichever lands hardest) in **bold** using markdown.

Label this section exactly: "What I see"

---

FORMAT RULES:
- Plain prose paragraphs only inside Part 1 and Part 2 — no bullets, no headings beyond the three section labels. The At a glance lines ARE the only bullets allowed.
- Use blank lines between paragraphs so the brief breathes. Aim for 2–4 paragraphs per part.
- You may wrap exactly one sentence per part in **bold** to mark the key takeaway. Do not bold more than one sentence per part.
- Address the owner as "you" / "your"
- Length: keep Part 1 and Part 2 at the full 5–7 sentences each. Do NOT shorten the prose. Longer and more specific is better than shorter — the owner wants depth, not brevity.
- Never end with a question or a call to action
- The full brief should read like something a trusted advisor wrote after a deep review — not like a form was filled out` },
            { role: "user", content: raw },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        await logAiUsage(supabase, { userId: user.id, fn: "aperture-regenerate-memory-card", model: DEFAULT_MODEL, usage: data?.usage });
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