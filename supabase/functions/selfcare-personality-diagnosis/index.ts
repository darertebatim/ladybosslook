import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/* ─── Scoring (mirrors src/utils/selfcare-personality-scoring.ts) ── */

type Personality =
  | "giver" | "achiever" | "survivor" | "ghost" | "perfectionist" | "ruminator";
type Cluster = "body" | "mind" | "environment" | "people";
type Readiness = "tiny" | "small" | "medium" | "unknown";

const Q1: Record<string, Partial<Record<Personality, number>>> = {
  "Exhausted": { survivor: 2, giver: 1 },
  "Scattered": { ruminator: 2, perfectionist: 1 },
  "Numb": { ghost: 2 },
  "Overwhelmed": { survivor: 2, ruminator: 1 },
  "Behind": { perfectionist: 2, achiever: 1 },
  "Empty": { ghost: 2, survivor: 1 },
};
const Q2: Record<string, Partial<Record<Personality, number>>> = {
  "I think of everything I should be doing and can't settle": { ruminator: 2, achiever: 1 },
  "I scroll my phone and suddenly it's midnight": { ghost: 2 },
  "I feel guilty — someone else probably needs something": { giver: 2 },
  "I start something and abandon it halfway through": { perfectionist: 2 },
  "I feel nothing much. I just wait for it to pass.": { ghost: 2, survivor: 1 },
  "I try to use it productively even now": { achiever: 2 },
};
const Q3: Record<string, Partial<Record<Personality, number>>> = {
  "I snap at someone I love and feel terrible": { ruminator: 2, giver: 1 },
  "I get sick — my body forces me to stop": { survivor: 2, achiever: 1 },
  "I cry at something small and don't know why": { ghost: 2, ruminator: 1 },
  "I realize I can't remember the last time I felt like myself": { ghost: 2 },
  "I miss one day of routine and stop completely": { perfectionist: 2 },
  "I keep going until I crash. I don't really notice.": { achiever: 2 },
};
const Q4: Record<string, Partial<Record<Personality, number>>> = {
  "My mind keeps running through everything unfinished": { ruminator: 2, achiever: 1 },
  "I feel like I need to earn it first": { perfectionist: 2 },
  "I feel guilty — like someone needs me": { giver: 2 },
  "Rest feels far away right now. I don't really try.": { survivor: 2, ghost: 1 },
  "I rest but it doesn't restore me": { achiever: 2 },
  "I fall into it but feel worse when I come out": { ghost: 2 },
};
const Q5: Record<string, Personality> = {
  "I'm hard on myself — standards I'd never apply to anyone else": "perfectionist",
  "I've lost track of what I actually want": "ghost",
  "I know what I need. I just can't prioritize it.": "achiever",
  "I'm surviving. That's about all I can say.": "survivor",
  "I'm so focused on others I forget to check in with myself": "giver",
  "My mind won't slow down. I'm always on.": "ruminator",
};
const ALL: Personality[] = ["giver","achiever","survivor","ghost","perfectionist","ruminator"];

function score(answers: Record<string, any>): Personality {
  const s: Partial<Record<Personality, number>> = {};
  const add = (row?: Partial<Record<Personality, number>>) => {
    if (!row) return;
    for (const p of ALL) if (row[p]) s[p] = (s[p] || 0) + row[p]!;
  };
  add(Q1[String(answers["scp-q1"] || "")]);
  add(Q2[String(answers["scp-q2"] || "")]);
  add(Q3[String(answers["scp-q3"] || "")]);
  add(Q4[String(answers["scp-q4"] || "")]);
  const q5 = Q5[String(answers["scp-q5"] || "")];
  if (q5) s[q5] = (s[q5] || 0) + 5;
  let winner: Personality = q5 || "ghost";
  let max = s[winner] ?? -1;
  for (const p of ALL) { const v = s[p] || 0; if (v > max) { max = v; winner = p; } }
  if (q5 && (s[q5] || 0) === max) winner = q5;
  return winner;
}

const SURVIVOR_PASS = new Set([
  "A new baby or very young children",
  "Burnout — running on empty for too long",
  "A loss, grief, or something ending",
  "A major life change — move, relationship, identity",
]);

function applyGate(p: Personality, answers: Record<string, any>): Personality {
  if (p !== "survivor") return p;
  const q6 = String(answers["scp-q6"] || "");
  if (!q6 || SURVIVOR_PASS.has(q6)) return "survivor";
  const q5p = Q5[String(answers["scp-q5"] || "")];
  return q5p && q5p !== "survivor" ? q5p : "survivor";
}

