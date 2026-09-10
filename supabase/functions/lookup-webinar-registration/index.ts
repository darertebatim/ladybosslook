import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Returns only name/city for a webinar registration email, so thank-you pages
// can prefill support messages even when localStorage was lost.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { email, source } = await req.json();
    if (!email || typeof email !== "string" || !source || typeof source !== "string") {
      return new Response(JSON.stringify({ found: false }), {
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data } = await supabase
      .from("form_submissions")
      .select("name, city")
      .eq("email", email.toLowerCase().trim())
      .eq("source", source)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return new Response(
      JSON.stringify(data ? { found: true, name: data.name, city: data.city } : { found: false }),
      { headers: { ...corsHeaders, "content-type": "application/json" } },
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ found: false }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
