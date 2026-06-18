import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await admin.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    const { data: roleData } = await admin
      .from("user_roles").select("role").eq("user_id", user.id).single();
    if (!roleData || roleData.role !== "admin") throw new Error("Admin access required");

    const body = await req.json().catch(() => ({}));
    const email: string | undefined = body.email?.toString().trim().toLowerCase();
    let userId: string | undefined = body.userId;

    if (!userId && email) {
      const { data: prof } = await admin
        .from("profiles").select("id").ilike("email", email).maybeSingle();
      userId = prof?.id;
    }
    if (!userId) throw new Error("User not found");

    // Delete chat messages first (FK to chats)
    const { data: chats } = await admin
      .from("aperture_chats").select("id").eq("user_id", userId);
    const chatIds = (chats ?? []).map((c: any) => c.id);
    if (chatIds.length) {
      await admin.from("aperture_messages").delete().in("chat_id", chatIds);
    }

    // Delete doc chunks before documents (FK)
    const { data: docs } = await admin
      .from("aperture_documents").select("id").eq("user_id", userId);
    const docIds = (docs ?? []).map((d: any) => d.id);
    if (docIds.length) {
      await admin.from("aperture_doc_chunks").delete().in("document_id", docIds);
    }

    const tables = [
      "aperture_memory_items",
      "aperture_memory_card",
      "aperture_chats",
      "aperture_generated_items",
      "aperture_action_runs",
      "aperture_user_tools",
      "aperture_files",
      "aperture_documents",
      "aperture_events",
      "aperture_user_profile",
    ];
    const results: Record<string, string> = {};
    for (const t of tables) {
      const { error } = await admin.from(t).delete().eq("user_id", userId);
      results[t] = error ? `error: ${error.message}` : "ok";
    }

    return new Response(
      JSON.stringify({ ok: true, userId, email, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: any) {
    console.error("aperture-reset-user error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});