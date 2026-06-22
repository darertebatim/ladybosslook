import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, AI_GATEWAY, LITE_MODEL } from "../_shared/aperture-cors.ts";

/**
 * aperture-name-chat
 *
 * Generates a short 3–6 word title for a conversation from its first
 * user + assistant exchange, and updates the chats row so the sidebar
 * stops showing "New chat". Called fire-and-forget from the client
 * after the first assistant response streams in.
 *
 * Request: { chatId: string }
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

    const { chatId } = await req.json();
    if (!chatId) return json({ error: "chatId required" }, 400);

    const { data: chat } = await supabase
      .from("aperture_chats")
      .select("id,user_id,title")
      .eq("id", chatId)
      .maybeSingle();
    if (!chat || chat.user_id !== user.id) return json({ error: "Chat not found" }, 404);

    // Don't overwrite a title the user has personalized — only replace defaults.
    const isDefault = !chat.title || chat.title === "New chat" || chat.title.length <= 2;
    if (!isDefault) return json({ ok: true, skipped: true, title: chat.title });

    const { data: msgs } = await supabase
      .from("aperture_messages")
      .select("role,content,created_at")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })
      .limit(4);
    const firstUser = (msgs ?? []).find((m: any) => m.role === "user");
    const firstAssistant = (msgs ?? []).find((m: any) => m.role === "assistant");
    if (!firstUser) return json({ error: "No user message yet" }, 400);

    const transcript = [
      `USER: ${String(firstUser.content ?? "").slice(0, 600)}`,
      firstAssistant ? `ASSISTANT: ${String(firstAssistant.content ?? "").slice(0, 600)}` : "",
    ].filter(Boolean).join("\n");

    const res = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: LITE_MODEL,
        messages: [
          {
            role: "system",
            content: "Generate a short, specific 3–6 word title for this conversation. Plain text only. No quotes. No punctuation at the end. Title Case. Describe the topic, not the action (e.g. 'Pricing The Spring Launch', not 'User Asks About Pricing').",
          },
          { role: "user", content: transcript },
        ],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return json({ error: `AI gateway: ${t.slice(0, 200)}` }, 500);
    }
    const data = await res.json();
    let title = String(data?.choices?.[0]?.message?.content ?? "").trim();
    title = title.replace(/^["'`]+|["'`]+$/g, "").replace(/[.!?]+$/g, "").trim();
    if (!title) title = "Untitled chat";
    if (title.length > 60) title = title.slice(0, 60).trim();

    await supabase.from("aperture_chats").update({ title }).eq("id", chatId);
    return json({ ok: true, title });
  } catch (e: any) {
    console.error("aperture-name-chat error", e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}