import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await supabase
    .from("admin_documents")
    .select("extracted_text")
    .eq("id", "cd403299-bbfb-456b-a1dc-54a98cb768dc")
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const text = data.extracted_text;
  const markers = ["فصل اول", "فصل دوم", "فصل سوم", "فصل چهارم", "فصل پنجم"];
  const positions = markers.map(m => text.indexOf(m));
  positions.push(text.length);

  const chapters: Record<string, string> = {};
  for (let i = 0; i < 5; i++) {
    chapters[`ch${i + 1}`] = text.substring(positions[i], positions[i + 1]);
  }

  return new Response(JSON.stringify({ lengths: Object.fromEntries(Object.entries(chapters).map(([k, v]) => [k, v.length])), chapters }), {
    headers: { "Content-Type": "application/json" },
  });
});
