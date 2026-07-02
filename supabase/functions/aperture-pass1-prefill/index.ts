import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, AI_GATEWAY, DEFAULT_MODEL, logAiUsage } from "../_shared/aperture-cors.ts";
import { logApertureEvent } from "../_shared/aperture-events.ts";

/**
 * Pass 1 — Pre-fill memory from industry + onboarding + research.
 *
 * Runs once at the end of quick onboarding (after Phase 3 confirmation,
 * before the closing question). Goes through the user's visible bucket
 * question targets and, for each one not already answered by onboarding
 * or website/IG extraction, asks the model to make a plausible guess
 * grounded in industry norms + what we know so far.
 *
 * EVERY fact written by this pass is tagged:
 *   source = 'ai_inferred_pre_onboarding'
 *   confidence = 0.3
 *
 * Downstream code must treat these as soft guesses (muted UI, half
 * progress weight, verify-before-relying in chat).
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

    const [{ data: profile }, { data: buckets }, { data: questions }, { data: existingItems }] = await Promise.all([
      supabase.from("aperture_user_profile")
        .select("business_name,industry_slug").eq("user_id", user.id).maybeSingle(),
      supabase.from("aperture_buckets")
        .select("slug,title,blurb")
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .order("sort_order", { ascending: true }),
      supabase.from("aperture_bucket_questions")
        .select("bucket_slug,question_key,prompt,hint")
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .order("sort_order", { ascending: true }),
      supabase.from("aperture_memory_items")
        .select("bucket_slug,question_key,content,source")
        .eq("user_id", user.id).eq("is_active", true),
    ]);

    const allQuestions = (questions ?? []) as any[];
    const bucketsList = (buckets ?? []) as any[];
    const memory = (existingItems ?? []) as any[];

    // Build set of already-answered (bucket, question) keys so we never
    // overwrite a real user answer or a previously inferred guess.
    const answeredKeys = new Set<string>();
    for (const m of memory) {
      if (m.bucket_slug && m.question_key) {
        answeredKeys.add(`${m.bucket_slug}::${m.question_key}`);
      }
    }

    const unanswered = allQuestions.filter(q =>
      q.bucket_slug && q.question_key &&
      !answeredKeys.has(`${q.bucket_slug}::${q.question_key}`)
    );

    if (unanswered.length === 0) {
      await logApertureEvent(supabase, user.id, "pass1_completed", { written: 0, skipped: 0, reason: "nothing_unanswered" });
      return json({ written: 0, skipped: 0 });
    }

    // Compress existing memory as context for the model.
    const grouped: Record<string, string[]> = {};
    for (const m of memory) {
      const slug = m.bucket_slug ?? "notes";
      (grouped[slug] ||= []).push(String(m.content ?? "").slice(0, 220));
    }
    const memoryBrief = Object.entries(grouped)
      .map(([slug, lines]) => `## ${slug}\n${lines.slice(0, 10).map(l => `- ${l}`).join("\n")}`)
      .join("\n\n") || "(no extracted facts yet)";

    const bucketBlurbs = bucketsList
      .map(b => `- ${b.slug}: ${b.title}${b.blurb ? ` — ${b.blurb}` : ""}`)
      .join("\n");

    // Cap question count per call so we stay well under model token limits.
    const targetQs = unanswered.slice(0, 80);
    const targetList = targetQs.map((q, i) => ({
      i,
      bucket_slug: q.bucket_slug,
      question_key: q.question_key,
      prompt: q.prompt,
      hint: q.hint ?? null,
    }));

    const system = `You are Aperture — pre-filling a small business owner's memory profile right after onboarding, BEFORE they've had any real conversations.

You will receive:
- Their business name and industry
- What we already extracted from their website/Instagram and onboarding answers
- A list of QUESTION TARGETS we still don't have answers to

Your job: for each unanswered question, EITHER produce a plausible, industry-normative guess in 1–2 short sentences, OR skip it. These are guesses, not facts — be conservative, never invent specifics that pretend to be from the owner.

Hard rules:
- Make a guess ONLY when industry norms or stated facts give you a reasonable basis. If the question requires a personal fact you couldn't reasonably know (e.g. "what's your founder's name") — SKIP.
- Never fabricate numbers as if confirmed. Phrase ranges or norms ("Restaurants in this category typically run 28–35% food cost.").
- Never reference "I", "my", "we", or speak as the owner. Speak descriptively about the business.
- Keep each answer ≤ 220 characters.
- Output STRICT JSON only — no prose, no markdown fences.

Schema:
{ "answers": [ { "i": number, "content": string } ] }

Only include entries you're confident enough to guess. Omit the rest — do not return empty strings.`;

    const userMsg = `Business: ${(profile as any)?.business_name ?? "(unknown)"}
Industry: ${(profile as any)?.industry_slug ?? "(unknown)"}

Available buckets:
${bucketBlurbs || "(none)"}

What we already know (do not duplicate or contradict):
${memoryBrief}

Unanswered question targets (return one entry per question you choose to fill):
${JSON.stringify(targetList, null, 2)}`;

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
    await logAiUsage(supabase, { userId: user.id, fn: "aperture-pass1-prefill", model: DEFAULT_MODEL, usage: data?.usage });
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }
    const answers = Array.isArray(parsed?.answers) ? parsed.answers : [];

    const rows: any[] = [];
    for (const a of answers) {
      const idx = Number(a?.i);
      const content = String(a?.content ?? "").trim().slice(0, 220);
      if (!content) continue;
      const target = targetList[idx];
      if (!target) continue;
      // Belt-and-suspenders: never overwrite if it landed in memory in between.
      if (answeredKeys.has(`${target.bucket_slug}::${target.question_key}`)) continue;
      rows.push({
        user_id: user.id,
        bucket_slug: target.bucket_slug,
        question_key: target.question_key,
        content,
        source: "ai_inferred_pre_onboarding",
        confidence: 0.3,
        is_active: true,
      });
    }

    let written = 0;
    if (rows.length > 0) {
      const { error: insErr, count } = await supabase
        .from("aperture_memory_items")
        .upsert(rows, { onConflict: "user_id,bucket_slug,question_key", count: "exact", ignoreDuplicates: true });
      if (insErr) {
        console.error("pass1 insert error", insErr);
      } else {
        written = count ?? rows.length;
      }

      // Log per-item events for downstream analytics.
      for (const r of rows) {
        await logApertureEvent(supabase, user.id, "memory_item_written", {
          source: "ai_inferred_pre_onboarding",
          bucket_slug: r.bucket_slug,
          question_key: r.question_key,
          confidence: r.confidence,
        });
      }
    }

    await logApertureEvent(supabase, user.id, "pass1_completed", {
      written,
      considered: targetList.length,
      total_unanswered: unanswered.length,
      industry_slug: (profile as any)?.industry_slug ?? null,
    });

    return json({ written, considered: targetList.length, total_unanswered: unanswered.length });
  } catch (e) {
    console.error("aperture-pass1-prefill error", e);
    return json({ error: String((e as any)?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}