const DEFAULTS: Record<Personality, { pc: Cluster; sc: Cluster; pcat: string; scat: string }> = {
  giver:         { pc: "people",      sc: "mind",        pcat: "connection", scat: "selfkind" },
  achiever:      { pc: "mind",        sc: "body",        pcat: "calm",       scat: "sleep" },
  survivor:      { pc: "environment", sc: "mind",        pcat: "easy-win",   scat: "calm" },
  ghost:         { pc: "mind",        sc: "mind",        pcat: "selfkind",   scat: "Presence" },
  perfectionist: { pc: "mind",        sc: "environment", pcat: "selfkind",   scat: "productivity" },
  ruminator:     { pc: "mind",        sc: "body",        pcat: "calm",       scat: "sleep" },
};

const Q9: Record<string, { level: Readiness; count: number }> = {
  "2-3 minutes. Tiny steps only.":             { level: "tiny",    count: 3 },
  "5-10 minutes. Small but real.":             { level: "small",   count: 5 },
  "15-20 minutes. I want to build something.": { level: "medium",  count: 7 },
  "I'm not sure. Help me start somewhere.":    { level: "unknown", count: 3 },
};

/* ─── Handler ─────────────────────────────────────────────────── */

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const adminKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");

    let userId: string | null = null;
    if (authHeader) {
      const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anon, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      userId = user?.id || null;
    }

    const { answers } = await req.json();
    const a = answers || {};

    const scored = score(a);
    const personality = applyGate(scored, a);
    const base = { ...DEFAULTS[personality] };

    // Minimal override logic — kept simple; mirrors client where it matters
    const q9 = Q9[String(a["scp-q9"] || "")] || { level: "unknown" as Readiness, count: 3 };
    let taskCount = q9.count;
    if (a["scp-q7"] === "I genuinely don't have the time or energy right now") taskCount = Math.max(2, taskCount - 1);
    if (a["scp-q6"] === "Everywhere at once — it's just always there") taskCount = Math.max(2, taskCount - 1);
    if (personality === "survivor") taskCount = 3;
    taskCount = Math.max(2, taskCount);

    const admin = createClient(supabaseUrl, adminKey);

    // Pull candidate tasks from primary + secondary categories.
    const { data: tasks } = await admin
      .from("admin_task_bank")
      .select("id, title, emoji, category, description, color, repeat_pattern, time_period, is_popular")
      .in("category", [base.pcat, base.scat])
      .eq("is_active", true)
      .order("is_popular", { ascending: false })
      .limit(30);

    // Mix primary + secondary so users don't see one category only.
    // ~60/40 split (ceil for primary), fall back to the other side
    // when one category doesn't have enough candidates.
    const primary = (tasks || []).filter((t) => t.category === base.pcat);
    const secondary = (tasks || []).filter((t) => t.category === base.scat);
    const primaryTarget = Math.min(primary.length, Math.ceil(taskCount * 0.6));
    const secondaryTarget = Math.min(secondary.length, taskCount - primaryTarget);
    const finalPrimaryCount = Math.min(primary.length, taskCount - secondaryTarget);
    const suggested: any[] = [
      ...primary.slice(0, finalPrimaryCount),
      ...secondary.slice(0, secondaryTarget),
    ];
    // Top up from whichever side still has items, in case totals fell short.
    for (const t of [...primary.slice(finalPrimaryCount), ...secondary.slice(secondaryTarget)]) {
      if (suggested.length >= taskCount) break;
      suggested.push(t);
    }

    // Persist (best-effort)
    if (userId) {
      try {
        const { error: insertErr } = await admin.from("selfcare_personality_results").insert({
          user_id: userId,
          taken_at: new Date().toISOString(),
          personality,
          primary_cluster: base.pc,
          secondary_cluster: base.sc,
          primary_category: base.pcat,
          secondary_category: base.scat,
          readiness_level: q9.level,
          task_count: taskCount,
          suggested_task_ids: suggested.map((t) => t.id),
          answers: a,
          quiz_version: "v2.1",
        });
        if (insertErr) console.warn("[scp-diagnosis] insert error:", insertErr);
      } catch (e) {
        console.warn("[scp-diagnosis] insert failed:", e);
      }
    }

    return new Response(JSON.stringify({
      personality,
      primary_cluster: base.pc,
      secondary_cluster: base.sc,
      primary_category: base.pcat,
      secondary_category: base.scat,
      readiness_level: q9.level,
      task_count: taskCount,
      suggested_tasks: suggested,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("selfcare-personality-diagnosis error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});