import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const WEB_BASE = "https://ladybosslook.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Chat copy: `{LINK}` is replaced with the per-student one-time sign-in link.
const FORMS: Record<string, { path: string; titleFa: string; titleEn: string; chatTitle: string; chatBody: string }> = {
  profileanalyze: {
    path: "/dashboard/forms/profileanalyze",
    titleFa: "فرم تحلیل پیج اینستاگرام",
    titleEn: "Instagram profile analysis form",
    chatTitle: "📢 بونس آنالیز پیج با استاد علی",
    chatBody:
      "سلام ، خبر خوب برای شمایی که برنده آنالیز پروفایل اینستاگرام با استاد لطفی هستی\n\n" +
      "حتما این فرم رو پر کنید تا توی هفته آینده استاد صفحه ایسنتاگرام شما رو هم آنالیز کنن و بهتون نتیجه رو بفرستن:\n" +
      "{LINK}\n\n" +
      "البته مطمئن بشید مواردی که داخل جزوه پروفایل اعتمادساز قرار گرفته رو اجرا کردین و بتونیم راهنمایی بهتر بدیم",
  },
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  console.log("send-form-invite request", req.method);

  // Public redirector used by the in-app chat button: opens in the browser
  // (older app builds don't have the form route) and signs the student into
  // their own account via a fresh one-time link.
  if (req.method === "GET") {
    const url = new URL(req.url);
    const inviteId = url.searchParams.get("i") || "";
    const fallback = `${WEB_BASE}${FORMS.profileanalyze.path}`;
    const redirect = (to: string) => new Response(null, { status: 302, headers: { Location: to } });
    if (!/^[0-9a-f-]{36}$/i.test(inviteId)) return redirect(fallback);
    try {
      const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
      const { data: inv } = await admin
        .from("form_invites")
        .select("user_id, form_key, sent_at")
        .eq("id", inviteId)
        .maybeSingle();
      const form = inv ? FORMS[(inv as any).form_key] : null;
      const fresh = inv && Date.now() - new Date((inv as any).sent_at).getTime() < 30 * 24 * 3600 * 1000;
      if (!form || !fresh) return redirect(fallback);
      const target = `${WEB_BASE}${form.path}`;
      const { data: au } = await admin.auth.admin.getUserById((inv as any).user_id);
      const email = au?.user?.email;
      if (!email) return redirect(target);
      const { data: link } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo: target },
      });
      return redirect(link?.properties?.action_link || target);
    } catch (e) {
      console.error("redirect failed", e);
      return redirect(fallback);
    }
  }
  try {
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "").trim();
    if (!token) return json({ error: "Not authenticated" }, 401);
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data: u, error: uErr } = await admin.auth.getUser(token);
    const adminId = u?.user?.id;
    if (!adminId) {
      console.error("auth failed", uErr?.message);
      return json({ error: `Not authenticated${uErr?.message ? `: ${uErr.message}` : ""}` }, 401);
    }
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: adminId, _role: "admin" });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const formKey = typeof body.form === "string" ? body.form : "";
    const form = FORMS[formKey];
    const userIds: string[] = Array.isArray(body.user_ids)
      ? body.user_ids.filter((x: unknown) => typeof x === "string" && /^[0-9a-f-]{36}$/i.test(x as string)).slice(0, 200)
      : [];
    if (!form || userIds.length === 0) return json({ error: "Invalid form or users" }, 400);

    const results: { user_id: string; chat: boolean; error?: string }[] = [];

    for (const userId of userIds) {
      const r = { user_id: userId, chat: false } as (typeof results)[number];
      try {
        const inviteId = crypto.randomUUID();
        const { error: iErr } = await admin.from("form_invites").insert({
          id: inviteId,
          user_id: userId,
          form_key: formKey,
          invited_by: adminId,
          channels: [],
        });
        if (iErr) throw iErr;
        const chatUrl = `${SUPABASE_URL}/functions/v1/send-form-invite?i=${inviteId}`;

        // 1) In-app chat message with the personal sign-in link
        let convId: string | null = null;
        let unread = 0;
        const { data: conv } = await admin
          .from("chat_conversations")
          .select("id, unread_count_user")
          .eq("user_id", userId)
          .eq("inbox_type", "support")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (conv) {
          convId = (conv as any).id;
          unread = (conv as any).unread_count_user || 0;
        } else {
          const { data: created, error: cErr } = await admin
            .from("chat_conversations")
            .insert({ user_id: userId, status: "open" })
            .select("id")
            .single();
          if (cErr) throw cErr;
          convId = (created as any).id;
        }
        // Plain link (no button): points to our redirector, which opens in the
        // browser and signs the student into their own account.
        const content = `${form.chatTitle}\n\n${form.chatBody.replace("{LINK}", chatUrl)}`;
        const { error: mErr } = await admin.from("chat_messages").insert({
          conversation_id: convId,
          sender_id: adminId,
          sender_type: "admin",
          content,
        });
        if (mErr) throw mErr;
        await admin
          .from("chat_conversations")
          .update({ last_message_at: new Date().toISOString(), unread_count_user: unread + 1 })
          .eq("id", convId);
        r.chat = true;
        // Push notification (awaited so a failure surfaces in results/logs)
        try {
          await admin.functions.invoke("send-chat-notification", {
            body: { conversationId: convId, messageContent: form.chatTitle, senderType: "admin", senderId: adminId },
          });
        } catch (e) {
          console.error("notify failed", userId, e);
        }

        await admin
          .from("form_invites")
          .update({ channels: ["chat"] })
          .eq("id", inviteId);
      } catch (e) {
        console.error("invite failed", userId, e);
        r.error = String((e as any)?.message || e);
      }
      results.push(r);
    }

    console.log("send-form-invite results", JSON.stringify(results));
    return json({ success: true, results });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
