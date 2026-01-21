import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the requesting user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user is an admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all active programs
    const { data: programs, error: programsError } = await supabase
      .from("program_catalog")
      .select("slug, title")
      .eq("is_active", true);

    if (programsError) throw programsError;

    // Get all rounds
    const { data: rounds, error: roundsError } = await supabase
      .from("program_rounds")
      .select("id, program_slug, round_name")
      .in("status", ["upcoming", "active", "completed"]);

    if (roundsError) throw roundsError;

    // Get existing enrollments for this user
    const { data: existingEnrollments } = await supabase
      .from("course_enrollments")
      .select("program_slug, round_id")
      .eq("user_id", user.id);

    const existingSet = new Set(
      (existingEnrollments || []).map(e => `${e.program_slug}-${e.round_id || 'null'}`)
    );

    const enrollmentsToCreate: any[] = [];

    // For each program, create enrollments
    for (const program of programs || []) {
      const programRounds = (rounds || []).filter(r => r.program_slug === program.slug);

      if (programRounds.length > 0) {
        // Enroll in each round
        for (const round of programRounds) {
          const key = `${program.slug}-${round.id}`;
          if (!existingSet.has(key)) {
            enrollmentsToCreate.push({
              user_id: user.id,
              course_name: program.title,
              program_slug: program.slug,
              round_id: round.id,
              status: "active",
            });
          }
        }
      } else {
        // No rounds - enroll without round_id
        const key = `${program.slug}-null`;
        if (!existingSet.has(key)) {
          enrollmentsToCreate.push({
            user_id: user.id,
            course_name: program.title,
            program_slug: program.slug,
            round_id: null,
            status: "active",
          });
        }
      }
    }

    let created = 0;
    if (enrollmentsToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from("course_enrollments")
        .insert(enrollmentsToCreate);

      if (insertError) throw insertError;
      created = enrollmentsToCreate.length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Enrolled in ${created} program/round combinations`,
        created,
        totalPrograms: programs?.length || 0,
        totalRounds: rounds?.length || 0,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
