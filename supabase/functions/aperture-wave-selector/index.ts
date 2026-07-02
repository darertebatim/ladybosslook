import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, AI_GATEWAY, CHAT_MODEL, logAiUsage } from "../_shared/aperture-cors.ts";

/**
 * aperture-wave-selector
 *
 * On-demand: called when the user taps a "Wave N ready" card in RiloBiz.
 * Reads the user's essential-onboarding answers + current memory pool state,
 * asks GPT to pick 10–15 questions per the wave selector prompt spec,
 * stores the payload in `aperture_waves`, and returns it to the client.
 *
 * Request body: { wave_number: number }
 * Auth: user bearer token.
 */

const SYSTEM_PROMPT = `You are the Wave question selector for RiloBiz — a memory-building tool for small business owners. Your job is to pick 10 to 15 questions that will fill this business owner's memory in the most useful way, given what they've already told us.

You are NOT writing advice, coaching, or reflecting the user. You are selecting fact-gathering questions the AI advisor will need later.

How to reason:
- Read the bucket relationship map and signal table below.
- Buckets are storage. Layers are reasoning. Activate layers, not buckets.
- Revenue Engine is the default active layer.
- Back-side layers (Owner Capacity, Financial Health) only activate on concrete signals — not vague pain.
- Content + Marketing co-activate when social/IG is signaled.
- Wave 2 works at SHALLOW depth — no deep or medium-depth questions.
- Never pick a question the user has already answered (see already_answered_facts).
- Prefer new questions over re-confirming Pass 1 guesses when they'd fill the same gap.
- Distribute questions the way the active layer actually needs. Never load 12+ into one bucket.

Sequencing:
- Opening (first 2–3): easy, concrete, low-emotional-cost.
- Middle (bulk): substantive fact-gathering, clustered by topic.
- Closing (last 1–2): more reflective questions if any were selected.

Question shape:
- If a question could be tapped, give 4–6 short options in the user's own voice.
- If it's genuinely open-ended (personal, story), set open_field: true and omit options.
- Skip and I-don't-know are provided by the UI — do not include them.

OUTPUT — JSON only, no prose, no code fences:
{
  "wave_number": <int>,
  "selected_question_count": <int between 10 and 15>,
  "active_layers": [<layer names>],
  "reasoning_summary": "<one paragraph, internal only>",
  "questions": [
    {
      "id": "<unique short id, e.g. w2_q3_channel_mix>",
      "bucket": "<human bucket label>",
      "bucket_slug": "<canonical slug: marketing|content|sales|customers|products|operations|team|partners|money|competitors|tools|vision|basics|null>",
      "layer": "<Revenue Engine|Owner Capacity|Financial Health|Direction>",
      "role_in_sequence": "opening|middle|closing",
      "question_text": "<the question the user sees>",
      "options": ["<opt1>", "<opt2>", "..."],
      "open_field": false,
      "reason": "<one line traceback to a signal>"
    }
  ]
}`;

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

    const body = await req.json().catch(() => ({}));
    const waveNumber = Math.max(1, Number(body?.wave_number ?? 2));

    // Return an existing wave payload if the client re-hits us.
    const { data: existing } = await supabase
      .from("aperture_waves")
      .select("*")
      .eq("user_id", user.id)
      .eq("wave_number", waveNumber)
      .maybeSingle();
    if (existing && existing.question_payload && (existing.status === "ready" || existing.status === "in_progress")) {
      return json({ ok: true, payload: existing.question_payload, cached: true });
    }

    // ── Assemble context ────────────────────────────────────────────────
    const [profileRes, memRes, essentialAnsRes, bankRes] = await Promise.all([
      supabase.from("aperture_user_profile").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("aperture_memory_items")
        .select("bucket_slug,question_key,content,source,wave_number")
        .eq("user_id", user.id)
        .eq("is_active", true),
      supabase.from("aperture_memory_items")
        .select("bucket_slug,question_key,content")
        .eq("user_id", user.id)
        .eq("wave_number", 1)
        .eq("is_active", true),
      supabase.from("aperture_bucket_questions" as any)
        .select("bucket_slug,question_key,prompt,input_kind,options,layer")
        .limit(600),
    ]);

    const profile: any = profileRes.data ?? {};
    const memory: any[] = memRes.data ?? [];
    const essential: any[] = essentialAnsRes.data ?? [];
    const bank: any[] = (bankRes.data ?? []) as any[];

    const alreadyAnswered = new Set(
      memory
        .filter(m => m.question_key)
        .map(m => `${m.bucket_slug ?? ""}::${m.question_key}`),
    );

    // Compact bank — drop already-answered, keep useful fields.
    const compactBank = bank
      .filter(q => !alreadyAnswered.has(`${q.bucket_slug}::${q.question_key}`))
      .slice(0, 400)
      .map(q => ({
        id: q.question_key,
        bucket_slug: q.bucket_slug,
        text: q.prompt,
        input_kind: q.input_kind,
        options: Array.isArray(q.options) ? q.options : [],
        layer_hint: q.layer ?? null,
      }));

    const memorySummary = summarizeMemory(memory);
    const essentialSummary = essential.map(e => ({
      bucket: e.bucket_slug, q: e.question_key, a: e.content,
    }));

    const userPayload = {
      wave_number: waveNumber,
      profile: {
        owner_name: profile.owner_name ?? null,
        business_name: profile.business_name ?? null,
        industry_slug: profile.industry_slug ?? null,
        website: profile.website ?? null,
        instagram: profile.instagram ?? null,
      },
      essential_onboarding_answers: essentialSummary,
      memory_pool_state: memorySummary,
      already_answered_facts: Array.from(alreadyAnswered),
      bucket_question_bank: compactBank,
    };

    // ── Call GPT ────────────────────────────────────────────────────────
    const upstream = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify(userPayload) },
        ],
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return json({ error: "Selector call failed", detail: text }, 502);
    }
    const upstreamJson = await upstream.json();
    const raw = upstreamJson?.choices?.[0]?.message?.content ?? "{}";
    let payload: any;
    try { payload = JSON.parse(raw); }
    catch { return json({ error: "Selector returned invalid JSON", raw }, 502); }

    // Log AI cost.
    try {
      const usage = upstreamJson?.usage ?? null;
      if (usage) {
        await logAiUsage(supabase, {
          user_id: user.id,
          feature: "wave_selector",
          model: CHAT_MODEL,
          prompt_tokens: usage.prompt_tokens ?? 0,
          completion_tokens: usage.completion_tokens ?? 0,
        });
      }
    } catch { /* ignore */ }

    // Guardrails: clamp count 10..15 and strip already-answered.
    if (Array.isArray(payload?.questions)) {
      payload.questions = payload.questions
        .filter((q: any) => q && q.question_text && !alreadyAnswered.has(`${q.bucket_slug ?? ""}::${q.id}`))
        .slice(0, 15);
      if (payload.questions.length > 15) payload.questions.length = 15;
      payload.selected_question_count = payload.questions.length;
    }

    // Persist the wave.
    await supabase.from("aperture_waves").upsert({
      user_id: user.id,
      wave_number: waveNumber,
      status: "ready",
      active_layers: payload?.active_layers ?? [],
      reasoning_summary: payload?.reasoning_summary ?? null,
      question_payload: payload,
      answered_count: 0,
      selected_at: new Date().toISOString(),
    } as any, { onConflict: "user_id,wave_number" });

    return json({ ok: true, payload });
  } catch (e: any) {
    console.error("[wave-selector] error", e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function summarizeMemory(rows: any[]) {
  const byBucket: Record<string, { count: number; sample: string[] }> = {};
  for (const r of rows) {
    const slug = r.bucket_slug ?? "(none)";
    if (!byBucket[slug]) byBucket[slug] = { count: 0, sample: [] };
    byBucket[slug].count += 1;
    if (byBucket[slug].sample.length < 4 && typeof r.content === "string") {
      byBucket[slug].sample.push(r.content.slice(0, 140));
    }
  }
  return byBucket;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}