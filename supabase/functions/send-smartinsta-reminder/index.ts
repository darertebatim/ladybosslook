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

const PROGRAM_SLUG = "smartinstagramframework";
const SOURCES = ["smartinsta_registration"];
const PRE_VIDEO_URL = "https://ladybosslook.com/thankyousmartinstaframework";

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

const CITY_ZONES: { label: string; tz: string }[] = [
  { label: "Los Angeles / Vancouver", tz: "America/Los_Angeles" },
  { label: "New York / Toronto", tz: "America/New_York" },
  { label: "Chicago / Texas", tz: "America/Chicago" },
  { label: "Sydney", tz: "Australia/Sydney" },
];

function fmtZone(d: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

function buildHtml(
  name: string,
  startUtc: Date | null,
  meetUrl: string,
  gcalUrl: string,
  supportUrl: string,
): string {
  const rows = startUtc
    ? CITY_ZONES.map(
        (z) => `
        <tr>
          <td style="padding:6px 10px;font-size:13px;border-bottom:1px solid #fde68a;">${z.label}</td>
          <td style="padding:6px 10px;font-size:13px;border-bottom:1px solid #fde68a;" dir="ltr"><strong>${fmtZone(startUtc, z.tz)}</strong></td>
        </tr>`,
      ).join("")
    : "";

  return `
<!doctype html>
<html dir="rtl" lang="fa">
  <body style="margin:0;padding:0;background:#fff7ed;font-family:Tahoma,Arial,sans-serif;color:#111827;">
    <div style="max-width:560px;margin:0 auto;padding:24px 20px;">
      <h1 style="margin:0 0 14px;font-size:20px;line-height:1.6;">
        سلام ${name}، میخوام مطمئن بشم وبینار فریم‌ورک اینستاگرام هوشمند رو از دست نمیدین 🌷
      </h1>

      <p style="margin:0 0 10px;font-size:15px;line-height:1.9;">
        ویدیو پیش‌نیاز وبینار رو دیدین؟
      </p>
      <p style="text-align:center;margin:16px 0;">
        <a href="${PRE_VIDEO_URL}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-size:15px;">
          تماشای ویدیو پیش‌نیاز
        </a>
      </p>

      <p style="margin:18px 0 10px;font-size:15px;line-height:1.9;">
        آیا جلسه رو به کلندر ادد کردین؟
      </p>
      ${
        gcalUrl
          ? `<p style="text-align:center;margin:16px 0;">
               <a href="${gcalUrl}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-size:15px;">
                 افزودن به تقویم
               </a>
             </p>`
          : ""
      }

      ${
        rows
          ? `<div style="background:#ffffff;border:1px solid #fde68a;border-radius:14px;padding:12px;margin:20px 0;">
               <p style="margin:0 0 8px;font-size:14px;font-weight:bold;">⏰ ساعت جلسه در شهرهای مختلف</p>
               <table style="width:100%;border-collapse:collapse;">${rows}</table>
             </div>`
          : ""
      }

      ${
        meetUrl
          ? `<p style="margin:14px 0;font-size:14px;"><strong>🔗 لینک ورود:</strong><br>
               <a href="${meetUrl}" style="color:#7c3aed;word-break:break-all;">${meetUrl}</a></p>`
          : ""
      }

      <p style="margin:20px 0 0;font-size:16px;line-height:1.9;font-weight:bold;">
        🌷🌷 منتظر دیدنتون در وبینار هستم
      </p>

      <p style="margin:18px 0 0;font-size:13px;color:#6b7280;line-height:1.9;">
        سوالی داشتی؟ واتس‌اپ پشتیبانی:
        <a href="${supportUrl}" style="color:#059669;">${supportUrl}</a>
        <br><br>علی لطفی
      </p>
    </div>
  </body>
</html>`;
}

function buildJoinNowHtml(
  name: string,
  meetUrl: string,
  supportUrl: string,
): string {
  return `
<!doctype html>
<html dir="rtl" lang="fa">
  <body style="margin:0;padding:0;background:#fff7ed;font-family:Tahoma,Arial,sans-serif;color:#111827;">
    <div style="max-width:560px;margin:0 auto;padding:24px 20px;text-align:center;">
      <h1 style="margin:0 0 14px;font-size:22px;line-height:1.6;">
        سلام ${name} 🌷 وبینار در حال شروع است
      </h1>
      <p style="margin:0 0 18px;font-size:16px;line-height:1.9;">
        همین حالا وارد شوید 👇
      </p>
      ${
        meetUrl
          ? `<p style="margin:18px 0;">
               <a href="${meetUrl}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:16px 32px;border-radius:12px;font-size:18px;font-weight:bold;">
                 ورود به وبینار
               </a>
             </p>
             <p style="margin:8px 0 0;font-size:13px;">
               <a href="${meetUrl}" style="color:#7c3aed;word-break:break-all;">${meetUrl}</a>
             </p>`
          : ""
      }
      <p style="margin:22px 0 0;font-size:13px;color:#6b7280;line-height:1.9;">
        مشکلی داشتی؟ واتس‌اپ پشتیبانی:
        <a href="${supportUrl}" style="color:#059669;">${supportUrl}</a>
        <br><br>علی لطفی
      </p>
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Require an admin caller
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    const userId = userData?.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const testEmail = String(body?.testEmail || "").trim().toLowerCase();
    const requestedRoundId = String(body?.roundId || "").trim();
    const onlyUnsent = body?.onlyUnsent !== false;
    const joinNow = body?.joinNow === true;

    // Round resolution: explicit -> auto-enrollment round -> earliest active
    const roundCols =
      "id, first_session_date, first_session_duration, google_meet_link, support_link_url";

    let roundId = requestedRoundId;
    if (!roundId) {
      const { data: autoRule } = await supabase
        .from("program_auto_enrollment")
        .select("round_id")
        .eq("program_slug", PROGRAM_SLUG)
        .maybeSingle();
      roundId = autoRule?.round_id || "";
    }

    const { data: round } = roundId
      ? await supabase
          .from("program_rounds")
          .select(roundCols)
          .eq("id", roundId)
          .maybeSingle()
      : await supabase
          .from("program_rounds")
          .select(roundCols)
          .eq("program_slug", PROGRAM_SLUG)
          .eq("status", "active")
          .order("first_session_date", { ascending: true })
          .limit(1)
          .maybeSingle();

    const targetRoundId = round?.id || roundId || null;

    const { data: prog } = await supabase
      .from("program_catalog")
      .select("title")
      .eq("slug", PROGRAM_SLUG)
      .maybeSingle();

    const title = prog?.title || "وبینار فریم‌ورک اینستاگرام هوشمند";
    const meetUrl = round?.google_meet_link || "";
    const supportUrl = round?.support_link_url || "https://wa.me/16265028538";
    const durationMinutes = round?.first_session_duration || 90;
    const startUtc = round?.first_session_date
      ? new Date(round.first_session_date)
      : null;

    const gcalUrl = startUtc
      ? buildGoogleCalendarUrl(
          title,
          startUtc,
          durationMinutes,
          `ویدیو پیش‌نیاز: ${PRE_VIDEO_URL}\n${meetUrl ? `لینک ورود: ${meetUrl}\n` : ""}پشتیبانی: ${supportUrl}`,
          meetUrl || PRE_VIDEO_URL,
        )
      : "";

    let recipients: { email: string; name: string }[] = [];

    if (testEmail) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
        return new Response(JSON.stringify({ error: "invalid_email" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      recipients = [{ email: testEmail, name: "دوست عزیز" }];
    } else {
      let query = supabase
        .from("form_submissions")
        .select("email, name")
        .in("source", SOURCES)
        .limit(5000);
      if (targetRoundId) query = query.eq("round_id", targetRoundId);
      if (onlyUnsent) {
        query = joinNow
          ? query.is("join_now_sent_at", null)
          : query.is("reminder_sent_at", null);
      }
      const { data: rows, error } = await query;
      if (error) throw error;
      const seen = new Set<string>();
      for (const r of rows || []) {
        const em = String(r.email || "").trim().toLowerCase();
        if (!em || seen.has(em)) continue;
        seen.add(em);
        recipients.push({ email: em, name: (r.name || "دوست عزیز").trim() });
      }
    }

    let sent = 0;
    let failed = 0;

    for (const r of recipients) {
      const html = joinNow
        ? buildJoinNowHtml(r.name, meetUrl, supportUrl)
        : buildHtml(r.name, startUtc, meetUrl, gcalUrl, supportUrl);
      const { data: sendData, error } = await resend.emails.send({
        from: "Ali Lotfi - Ladyboss Academy <hi@ladybosslook.com>",
        to: [r.email],
        subject: joinNow
          ? "وبینار در حال شروع است — همین حالا وارد شوید 🚀"
          : "یادآوری: وبینار فریم‌ورک اینستاگرام هوشمند + ویدیو پیش‌نیاز 🎬",
        html,
      });

      if (error) {
        failed++;
        console.error("resend error", r.email, error);
        await supabase.from("email_logs").insert({
          recipient_email: r.email,
          status: "failed",
          error_message: String(error),
        });
      } else {
        sent++;
        await supabase.from("email_logs").insert({
          recipient_email: r.email,
          resend_id: (sendData as any)?.id ?? null,
          status: "success",
        });
        if (!testEmail && joinNow) {
          await supabase
            .from("form_submissions")
            .update({
              join_now_sent_at: new Date().toISOString(),
              join_now_round_id: targetRoundId,
            })
            .eq("email", r.email)
            .in("source", SOURCES);
        } else if (!testEmail) {
          await supabase
            .from("form_submissions")
            .update({
              reminder_sent_at: new Date().toISOString(),
              reminder_round_id: targetRoundId,
            })
            .eq("email", r.email)
            .in("source", SOURCES);
        }
      }
      // gentle pacing for Resend rate limits
      await new Promise((res) => setTimeout(res, 120));
    }

    return new Response(
      JSON.stringify({ ok: true, total: recipients.length, sent, failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("send-smartinsta-reminder error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});