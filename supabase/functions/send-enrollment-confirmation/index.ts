import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APPSFLYER_ONELINK_URL = Deno.env.get("APPSFLYER_ONELINK_URL") || "";

const APP_STORE_URL =
  "https://apps.apple.com/app/rilo-self-care/id6499334040";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.ladybosslook.academy";
const WEB_BASE = "https://ladybosslook.com";
const RILO_MANUAL_URL =
  "https://ladybosslook.com/__l5e/assets-v1/17e4c966-fbbd-42f5-80ce-0774df439ff8/RiloManual.pdf";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(RESEND_API_KEY);

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
function gcalUrl(
  title: string,
  start: Date,
  minutes: number,
  description: string,
  location: string,
): string {
  const end = new Date(start.getTime() + Math.max(15, minutes) * 60_000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${toIcsDate(start)}/${toIcsDate(end)}`,
    details: description,
    location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function fmtDateTimePT(d: Date): string {
  return (
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      dateStyle: "full",
      timeStyle: "short",
    }).format(d) + " (PT)"
  );
}
function fmtDatePT(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    dateStyle: "long",
  }).format(d);
}

function escapeHtml(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Round = {
  id: string;
  round_name: string | null;
  round_number: number | null;
  start_date: string | null;
  end_date: string | null;
  first_session_date: string | null;
  first_session_duration: number | null;
  google_meet_link: string | null;
  google_drive_link: string | null;
  whatsapp_support_number: string | null;
  important_message: string | null;
  status: string | null;
};

function renderEmail(opts: {
  lang: "fa" | "en";
  name: string;
  program: { title: string; description: string | null; cover_image_url: string | null; slug: string };
  host: string | null;
  languageLabel: string | null;
  round: Round | null;
  order: { amount: number | null; currency: string | null } | null;
  downloadUrl: string;
  openInAppUrl: string;
  webUrl: string;
}): { subject: string; html: string } {
  const { lang, name, program, host, languageLabel, round, order, downloadUrl, openInAppUrl, webUrl } = opts;
  const isFa = lang === "fa";
  const dir = isFa ? "rtl" : "ltr";
  const font = isFa ? "Tahoma, Arial, sans-serif" : "-apple-system, Segoe UI, Roboto, Arial, sans-serif";

  const t = isFa
    ? {
        subject: `ثبت‌نام تایید شد: ${program.title} 🎉`,
        hi: `سلام ${name} عزیز 👋`,
        intro: `ثبت‌نام شما در برنامه <strong>${escapeHtml(program.title)}</strong> با موفقیت انجام شد.`,
        roundTitle: "جزئیات دوره شما",
        startDate: "📅 تاریخ شروع",
        firstSession: "🎬 اولین جلسه",
        endDate: "🏁 پایان",
        duration: "⏱ مدت جلسه",
        minutes: "دقیقه",
        meet: "🔗 لینک جلسه (Google Meet)",
        drive: "📁 فایل‌های دوره (Google Drive)",
        wa: "💬 پشتیبانی واتس‌اپ",
        important: "📌 نکته مهم",
        addToCal: "افزودن به Google Calendar",
        openInApp: "باز کردن در اپلیکیشن Rilo",
        download: "دانلود اپلیکیشن",
        appStore: "App Store",
        playStore: "Google Play",
        viewWeb: "مشاهده در وبسایت",
        webFallback: "اگر در دانلود اپلیکیشن مشکل داری، می‌توانی از نسخه دسکتاپ استفاده کنی:",
        orderTitle: "خلاصه سفارش",
        amount: "مبلغ",
        free: "رایگان",
        outro: "منتظر دیدنت هستیم!",
        signoff: "اپلیکیشن Rilo (Ladybosslook LLC.)",
        support: "اگر سوالی داشتی، به این ایمیل جواب بده یا با hi@ladybosslook.com در تماس باش.",
        supportApp: "اگر به برنامه‌ات دسترسی نداری، از پشتیبانی داخل اپلیکیشن پیام بده (دکمه‌اش بالا سمت چپ است).",
        hostLabel: "مدرس",
        langLabel: "زبان",
        stepsTitle: "چطور شروع کنم؟",
        manual: "📘 راهنمای اپلیکیشن Rilo (PDF)",
      }

    : {
        subject: `You're enrolled in ${program.title} 🎉`,
        hi: `Hi ${name} 👋`,
        intro: `You're officially enrolled in <strong>${escapeHtml(program.title)}</strong>.`,
        roundTitle: "Your program details",
        startDate: "📅 Start date",
        firstSession: "🎬 First session",
        endDate: "🏁 Ends",
        duration: "⏱ Session length",
        minutes: "minutes",
        meet: "🔗 Meeting link (Google Meet)",
        drive: "📁 Course files (Google Drive)",
        wa: "💬 WhatsApp support",
        important: "📌 Important",
        addToCal: "Add to Google Calendar",
        openInApp: "Open in the Rilo app",
        download: "Download the app",
        appStore: "App Store",
        playStore: "Google Play",
        viewWeb: "View on the web",
        webFallback: "If you have trouble downloading the app, you can use desktop mode:",
        orderTitle: "Order summary",
        amount: "Amount",
        free: "Free",
        outro: "We can't wait to have you.",
        signoff: "Rilo App (Ladybosslook LLC.)",
        support: "Questions? Reply to this email or reach us at hi@ladybosslook.com.",
        supportApp: "If you have trouble accessing your program, message our support in the app (button is on the top left).",
        hostLabel: "Host",
        langLabel: "Language",
        stepsTitle: "How to access your program",
        manual: "📘 Rilo app guide (PDF)",
      };


  const cover = program.cover_image_url
    ? `<img src="${escapeHtml(program.cover_image_url)}" alt="" style="width:100%;max-width:520px;border-radius:14px;display:block;margin:0 auto 16px;" />`
    : "";

  const meta: string[] = [];
  if (host) meta.push(`<strong>${t.hostLabel}:</strong> ${escapeHtml(host)}`);
  if (languageLabel) meta.push(`<strong>${t.langLabel}:</strong> ${escapeHtml(languageLabel)}`);
  const metaHtml = meta.length
    ? `<p style="margin:0 0 12px;font-size:13px;color:#6b7280;">${meta.join(" · ")}</p>`
    : "";

  const steps = isFa
    ? [
        "اپلیکیشن Rilo را باز کن و وارد حساب کاربری‌ات شو.",
        "از منوی بالا سمت راست (آیکون سه خط) روی «My Program» بزن.",
        "برنامه‌ات را انتخاب کن و شروع کن.",
      ]
    : [
        "Open the Rilo app and sign in.",
        "Tap the menu (three lines) at the top left and go to My Program.",
        "Choose your program and start.",
      ];

  const descHtml = `
    <div style="background:#ffffff;border:1px solid #fed7aa;border-radius:14px;padding:16px;margin:0 0 16px;">
      <h2 style="margin:0 0 10px;font-size:16px;color:#9a3412;">${t.stepsTitle}</h2>
      ${steps
        .map(
          (s, i) =>
            `<p dir="auto" style="margin:6px 0;font-size:14px;line-height:1.7;color:#374151;"><strong style="color:#ea580c;">${i + 1}.</strong> ${escapeHtml(s)}</p>`,
        )
        .join("")}
    </div>`;


  // Round block
  let roundHtml = "";
  if (round) {
    const startUtc = round.first_session_date
      ? new Date(round.first_session_date)
      : round.start_date
      ? new Date(round.start_date)
      : null;
    const dur = round.first_session_duration || 90;
    const meet = round.google_meet_link || "";

    const gcal =
      startUtc && meet
        ? gcalUrl(
            program.title,
            startUtc,
            dur,
            `${meet}`,
            meet,
          )
        : "";

    const rows: string[] = [];
    if (round.start_date) {
      rows.push(
        `<p style="margin:6px 0;font-size:14px;"><strong>${t.startDate}:</strong> ${escapeHtml(fmtDatePT(new Date(round.start_date)))}</p>`,
      );
    }
    if (round.first_session_date) {
      rows.push(
        `<p style="margin:6px 0;font-size:14px;" dir="ltr"><strong>${t.firstSession}:</strong> ${escapeHtml(fmtDateTimePT(new Date(round.first_session_date)))}</p>`,
      );
    }
    if (round.end_date) {
      rows.push(
        `<p style="margin:6px 0;font-size:14px;"><strong>${t.endDate}:</strong> ${escapeHtml(fmtDatePT(new Date(round.end_date)))}</p>`,
      );
    }
    if (round.first_session_duration) {
      rows.push(
        `<p style="margin:6px 0;font-size:14px;"><strong>${t.duration}:</strong> ${round.first_session_duration} ${t.minutes}</p>`,
      );
    }
    if (meet) {
      rows.push(
        `<p style="margin:10px 0 6px;font-size:14px;"><strong>${t.meet}:</strong><br><a href="${escapeHtml(meet)}" style="color:#ea580c;word-break:break-all;">${escapeHtml(meet)}</a></p>`,
      );
    }
    if (round.google_drive_link) {
      rows.push(
        `<p style="margin:6px 0;font-size:14px;"><strong>${t.drive}:</strong><br><a href="${escapeHtml(round.google_drive_link)}" style="color:#ea580c;word-break:break-all;">${escapeHtml(round.google_drive_link)}</a></p>`,
      );
    }
    if (round.whatsapp_support_number) {
      const wa = round.whatsapp_support_number.replace(/[^\d+]/g, "");
      rows.push(
        `<p style="margin:6px 0;font-size:14px;"><strong>${t.wa}:</strong> <a href="https://wa.me/${escapeHtml(wa.replace(/^\+/, ""))}" style="color:#059669;">${escapeHtml(round.whatsapp_support_number)}</a></p>`,
      );
    }
    if (round.important_message) {
      rows.push(
        `<p dir="auto" style="margin:12px 0 0;font-size:13px;color:#b45309;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:10px;"><strong>${t.important}:</strong><br>${escapeHtml(round.important_message)}</p>`,
      );
    }

    roundHtml = `
      <div style="background:#ffffff;border:1px solid #fed7aa;border-radius:14px;padding:16px;margin:16px 0;">
        <h2 style="margin:0 0 10px;font-size:16px;color:#9a3412;">${t.roundTitle}${round.round_name ? ` — ${escapeHtml(round.round_name)}` : ""}</h2>
        ${rows.join("")}
        ${
          gcal
            ? `<p style="text-align:center;margin:16px 0 4px;"><a href="${gcal}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-size:14px;">${t.addToCal}</a></p>`
            : ""
        }
      </div>`;
  }

  // Access buttons
  const downloadHtml = APPSFLYER_ONELINK_URL
    ? `<a href="${escapeHtml(downloadUrl)}" style="display:inline-block;background:#f3f4f6;color:#111827;text-decoration:none;padding:10px 16px;border-radius:10px;font-size:14px;border:1px solid #e5e7eb;">${t.download}</a>`
    : `
        <a href="${APP_STORE_URL}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:10px 16px;border-radius:10px;font-size:14px;margin:0 4px 8px;">${t.appStore}</a>
        <a href="${PLAY_STORE_URL}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:10px 16px;border-radius:10px;font-size:14px;margin:0 4px 8px;">${t.playStore}</a>`;

  const accessHtml = `
    <div style="text-align:center;margin:20px 0 8px;">
      <a href="${escapeHtml(openInAppUrl)}" style="display:inline-block;background:#ea580c;color:#fff;text-decoration:none;padding:12px 22px;border-radius:12px;font-size:15px;font-weight:600;margin:0 4px 10px;">${t.openInApp}</a>
      <br>
      ${downloadHtml}
      <br>
      <br>
      <a href="${RILO_MANUAL_URL}" style="display:inline-block;margin-top:10px;background:#fff7ed;color:#9a3412;text-decoration:none;padding:10px 16px;border-radius:10px;font-size:14px;border:1px solid #fed7aa;">${t.manual}</a>
    </div>`;

  const webFallbackHtml = `
    <div style="background:#f9fafb;border-radius:10px;padding:12px 14px;margin:16px 0;font-size:13px;color:#374151;">
      ${t.webFallback} <a href="${escapeHtml(webUrl)}" style="color:#ea580c;text-decoration:underline;word-break:break-all;">${escapeHtml(webUrl)}</a>
    </div>`;


  // Order summary
  let orderHtml = "";
  if (order && order.amount && order.amount > 0) {
    const currency = (order.currency || "usd").toUpperCase();
    const amt = (order.amount / 100).toFixed(2);
    orderHtml = `
      <div style="background:#f9fafb;border-radius:10px;padding:12px 14px;margin:16px 0;font-size:13px;color:#374151;">
        <strong>${t.orderTitle}:</strong> ${program.title} — ${amt} ${currency}
      </div>`;
  }

  const html = `<!doctype html>
<html dir="${dir}" lang="${lang}">
  <body style="margin:0;padding:0;background:#fff7ed;font-family:${font};color:#111827;">
    <div style="max-width:560px;margin:0 auto;padding:24px 20px;">
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.4;">${t.hi}</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.8;">${t.intro}</p>
      ${cover}
      ${metaHtml}
      ${descHtml}
      ${accessHtml}
      ${roundHtml}
      ${webFallbackHtml}
      ${orderHtml}
      <p style="margin:20px 0 0;font-size:13px;color:#6b7280;line-height:1.8;">${t.supportApp}</p>
      <p style="margin:12px 0 0;font-size:13px;color:#6b7280;line-height:1.8;">${t.support}</p>
      <p style="margin:16px 0 0;font-size:13px;color:#6b7280;line-height:1.8;">${t.outro}<br>${t.signoff}</p>
    </div>
  </body>
</html>`;


  return { subject: t.subject, html };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const userId = String(body?.user_id || "").trim();
    const programSlug = String(body?.program_slug || "").trim();
    const roundIdIn = body?.round_id ? String(body.round_id) : null;
    const roundNumberIn = body?.round_number ? Number(body.round_number) : null;
    const orderIdIn = body?.order_id ? String(body.order_id) : null;
    // Test mode: send to an arbitrary email without a user account (skips idempotency)
    const testEmail = String(body?.test_email || "").trim().toLowerCase();

    if ((!userId && !testEmail) || !programSlug) {
      return new Response(JSON.stringify({ error: "user_id (or test_email) and program_slug required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Load user (or use test email)
    let email = "";
    let name = "there";
    if (testEmail) {
      email = testEmail;
      name = testEmail.split("@")[0] || "there";
    } else {
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      email = authUser?.user?.email || "";
      if (!email) {
        return new Response(JSON.stringify({ error: "user_email_not_found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .maybeSingle();
      name =
        (profile?.full_name || authUser?.user?.user_metadata?.full_name || email.split("@")[0] || "there").toString().slice(0, 100);
    }

    // Load program
    const { data: program } = await supabase
      .from("program_catalog")
      .select("slug, title, description, cover_image_url, language")
      .eq("slug", programSlug)
      .maybeSingle();
    if (!program) {
      return new Response(JSON.stringify({ error: "program_not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve round
    let round: Round | null = null;
    if (roundIdIn) {
      const { data } = await supabase
        .from("program_rounds")
        .select(
          "id, round_name, round_number, start_date, end_date, first_session_date, first_session_duration, google_meet_link, google_drive_link, whatsapp_support_number, important_message, status",
        )
        .eq("id", roundIdIn)
        .maybeSingle();
      round = (data as any) || null;
    }
    if (!round && roundNumberIn) {
      const { data } = await supabase
        .from("program_rounds")
        .select(
          "id, round_name, round_number, start_date, end_date, first_session_date, first_session_duration, google_meet_link, google_drive_link, whatsapp_support_number, important_message, status",
        )
        .eq("program_slug", programSlug)
        .eq("round_number", roundNumberIn)
        .maybeSingle();
      round = (data as any) || null;
    }
    if (!round) {
      const { data: auto } = await supabase
        .from("program_auto_enrollment")
        .select("round_id")
        .eq("program_slug", programSlug)
        .maybeSingle();
      if (auto?.round_id) {
        const { data } = await supabase
          .from("program_rounds")
          .select(
            "id, round_name, round_number, start_date, end_date, first_session_date, first_session_duration, google_meet_link, google_drive_link, whatsapp_support_number, important_message, status",
          )
          .eq("id", auto.round_id)
          .maybeSingle();
        round = (data as any) || null;
      }
    }
    if (!round) {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from("program_rounds")
        .select(
          "id, round_name, round_number, start_date, end_date, first_session_date, first_session_duration, google_meet_link, google_drive_link, whatsapp_support_number, important_message, status",
        )
        .eq("program_slug", programSlug)
        .eq("status", "active")
        .or(`first_session_date.gte.${nowIso},start_date.gte.${nowIso}`)
        .order("first_session_date", { ascending: true, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      round = (data as any) || null;
    }

    // Load order (optional)
    let order: { amount: number | null; currency: string | null } | null = null;
    if (orderIdIn) {
      const { data } = await supabase
        .from("orders")
        .select("amount, currency")
        .eq("id", orderIdIn)
        .maybeSingle();
      order = (data as any) || null;
    }

    // Idempotency: skip if we've already sent this enrollment email
    const marker = testEmail ? `enroll-test:${programSlug}` : `enroll:${programSlug}`;
    const { data: existing } = testEmail ? { data: null } : await supabase
      .from("email_logs")
      .select("id")
      .eq("recipient_email", email)
      .eq("status", "success")
      .like("resend_id", `${marker}:%`)
      .limit(1)
      .maybeSingle();

    if (existing) {
      console.log("[ENROLL-EMAIL] already sent for", email, programSlug);
      return new Response(JSON.stringify({ ok: true, skipped: "already_sent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lang: "fa" | "en" =
      String(program.language || "").toLowerCase().startsWith("fa") ? "fa" : "en";
    const languageLabel =
      lang === "fa" ? (program.language ? "فارسی" : null) : program.language ? String(program.language).toUpperCase() : null;

    const openInAppUrl = `${WEB_BASE}/app/programs/${programSlug}`;
    const webUrl = `${WEB_BASE}/programs/${programSlug}`;
    const downloadUrl = APPSFLYER_ONELINK_URL || APP_STORE_URL;

    const { subject, html } = renderEmail({
      lang,
      name,
      program: {
        slug: program.slug,
        title: program.title,
        description: program.description,
        cover_image_url: (program as any).cover_image_url ?? null,
      },
      host: null,
      languageLabel,
      round,
      order,
      downloadUrl,
      openInAppUrl,
      webUrl,
    });

    const { data: sendData, error } = await resend.emails.send({
      from: "Ladyboss Academy <hi@ladybosslook.com>",
      to: [email],
      subject,
      html,
    });

    if (error) {
      console.error("[ENROLL-EMAIL] resend error", error);
      await supabase.from("email_logs").insert({
        recipient_email: email,
        status: "failed",
        error_message: `${marker}: ${String(error)}`,
      });
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("email_logs").insert({
      recipient_email: email,
      status: "success",
      resend_id: `${marker}:${(sendData as any)?.id ?? "sent"}`,
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[ENROLL-EMAIL] error", e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});