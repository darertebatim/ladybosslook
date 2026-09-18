import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resolveAutoEnrollRoundId } from "../_shared/auto-enroll-round.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-timezone",
};

// Re-evaluates the caller's timezone-based round assignments once their real
// device timezone is known. Only moves enrollments for rounds that have not
// started yet, and only for programs with East/West/Europe rules configured.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { timezone } = await req.json().catch(() => ({ timezone: null }));

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: userData } = await admin.auth.getUser(token);
    const userId = userData?.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const { data: rules } = await admin
      .from("program_auto_enrollment")
      .select("program_slug, east_round_id, west_round_id, europe_round_id");

    const tzRules = (rules || []).filter(
      (r: any) => r.east_round_id || r.west_round_id || r.europe_round_id,
    );
    if (tzRules.length === 0) {
      return new Response(JSON.stringify({ moved: 0 }), {
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const slugs = tzRules.map((r: any) => r.program_slug);
    const { data: enrollments } = await admin
      .from("course_enrollments")
      .select("id, program_slug, round_id")
      .eq("user_id", userId)
      .in("program_slug", slugs);

    let moved = 0;
    for (const e of enrollments || []) {
      const target = await resolveAutoEnrollRoundId(admin, e.program_slug, userId, timezone);
      if (!target || target === e.round_id) continue;

      // Skip rounds that already started.
      if (e.round_id) {
        const { data: current } = await admin
          .from("program_rounds")
          .select("first_session_date")
          .eq("id", e.round_id)
          .maybeSingle();
        const start = current?.first_session_date ? new Date(current.first_session_date) : null;
        if (start && start.getTime() <= Date.now()) continue;
      }

      const { error } = await admin
        .from("course_enrollments")
        .update({ round_id: target })
        .eq("id", e.id);
      if (!error) moved++;
    }

    return new Response(JSON.stringify({ moved }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (e) {
    console.error("[resync-my-enrollment-rounds]", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
