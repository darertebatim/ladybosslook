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
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(RESEND_API_KEY);

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
}

function buildHtml(opts: {
  lang: "fa" | "en";
  link: string;
  programName: string;
}) {
  const { lang, link, programName } = opts;
  const rtl = lang === "fa";
  const name = escapeHtml(programName || "");
  const t = rtl
    ? {
        title: "ورود به ریلو روی کامپیوتر",
        intro:
          "این لینک ورود یک‌بار مصرف شماست. کافی است این ایمیل را روی کامپیوترتان باز کنید و روی دکمه زیر بزنید تا مستقیم وارد حساب خودتان شوید.",
        cta: "ورود به ریلو روی کامپیوتر",
        program: name ? `برنامه: ${name}` : "",
        note: "این لینک تا ۱ ساعت معتبر است و فقط یک بار قابل استفاده است. اگر شما درخواست نکرده‌اید، این ایمیل را نادیده بگیرید.",
        fallback: "اگر دکمه کار نکرد، این آدرس را در مرورگر کامپیوترتان باز کنید:",
      }
    : {
        title: "Open Rilo on your computer",
        intro:
          "Here's your one-time login link. Open this email on your computer and click the button below — you'll be signed straight into your account.",
        cta: "Open Rilo on my computer",
        program: name ? `Program: ${name}` : "",
        note: "This link works for 1 hour and can be used once. If you didn't ask for it, you can ignore this email.",
        fallback: "If the button doesn't work, paste this address into your computer's browser:",
      };

  return `<!DOCTYPE html>
<html dir="${rtl ? "rtl" : "ltr"}">
  <body style="margin:0;padding:24px;background:#FFF7F1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Tahoma,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:18px;padding:28px;">
      <h1 style="margin:0 0 14px;font-size:22px;color:#2B1A12;">💻 ${t.title}</h1>
      ${t.program ? `<p style="margin:0 0 10px;color:#7A5C4A;font-size:14px;">${t.program}</p>` : ""}
      <p style="margin:0 0 22px;color:#4A3527;font-size:15px;line-height:1.7;">${t.intro}</p>
      <a href="${link}" style="display:block;text-align:center;background:#F26B21;color:#ffffff;text-decoration:none;font-size:17px;font-weight:700;padding:16px 20px;border-radius:14px;">${t.cta}</a>
      <p style="margin:22px 0 6px;color:#7A5C4A;font-size:13px;line-height:1.7;">${t.note}</p>
      <p style="margin:14px 0 4px;color:#7A5C4A;font-size:12px;">${t.fallback}</p>
      <p style="margin:0;word-break:break-all;font-size:12px;color:#B0897A;">${link}</p>
    </div>
  </body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    const user = userData?.user;
    if (userErr || !user?.email) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const rawPath = typeof body.redirectPath === "string" ? body.redirectPath : "/app";
    const redirectPath = /^\/app(\/[A-Za-z0-9\-_/]*)?$/.test(rawPath) ? rawPath : "/app";
    const programName =
      typeof body.programName === "string" ? body.programName.slice(0, 120) : "";
    const lang: "fa" | "en" = body.lang === "fa" ? "fa" : "en";

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: user.email,
      options: { redirectTo: `${WEB_BASE}${redirectPath}` },
    });

    if (linkErr || !linkData?.properties?.action_link) {
      console.error("generateLink failed:", linkErr);
      return new Response(
        JSON.stringify({ error: "Could not create login link" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const html = buildHtml({
      lang,
      link: linkData.properties.action_link,
      programName,
    });

    const { error: sendErr } = await resend.emails.send({
      from: "Ladyboss Academy <hi@ladybosslook.com>",
      to: [user.email],
      subject:
        lang === "fa"
          ? "لینک ورود یک‌بار مصرف به ریلو روی کامپیوتر 💻"
          : "Your one-time link to open Rilo on your computer 💻",
      html,
    });

    if (sendErr) {
      console.error("Resend error:", sendErr);
      return new Response(
        JSON.stringify({ error: "Could not send the email" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ success: true, email: user.email }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-desktop-login-link error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
