import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const WEB_BASE = "https://ladybosslook.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FORMS: Record<string, { path: string; titleFa: string; titleEn: string; chatFa: string; buttonFa: string }> = {
  profileanalyze: {
    path: "/dashboard/forms/profileanalyze",
    titleFa: "فرم تحلیل پیج اینستاگرام",
    titleEn: "Instagram profile analysis form",
    chatFa:
      "📝 برای دریافت تحلیل پیج اینستاگرامتان، لطفاً فرم تحلیل را پر کنید.\nاز دکمه زیر وارد فرم شوید 👇",
    buttonFa: "پر کردن فرم تحلیل 📝",
  },
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function buildHtml(lang: "fa" | "en", link: string, form: (typeof FORMS)[string]) {
  const rtl = lang === "fa";
  const t = rtl
    ? {
        title: form.titleFa,
        intro:
          "برای دریافت تحلیل پیج اینستاگرامتان، کافی است روی دکمه زیر بزنید. مستقیم وارد حساب خودتان در ریلو می‌شوید و فرم باز می‌شود — نیازی به ورود دوباره نیست.",
        cta: "باز کردن فرم",
        note: "این لینک تا ۱ ساعت معتبر است و فقط یک بار قابل استفاده است. اگر منقضی شد، از داخل چت پشتیبانی اپ هم می‌توانید فرم را باز کنید.",
      }
    : {
        title: form.titleEn,
        intro:
          "Tap the button below — you'll be signed straight into your Rilo account and the form will open. No need to sign in again.",
        cta: "Open the form",
        note: "This link works for 1 hour and can be used once. You can also open the form from your support chat in the app.",
      };
  return `<!DOCTYPE html><html dir="${rtl ? "rtl" : "ltr"}"><body style="margin:0;padding:24px;background:#FFF7F1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Tahoma,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:18px;padding:28px;">
<h1 style="margin:0 0 14px;font-size:22px;color:#2B1A12;">📝 ${t.title}</h1>
<p style="margin:0 0 22px;color:#4A3527;font-size:15px;line-height:1.7;">${t.intro}</p>
<a href="${link}" style="display:block;text-align:center;background:#F26B21;color:#ffffff;text-decoration:none;font-size:17px;font-weight:700;padding:16px 20px;border-radius:14px;">${t.cta}</a>
<p style="margin:22px 0 0;color:#7A5C4A;font-size:13px;line-height:1.7;">${t.note}</p>
</div></body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  console.log("send-form-invite request", req.method);
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

    const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
    const formUrl = `${WEB_BASE}${form.path}`;
    const results: { user_id: string; chat: boolean; email: boolean; error?: string }[] = [];

    for (const userId of userIds) {
      const r = { user_id: userId, chat: false, email: false } as (typeof results)[number];
      try {
        const { data: profile } = await admin
          .from("profiles")
          .select("email, preferred_language")
          .eq("id", userId)
          .maybeSingle();
        const { data: authUser } = await admin.auth.admin.getUserById(userId);
        const email = authUser?.user?.email || (profile as any)?.email;
        const pl = String((profile as any)?.preferred_language || "").toLowerCase();
        const lang: "fa" | "en" = pl.startsWith("fa") || pl === "persian" || !pl ? "fa" : "en";

        // 1) In-app chat message with button (legacy + structured)
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
        const content = `${form.chatFa}\n\n🔗 LINK_BUTTON:${formUrl}:${form.buttonFa}`;
        const { error: mErr } = await admin.from("chat_messages").insert({
          conversation_id: convId,
          sender_id: adminId,
          sender_type: "admin",
          content,
          buttons: [{ label: form.buttonFa, url: formUrl }],
        });
        if (mErr) throw mErr;
        await admin
          .from("chat_conversations")
          .update({ last_message_at: new Date().toISOString(), unread_count_user: unread + 1 })
          .eq("id", convId);
        r.chat = true;
        admin.functions
          .invoke("send-chat-notification", {
            body: { conversationId: convId, messageContent: form.chatFa.split("\n")[0], senderType: "admin", senderId: adminId },
          })
          .catch((e) => console.error("notify failed", e));

        // 2) Email with one-time sign-in link
        if (resend && email) {
          const { data: link, error: lErr } = await admin.auth.admin.generateLink({
            type: "magiclink",
            email,
            options: { redirectTo: formUrl },
          });
          if (!lErr && link?.properties?.action_link) {
            const { error: sErr } = await resend.emails.send({
              from: "Ladyboss Academy <hi@ladybosslook.com>",
              to: [email],
              subject: lang === "fa" ? "📝 فرم تحلیل پیج اینستاگرام شما — ورود با یک کلیک" : "📝 Your Instagram analysis form — one-tap sign in",
              html: buildHtml(lang, link.properties.action_link, form),
            });
            r.email = !sErr;
            if (sErr) console.error("resend", sErr);
          }
        }

        await admin.from("form_invites").insert({
          user_id: userId,
          form_key: formKey,
          invited_by: adminId,
          channels: [r.chat ? "chat" : null, r.email ? "email" : null].filter(Boolean),
        });
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
