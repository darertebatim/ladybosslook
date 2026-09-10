import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const resend = new Resend(RESEND_API_KEY);
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GIFTS_URL = "https://ladybosslook.com/giftsalilotfivip";
const WHATSAPP_URL = "https://wa.me/16265028538";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function unsubToken(email: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(supabaseServiceKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(email));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

function buildHtml(unsubscribeUrl: string): string {
  const btn = (label: string, url: string, bg: string) =>
    `<tr><td align="center" style="padding:6px 0;"><a href="${esc(url)}" style="display:inline-block;background:${bg};color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 28px;border-radius:12px;">${esc(label)}</a></td></tr>`;

  return `<!DOCTYPE html>
<html dir="rtl">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#f6f6f7;font-family:Tahoma, 'Iranian Sans', Arial, sans-serif;">
    <span style="display:none;font-size:0;line-height:0;opacity:0;">هدایای ویژه وبینار اینستاگرام ادز</span>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f7;padding:24px 12px;">
      <tr><td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
          <tr><td style="padding:28px 28px 8px;" dir="rtl">
            <h1 style="margin:0 0 18px;font-size:22px;line-height:1.5;color:#111;text-align:right;">🎁 هدایای ویژه وبینار</h1>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.9;color:#333;text-align:right;">
              ممنون که در وبینار «جذب مشتری با اینستاگرام ادز» همراه ما بودید! همان‌طور که قول داده بودیم، هدایای ویژه شما آماده است.
            </p>
            <p style="margin:0 0 16px;font-size:16px;line-height:1.9;color:#333;text-align:right;">
              برای دریافت هدایا روی دکمه زیر بزنید. اگر هم سؤالی داشتید، از طریق واتس‌اپ در خدمت شما هستیم.
            </p>
          </td></tr>
          <tr><td style="padding:8px 28px 24px;"><table width="100%" cellpadding="0" cellspacing="0">
            ${btn("دریافت هدایا 🎁", GIFTS_URL, "#EA5B2B")}
            ${btn("گفتگو در واتس‌اپ 💬", WHATSAPP_URL, "#25D366")}
          </table></td></tr>
          <tr><td style="padding:4px 28px 24px;" dir="rtl">
            <div style="font-size:15px;line-height:1.8;color:#444;text-align:right;">
              با احترام،<br>استاد علی لطفی<br>Rilo App (Ladybosslook LLC.)
            </div>
          </td></tr>
          <tr><td style="padding:16px 28px 28px;border-top:1px solid #eee;text-align:center;color:#8a8a8a;font-size:12px;line-height:1.7;">
            Rilo App (Ladybosslook LLC.)<br>
            <a href="${esc(unsubscribeUrl)}" style="color:#8a8a8a;">لغو اشتراک ایمیل‌ها</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    const clean = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) || clean.length > 255) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save email with server timestamp (created_at defaults to now()).
    const { error: dbError } = await supabase.from("form_submissions").insert({
      name: "",
      email: clean,
      city: "",
      phone: "",
      source: "igads_gifts",
    });
    if (dbError) {
      console.warn("igads gifts insert error", dbError);
    }

    // Skip email if unsubscribed.
    const { data: unsub } = await supabase
      .from("email_unsubscribes")
      .select("email")
      .eq("email", clean)
      .maybeSingle();

    let emailSent = false;
    if (!unsub) {
      const unsubscribeUrl = `https://ladybosslook.com/unsubscribe?e=${encodeURIComponent(clean)}&t=${await unsubToken(clean)}`;
      const { error: sendError } = await resend.emails.send({
        from: "Ali Lotfi <support@ladybosslook.com>",
        to: [clean],
        subject: "🎁 هدایای ویژه وبینار اینستاگرام ادز",
        html: buildHtml(unsubscribeUrl),
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });
      if (sendError) {
        console.error("igads gifts email error", sendError);
      } else {
        emailSent = true;
      }
    }

    return new Response(JSON.stringify({ ok: true, emailSent }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-igads-gifts error", err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
