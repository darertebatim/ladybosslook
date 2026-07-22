import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const resend = new Resend(RESEND_API_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PROGRAM_SLUG = "instagram6traps";

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toIcsDate(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}
function buildGoogleCalendarUrl(
  title: string,
  start: Date,
  minutes: number,
  description: string,
  location: string,
): string {
  const end = new Date(start.getTime() + minutes * 60_000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${toIcsDate(start)}/${toIcsDate(end)}`,
    details: description,
    location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY missing" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json().catch(() => ({}));
    const name = String(body?.name || "دوست عزیز").trim().slice(0, 100);
    const email = String(body?.email || "").trim().toLowerCase().slice(0, 255);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "invalid_input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: round } = await supabase
      .from("program_rounds")
      .select(
        "first_session_date, first_session_duration, google_meet_link, support_link_url",
      )
      .eq("program_slug", PROGRAM_SLUG)
      .eq("status", "active")
      .order("first_session_date", { ascending: true })
      .limit(1)
      .maybeSingle();

    const { data: prog } = await supabase
      .from("program_catalog")
      .select("title, description")
      .eq("slug", PROGRAM_SLUG)
      .maybeSingle();

    const title = prog?.title || "وبینار ۶ تله اینستاگرام";
    const meetUrl = round?.google_meet_link || "";
    const supportUrl = round?.support_link_url || "https://wa.me/16265028535";
    const durationMinutes = round?.first_session_duration || 90;
    const startUtc = round?.first_session_date
      ? new Date(round.first_session_date)
      : null;

    const laDate = startUtc
      ? new Intl.DateTimeFormat("en-US", {
          timeZone: "America/Los_Angeles",
          dateStyle: "full",
          timeStyle: "short",
        }).format(startUtc) + " (PT)"
      : "";

    const gcalUrl =
      startUtc && meetUrl
        ? buildGoogleCalendarUrl(
            title,
            startUtc,
            durationMinutes,
            `لینک ورود: ${meetUrl}\nپشتیبانی: ${supportUrl}`,
            meetUrl,
          )
        : "";

    const html = `
<!doctype html>
<html dir="rtl" lang="fa">
  <body style="margin:0;padding:0;background:#fff7ed;font-family:Tahoma,Arial,sans-serif;color:#111827;">
    <div style="max-width:560px;margin:0 auto;padding:24px 20px;">
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.4;">
        سلام ${name} عزیز 👋
      </h1>
      <p style="margin:0 0 12px;font-size:13px;color:#e11d48;font-weight:bold;">
        این وبینار مخصوص صاحبان کسب‌وکار در آمریکا و کانادا است
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.8;">
        ثبت‌نام شما در وبینار رایگان <strong>${title}</strong> با موفقیت انجام شد.
      </p>

      <div style="background:#ffffff;border:1px solid #fde68a;border-radius:14px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 8px;font-size:14px;" dir="ltr"><strong>📅 Date & Time (Los Angeles / PT):</strong><br>${laDate}</p>
        <p style="margin:8px 0;font-size:14px;"><strong>⏱ مدت:</strong> ${durationMinutes} دقیقه</p>
        ${
          meetUrl
            ? `<p style="margin:12px 0 0;font-size:14px;"><strong>🔗 لینک ورود:</strong><br>
                 <a href="${meetUrl}" style="color:#e11d48;word-break:break-all;">${meetUrl}</a></p>`
            : ""
        }
      </div>

      ${
        gcalUrl
          ? `<p style="text-align:center;margin:20px 0;">
               <a href="${gcalUrl}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:14px;">
                 افزودن به Google Calendar
               </a>
             </p>`
          : ""
      }

      <p style="margin:16px 0;font-size:14px;line-height:1.8;">
        اگر سوالی داشتی، از طریق واتس‌اپ پشتیبانی با ما در تماس باش:
        <br>
        <a href="${supportUrl}" style="color:#059669;">${supportUrl}</a>
      </p>

      <p style="margin:24px 0 0;font-size:13px;color:#6b7280;line-height:1.8;">
        منتظر دیدنت هستیم!<br>
        علی لطفی
      </p>
    </div>
  </body>
</html>`;

    const { error } = await resend.emails.send({
      from: "Ali Lotfi - Ladyboss Academy <onboarding@resend.dev>",
      to: [email],
      subject: `تایید ثبت‌نام: ${title}`,
      html,
    });

    if (error) {
      console.error("resend error", error);
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-sixtraps-confirmation error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});