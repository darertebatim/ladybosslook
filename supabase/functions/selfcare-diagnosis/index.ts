import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Scoring Maps ──────────────────────────────────────────────

const WEIGHING_MAP: Record<string, string[]> = {
  "Stress that won't quit": ["calm", "sleep", "Evening"],
  "Running on empty": ["sleep", "nutrition", "movement"],
  "Overstimulated & unfocused": ["Presence", "calm", "productivity"],
  "Feeling alone or disconnected": ["connection", "LovedOnes", "self-kindness"],
  "Everything feels messy": ["TidyUp", "productivity", "hygiene"],
};

const NEGLECTING_MAP: Record<string, string[]> = {
  "Sleep & rest": ["sleep", "Evening"],
  "Water & nutrition": ["nutrition"],
  "Moving your body": ["movement", "Exercise"],
  "Skincare & grooming": ["hygiene"],
  "Moments of stillness": ["calm", "Presence"],
  "Connecting with someone": ["connection"],
  "Tidying your space": ["TidyUp", "productivity"],
  "Being kind to yourself": ["self-kindness", "gratitude"],
  "Caring for loved ones": ["LovedOnes", "connection"],
};

const WIN_MAP: Record<string, string[]> = {
  "A real morning routine": ["movement", "hygiene", "Evening", "easy-win"],
  "A calmer, clearer mind": ["calm", "gratitude", "Presence"],
  "Taking better care of my body": ["Exercise", "nutrition", "sleep"],
  "Reconnecting with my people": ["connection", "LovedOnes", "self-kindness"],
  "Just getting back on track": ["easy-win", "TidyUp", "productivity"],
};

const DEEPER_MAP: Record<string, string[]> = {
  // Body
  "Can't fall asleep / stay asleep": ["sleep", "Evening"],
  "No energy to exercise": ["Exercise", "movement"],
  "Eating poorly or skipping meals": ["nutrition"],
  "Just feeling physically run down": ["sleep", "movement", "nutrition"],
  // Mind
  "A way to quiet racing thoughts": ["calm", "Presence"],
  "Permission to rest without guilt": ["self-kindness", "calm"],
  "More moments of gratitude": ["gratitude", "Presence"],
  "Reconnecting with myself": ["self-kindness", "gratitude"],
  // Environment
  "My space is a mess": ["TidyUp"],
  "I have no real routine": ["productivity", "Evening"],
  "I keep skipping basic self-care": ["hygiene", "self-kindness"],
  "My evenings are chaotic": ["Evening", "calm"],
  // People
  "Quality time with loved ones": ["LovedOnes", "connection"],
  "Feeling seen and supported": ["connection", "self-kindness"],
  "Making effort to stay in touch": ["connection"],
  "Taking care of someone I love": ["LovedOnes"],
};

// ─── Handler ───────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    let userId: string | null = null;
    if (authHeader) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      userId = user?.id || null;
    }

    const { answers } = await req.json();

    // ─── Score categories ──────────────────────────────────────
    const scores: Record<string, number> = {};
    const addScore = (cats: string[], weight: number) => {
      for (const c of cats) scores[c] = (scores[c] || 0) + weight;
    };

    const weighingAnswer = answers?.["sc-weighing"];
    if (weighingAnswer && WEIGHING_MAP[weighingAnswer]) addScore(WEIGHING_MAP[weighingAnswer], 3);

    const neglectingAnswers: string[] = answers?.["sc-neglecting"] || [];
    for (const s of neglectingAnswers) {
      if (NEGLECTING_MAP[s]) addScore(NEGLECTING_MAP[s], 3);
    }

    const winAnswer = answers?.["sc-win"];
    if (winAnswer && WIN_MAP[winAnswer]) addScore(WIN_MAP[winAnswer], 2);

    const deeperAnswer = answers?.["sc-deeper"];
    if (deeperAnswer && DEEPER_MAP[deeperAnswer]) addScore(DEEPER_MAP[deeperAnswer], 3);

    // Top gap categories
    const sortedGaps = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    if (sortedGaps.length === 0) sortedGaps.push("calm", "sleep");

    // ─── Fetch suggested tasks ─────────────────────────────────
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: tasks } = await adminClient
      .from("admin_task_bank")
      .select("id, title, emoji, category, description, color, repeat_pattern, time_period")
      .in("category", sortedGaps)
      .eq("is_active", true)
      .order("is_popular", { ascending: false })
      .limit(30);

    const suggestedTasks: typeof tasks = [];
    const usedIds = new Set<string>();
    for (const gap of sortedGaps) {
      const catTasks = (tasks || []).filter(t => t.category === gap && !usedIds.has(t.id));
      for (const t of catTasks.slice(0, 3)) {
        suggestedTasks.push(t);
        usedIds.add(t.id);
        if (suggestedTasks.length >= 8) break;
      }
      if (suggestedTasks.length >= 8) break;
    }

    // ─── Previous results for returning users ──────────────────
    let prevResults: any[] | null = null;
    let completionContext = "";
    if (userId) {
      const { data } = await adminClient
        .from("selfcare_quiz_results")
        .select("gap_categories, ai_insight, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);
      prevResults = data;

      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        const { data: completions } = await adminClient.rpc("get_selfcare_completion_stats" as any, {
          p_user_id: userId,
          p_categories: sortedGaps,
          p_since: thirtyDaysAgo,
        });
        if (completions) {
          completionContext = `\nTask completion stats (last 30 days): ${JSON.stringify(completions)}`;
        }
      } catch {
        // RPC may not exist yet
      }
    }

    // ─── AI prompt ─────────────────────────────────────────────
    const prevContext = prevResults?.[0]
      ? `\nPrevious quiz result (${prevResults[0].created_at}): gaps were [${prevResults[0].gap_categories?.join(", ")}]. Previous insight: "${prevResults[0].ai_insight}"`
      : "";

    const systemPrompt = `You are a warm, insightful self-care coach for the Ladybosslook app. 
You speak in a supportive, friendly tone — like a caring friend who gets it.
Write in the user's perspective. Be specific, not generic.
Keep it to 2-3 sentences max.${prevContext ? "\nThis is a RETURNING user. Acknowledge their progress or patterns compared to last time." : ""}`;

    const userPrompt = `Based on this self-care diagnostic quiz:
- What's weighing on them: ${weighingAnswer || "not specified"}
- Neglecting: ${neglectingAnswers.join(", ") || "none selected"}
- What would feel like a win: ${winAnswer || "not specified"}
- Deeper struggle: ${deeperAnswer || "not specified"}
- Top gap categories: ${sortedGaps.join(", ")}${prevContext}${completionContext}

Write a personalized 2-3 sentence insight about what area of their life needs attention and why these specific habits matter. Don't list the categories — weave them naturally into the message.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI error:", status, await aiResponse.text());
      throw new Error("AI generation failed");
    }

    const aiData = await aiResponse.json();
    const aiInsight = aiData.choices?.[0]?.message?.content || "Take a moment to check in with yourself today. Small steps lead to big changes.";

    // ─── Save result ───────────────────────────────────────────
    const suggestedTaskIds = suggestedTasks.map(t => t.id);
    if (userId) {
      await adminClient.from("selfcare_quiz_results").insert({
        user_id: userId,
        answers,
        gap_categories: sortedGaps,
        ai_insight: aiInsight,
        suggested_task_ids: suggestedTaskIds,
      });
    }

    return new Response(JSON.stringify({
      gap_categories: sortedGaps,
      ai_insight: aiInsight,
      suggested_tasks: suggestedTasks,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("selfcare-diagnosis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
