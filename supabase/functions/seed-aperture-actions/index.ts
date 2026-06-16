import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import seed from "./seed.json" with { type: "json" };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const rows = (seed as any[]).map((r) => ({
      slug: r.slug,
      kind: r.kind,
      category: r.category ?? null,
      title: r.title,
      blurb: r.blurb ?? null,
      why: r.why ?? null,
      duration: r.duration ?? null,
      needs: r.needs ?? [],
      steps: r.steps ?? null,
      output: r.output ?? null,
      is_published: true,
    }));
    const { error, count } = await supabase
      .from("aperture_actions")
      .upsert(rows, { onConflict: "slug", count: "exact" });
    if (error) throw error;
    return new Response(
      JSON.stringify({ ok: true, upserted: rows.length, count }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String((e as Error).message ?? e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});