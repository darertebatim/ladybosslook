// Sends the "Morning of the webinar" and "Starting now" emails for IG Ads
// webinar rounds (program_slug = igadsfree, both /l/igadsfree and /l/aliagads
// signups). Runs hourly via pg_cron.
//
// - morning: sent at ~8:00 AM in each registrant's own timezone on the session
//   day. Timezone comes from form_submissions.timezone (captured at signup);
//   older signups fall back to the round side (West rounds → Pacific, others →
//   Eastern).
// - start: sent when the live session is about to begin (within the next
//   ~45 min), includes the join link.
// - reminder: sent 2–3 hours after each signup (prerequisite video + add to
//   calendar). Skipped when the session starts within the next 6 hours —
//   those people get the morning/start emails instead.
//
// Manual mode (admin): { "round_id": "...", "kind": "morning" | "start" |
//   "reminder", "testEmail": "you@x.com" }
import { isInternalOrAdmin, deny, escapeHtml } from "../_shared/caller-auth.ts";
import { buildUnsubUrl, unsubHeaders, appendUnsubFooter, fetchUnsubscribed } from "../_shared/unsubscribe.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-timezone, x-cron-secret",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const FROM = "Ali Lotfi - Ladyboss Academy <hi@ladybosslook.com>";
const SUPPORT_URL =
  "https://ladyboss.onelink.me/lt6v?af_xp=custom&pid=email_support&c=webinar_day&deep_link_value=support&af_web_dp=https%3A%2F%2Fladybosslook.com%2Fdashboard%2Fchat";

type Kind = "morning" | "start" | "reminder";

// Subjects keep the prefixes that src/lib/igAdsRoundStats.ts uses to classify
// automated emails for open-rate stats. Copy matches the proven manual
// campaigns sent on 2026-10-17.
const SUBJECTS: Record<Kind, string> = {
  morning: "امروز: جذب مشتری واقعی با تبلیغات اینستاگرام 🌷",
  start: "وبینار در حال شروع است — همین حالا وارد شوید 🚀",
  reminder: "یادآوری وبینار اینستاگرام ادز + ویدیوی پیش‌نیاز 🌷",
};

function tzParts(d: Date, tz: string): { hour: number; date: string } {
  try {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
    });
    const parts = fmt.formatToParts(d);
    const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
    return { hour: parseInt(get("hour"), 10) % 24, date: `${get("year")}-${get("month")}-${get("day")}` };
  } catch {
    return { hour: -1, date: "" };
  }
}

function fmtLocal(d: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

/** Registrant timezone: stored at signup, else inferred from the round side. */
function registrantTz(stored: string | null, roundName: string): string {
  if (stored && stored.includes("/")) return stored;
  return /west/i.test(roundName) ? "America/Los_Angeles" : "America/New_York";
}

const CITY_ZONES: { label: string; tz: string }[] = [
  { label: "Los Angeles / Vancouver", tz: "America/Los_Angeles" },
  { label: "New York / Toronto", tz: "America/New_York" },
  { label: "Chicago / Texas", tz: "America/Chicago" },
  { label: "Sydney", tz: "Australia/Sydney" },
];

function fmtZoneShort(d: Date, tz: string): string {
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

const FA_WEEKDAYS = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];

function faWeekday(d: Date, tz: string): string {
  try {
    const wd = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long" }).format(d);
    const idx = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(wd);
    return idx >= 0 ? FA_WEEKDAYS[idx] : "";
  } catch {
    return "";
  }
}

function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Tracked Google Calendar link (clicks counted via the calendar-click function). */
function calendarClickUrl(round: any, email: string): string {
  const start = new Date(round.first_session_date);
  const end = new Date(start.getTime() + 90 * 60_000);
  const meet: string = round.google_meet_link || "";
  const details =
    `ویدیوی پیش‌نیاز: https://ladybosslook.com/l/igadsfree/thankyou\n` +
    `لینک ورود: ${meet}\n` +
    `پشتیبانی: ${SUPPORT_URL}`;
  const gcal =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent("Instagram Ads وبینار جذب مشتری با اینستاگرام ادز")}` +
    `&dates=${icsDate(start)}/${icsDate(end)}` +
    `&details=${encodeURIComponent(details)}` +
    `&location=${encodeURIComponent(meet)}`;
  return (
    `${supabaseUrl}/functions/v1/calendar-click?to=${encodeURIComponent(gcal)}` +
    `&p=email:igads&r=${round.id}&e=${encodeURIComponent(email)}`
  );
}

// Exact copy of the proven manual campaigns (sent 2026-10-17), with the
// session time table and join link generated per round.
function buildHtml(kind: Kind, name: string, round: any, tz: string, email: string): string {
  const start = new Date(round.first_session_date);
  const meetUrl: string = round.google_meet_link || "";
  const p = (text: string) =>
    `<p dir="rtl" style="margin:0 0 12px;font-size:15px;line-height:2;text-align:right;direction:rtl;">${text}</p>`;

  const zoneRows = CITY_ZONES.map(
    (z) => `
        <tr>
          <td style="padding:6px 10px;font-size:13px;border-bottom:1px solid #fde68a;">${z.label}</td>
          <td style="padding:6px 10px;font-size:13px;border-bottom:1px solid #fde68a;" dir="ltr"><strong>${fmtZoneShort(start, z.tz)}</strong></td>
        </tr>`,
  ).join("");

  const meetBlock = meetUrl
    ? `<p style="text-align:center;margin:20px 0;">
               <a href="${escapeHtml(meetUrl)}" style="display:inline-block;background:#e11d48;color:#fff;text-decoration:none;padding:16px 32px;border-radius:12px;font-size:17px;font-weight:bold;">
                 ورود به وبینار رایگان
               </a>
             </p>
             <p style="text-align:center;margin:0 0 8px;font-size:13px;">
               <a href="${escapeHtml(meetUrl)}" style="color:#e11d48;word-break:break-all;" dir="ltr">${escapeHtml(meetUrl)}</a>
             </p>`
    : "";

  const supportFooter = `
      <p style="margin:18px 0 0;font-size:13px;color:#6b7280;line-height:1.9;">
        سوالی داشتی؟ <a href="${SUPPORT_URL}" style="color:#EA5B2B;">از اپ ریلو با ما چت کن 💬</a>
        <br>روی کامپیوتر هستی؟ <a href="https://ladybosslook.com/dashboard/chat" style="color:#EA5B2B;">چت پشتیبانی در داشبورد</a> — یا همین ایمیل را جواب بده.
      </p>`;

  const reminderInner = `
    <div dir="rtl" style="direction:rtl;text-align:right;max-width:560px;margin:0 auto;padding:24px 20px;">
      <h1 style="margin:0 0 14px;font-size:20px;line-height:1.6;">
        سلام دوست عزیز، میخوام مطمئن بشم وبینار اینستاگرام ادز رو از دست نمیدین 🌷
      </h1>

      ${p(`${faWeekday(start, tz)} فقط <strong>یک ساعت</strong> از وقت‌تان را بگذارید — نه برای تماشای یک ویدیو، برای جلوگیری از هدر رفتن بودجه تبلیغات‌تان.`)}
      ${p("هر روزی که کمپین تبلیغ‌تان درست تنظیم نشده باشد، بودجه‌تان بی‌صدا می‌سوزد: کلیک می‌گیرید، بازدید می‌گیرید… اما مشتری واقعی نمی‌آید.")}
      ${p("در این یک ساعت زنده، قدم‌به‌قدم روی صفحه نشان می‌دهم دقیقاً پول‌تان کجا هدر می‌رود و چطور کمپینی بسازید که مشتری واقعی می‌آورد — همان کاری که بیزینس‌های موفق ایرانی در آمریکا و کانادا انجام می‌دهند.")}
      ${p("ویدیوی ۵ دقیقه‌ای پیش‌نیاز را قبل از جلسه ببینید تا با ذهنی آماده وارد شوید و <strong>۱۰ برابر بیشتر</strong> از جلسه بگیرید.")}
      <p style="text-align:center;margin:16px 0;">
        <a href="https://ladybosslook.com/l/igadsfree/thankyou" style="display:inline-block;background:#e11d48;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-size:15px;">
          دیدن ویدیوی ۵ دقیقه‌ای — قبل از جلسه
        </a>
      </p>

      <p style="margin:18px 0 10px;font-size:15px;line-height:1.9;">
        جلسه را همین حالا به تقویم‌تان اضافه کنید تا جای‌تان از دست نرود 👇
      </p>
      <p style="text-align:center;margin:16px 0;">
               <a href="${calendarClickUrl(round, email)}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-size:15px;">
                 افزودن به تقویم
               </a>
             </p>

      <div style="border:2px dashed #fda4af;background:#fff1f2;border-radius:14px;padding:12px 16px;margin:18px 0;">
               <p style="margin:0;font-size:14px;line-height:1.9;font-weight:bold;color:#be123c;">🔥 این آخرین جلسه رایگان این آموزش است — جلسه ضبط نمی‌شود و ظرفیت اتاق زنده محدود است.</p>
             </div>


      <div style="background:#ffffff;border:1px solid #fde68a;border-radius:14px;padding:12px;margin:20px 0;">
               <p style="margin:0 0 8px;font-size:14px;font-weight:bold;">⏰ ساعت جلسه در شهرهای مختلف</p>
               <table style="width:100%;border-collapse:collapse;">${zoneRows}</table>
             </div>

      <p style="margin:14px 0;font-size:14px;"><strong>🔗 لینک ورود:</strong><br>
               <a href="${escapeHtml(meetUrl)}" style="color:#e11d48;word-break:break-all;">${escapeHtml(meetUrl)}</a></p>

      <p style="margin:20px 0 0;font-size:16px;line-height:1.9;font-weight:bold;">
        🌷🌷 منتظرتون هستم
      </p>

      <p style="margin:18px 0 0;font-size:13px;color:#6b7280;line-height:1.9;">
        سوالی داشتی؟ <a href="${SUPPORT_URL}" style="color:#EA5B2B;">از اپ ریلو با ما چت کن 💬</a>
        <br>روی کامپیوتر هستی؟ <a href="https://ladybosslook.com/dashboard/chat" style="color:#EA5B2B;">چت پشتیبانی در داشبورد</a> — یا همین ایمیل را جواب بده.
        <br><br>علی لطفی
      </p>
    </div>`;

  const inner =
    kind === "reminder"
      ? reminderInner
      : kind === "morning"
      ? `
    <div dir="rtl" style="direction:rtl;text-align:right;max-width:560px;margin:0 auto;padding:24px 20px;">
      ${p("سلام دوست عزیز،")}
      ${p("ممکن است تا حالا چند بار در اینستاگرام تبلیغ (Ads) اجرا کرده باشید،<br>بودجه گذاشته باشید،<br>حتی کلیک و بازدید گرفته باشید…")}
      ${p("اما در نهایت مشتری واقعی و فروشی که انتظارش را داشتید، اتفاق نیفتاده.")}
      ${p("<strong>مشکل معمولاً بودجه کم نیست.</strong>")}
      ${p("بیشتر بیزینس‌های ایرانی در آمریکا و کانادا، بدون اینکه بدانند، بودجه‌شان را جایی هدر می‌دهند:")}
      <ul style="margin:0 0 14px;padding:0 20px 0 0;font-size:15px;line-height:2;">
        <li>چرا تبلیغ کلیک می‌گیرد اما مشتری نمی‌آورد؟</li>
        <li>کدام نوع کمپین برای بیزینس شما درست است؟</li>
        <li>چه بودجه‌ای برای شروع منطقی است؟</li>
        <li>و چطور بفهمید تبلیغ‌تان دارد جواب می‌دهد یا نه؟</li>
      </ul>
      ${p("<strong>امروز در وبینار رایگان:</strong>")}
      ${p("«جذب مشتری با تبلیغات اینستاگرام»")}
      ${p("قدم‌به‌قدم نشان می‌دهم چطور یک کمپین درست بسازید تا:")}
      <ul style="margin:0 0 14px;padding:0 20px 0 0;font-size:15px;line-height:2;">
        <li>مشتری واقعی جذب کنید، نه فقط لایک و بازدید</li>
        <li>از هدر رفتن بودجه جلوگیری کنید</li>
        <li>درآمد بیزینس‌تان را بالا ببرید</li>
      </ul>
      ${p("این وبینار درباره ترفندهای زودگذر نیست؛ درباره ساختن یک سیستم تبلیغاتی است که برای بیزینس شما مشتری می‌آورد.")}

      <div style="background:#ffffff;border:1px solid #fde68a;border-radius:14px;padding:12px;margin:20px 0;">
               <p style="margin:0 0 8px;font-size:14px;font-weight:bold;">⏰ زمان برگزاری: امروز</p>
               <table style="width:100%;border-collapse:collapse;">${zoneRows}</table>
             </div>

      ${p("برای ورود به وبینار روی لینک زیر بزنید:")}
      ${meetBlock}

      ${p("امروز منتظرتان هستم،<br><strong>علی لطفی</strong>")}
      ${supportFooter}
    </div>`
      : `
    <div dir="rtl" style="direction:rtl;text-align:right;max-width:560px;margin:0 auto;padding:24px 20px;text-align:center;">
      <h1 style="margin:0 0 14px;font-size:22px;line-height:1.6;">
        سلام دوست عزیز 🌷 وبینار در حال شروع است
      </h1>
      <p style="margin:0 0 18px;font-size:16px;line-height:1.9;">
        همین حالا وارد شوید 👇
      </p>
      ${
        meetUrl
          ? `<p style="margin:18px 0;">
               <a href="${escapeHtml(meetUrl)}" style="display:inline-block;background:#e11d48;color:#fff;text-decoration:none;padding:16px 32px;border-radius:12px;font-size:18px;font-weight:bold;">
                 ورود به وبینار
               </a>
             </p>
             <p style="margin:8px 0 0;font-size:13px;">
               <a href="${escapeHtml(meetUrl)}" style="color:#e11d48;word-break:break-all;">${escapeHtml(meetUrl)}</a>
             </p>`
          : ""
      }
      <p style="margin:22px 0 0;font-size:13px;color:#6b7280;line-height:1.9;">
        مشکلی داشتی؟ <a href="${SUPPORT_URL}" style="color:#EA5B2B;">از اپ ریلو با ما چت کن 💬</a>
        <br>روی کامپیوتر هستی؟ <a href="https://ladybosslook.com/dashboard/chat" style="color:#EA5B2B;">چت پشتیبانی در داشبورد</a> — یا همین ایمیل را جواب بده.
        <br><br>علی لطفی
      </p>
    </div>`;

  return `
<!doctype html>
<html dir="rtl" lang="fa">
  <body dir="rtl" style="direction:rtl;text-align:right;margin:0;padding:0;background:#fff7ed;font-family:Tahoma,Arial,sans-serif;color:#111827;">
    ${inner}
  </body>
</html>`;
}

interface Registrant { email: string; name: string; timezone: string | null; created_at: string | null }

async function collectRegistrants(roundId: string): Promise<Registrant[]> {
  const map = new Map<string, Registrant>();
  for (let page = 0; page < 10; page++) {
    const { data, error } = await supabase
      .from("form_submissions")
      .select("email, name, timezone, created_at")
      .eq("round_id", roundId)
      .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    for (const r of data || []) {
      const e = String(r.email || "").trim().toLowerCase();
      if (e && !map.has(e)) {
        map.set(e, { email: e, name: String(r.name || "دوست عزیز"), timezone: r.timezone || null, created_at: r.created_at || null });
      }
    }
    if (!data || data.length < 1000) break;
  }
  return [...map.values()];
}

/** Everyone who already received (sent or delivered) an email with this subject. */
async function collectAlreadySent(subject: string): Promise<Set<string>> {
  const set = new Set<string>();
  for (let page = 0; page < 40; page++) {
    const { data, error } = await supabase
      .from("email_delivery_events")
      .select("recipient")
      .eq("subject", subject)
      .in("event_type", ["sent", "delivered"])
      .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    for (const r of data || []) {
      const e = String(r.recipient || "").trim().toLowerCase();
      if (e) set.add(e);
    }
    if (!data || data.length < 1000) break;
  }
  return set;
}

async function sendBatch(payload: any[]): Promise<{ ids: (string | null)[] } | null> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      continue;
    }
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      console.error("batch send failed:", res.status, JSON.stringify(json));
      if (res.status >= 500) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      return null;
    }
    return { ids: (json?.data ?? []).map((d: any) => d?.id ?? null) };
  }
  return null;
}

async function processRound(round: any, kind: Kind, testEmail?: string) {
  const subject = SUBJECTS[kind];
  const sessionStart = new Date(round.first_session_date);
  const now = new Date();

  let registrants: Registrant[] = testEmail
    ? [{ email: testEmail.toLowerCase(), name: "دوست عزیز", timezone: null, created_at: null }]
    : await collectRegistrants(round.id);

  if (!testEmail) {
    const [unsub, alreadySent] = await Promise.all([
      fetchUnsubscribed(supabase, registrants.map((r) => r.email)),
      collectAlreadySent(subject),
    ]);
    registrants = registrants.filter((r) => !unsub.has(r.email) && !alreadySent.has(r.email));
  }

  if (kind === "morning" && !testEmail) {
    // Only recipients whose local time is 8:00–8:59 AM on the session day.
    registrants = registrants.filter((r) => {
      const tz = registrantTz(r.timezone, round.round_name || "");
      const nowLocal = tzParts(now, tz);
      const sessionLocal = tzParts(sessionStart, tz);
      return nowLocal.hour === 8 && nowLocal.date === sessionLocal.date;
    });
  }

  if (kind === "reminder" && !testEmail) {
    // Only signups from 2–3 hours ago, and only when the session is still
    // more than 6 hours away (closer signups rely on morning/start emails).
    if (sessionStart.getTime() - now.getTime() < 6 * 3600_000) {
      return { round: round.round_name, kind, recipients: 0, sent: 0, failed: 0 };
    }
    registrants = registrants.filter((r) => {
      if (!r.created_at) return false;
      const age = now.getTime() - new Date(r.created_at).getTime();
      return age >= 2 * 3600_000 && age < 3 * 3600_000;
    });
  }

  let sent = 0;
  let failed = 0;
  const batchSize = 100;
  for (let i = 0; i < registrants.length; i += batchSize) {
    const batch = registrants.slice(i, i + batchSize);
    const payload = await Promise.all(
      batch.map(async (r) => {
        const tz = registrantTz(r.timezone, round.round_name || "");
        const unsubscribeUrl = await buildUnsubUrl(r.email);
        return {
          from: FROM,
          to: [r.email],
          subject,
          html: appendUnsubFooter(buildHtml(kind, r.name, round, tz, r.email), unsubscribeUrl),
          reply_to: "support@ladybosslook.com",
          tags: [
            { name: "campaign", value: "webinar_day" },
            { name: "kind", value: kind },
            { name: "round", value: String(round.round_number ?? round.id) },
          ],
          headers: unsubHeaders(unsubscribeUrl),
        };
      }),
    );
    const result = await sendBatch(payload);
    if (!result) {
      failed += batch.length;
    } else {
      sent += batch.length;
      const logs = batch.map((r, idx) => ({
        recipient_email: r.email,
        status: "success",
        resend_id: result.ids[idx] ?? null,
      }));
      const { error: logErr } = await supabase.from("email_logs").insert(logs);
      if (logErr) console.error("log insert failed:", logErr.message);
    }
    if (i + batchSize < registrants.length) await new Promise((r) => setTimeout(r, 600));
  }

  console.log(`${kind} email for round ${round.round_name}: sent=${sent} failed=${failed} of ${registrants.length}`);
  return { round: round.round_name, kind, recipients: registrants.length, sent, failed };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!(await isInternalOrAdmin(req))) return deny(corsHeaders);
    if (!RESEND_API_KEY) throw new Error("Email service not configured");

    const body = await req.json().catch(() => ({}));
    const now = Date.now();
    const roundCols = "id, round_name, round_number, first_session_date, google_meet_link";

    let rounds: { round: any; kind: Kind }[] = [];

    if (body.round_id && body.kind) {
      const { data, error } = await supabase
        .from("program_rounds")
        .select(roundCols)
        .eq("id", body.round_id)
        .single();
      if (error || !data) throw new Error("Round not found");
      rounds = [{ round: data, kind: body.kind as Kind }];
    } else {
      // Morning: sessions in the next 36h (per-recipient local-8AM filter applies).
      const { data: morningRounds, error: e1 } = await supabase
        .from("program_rounds")
        .select(roundCols)
        .eq("program_slug", "igadsfree")
        .gte("first_session_date", new Date(now - 6 * 3600_000).toISOString())
        .lte("first_session_date", new Date(now + 36 * 3600_000).toISOString());
      if (e1) throw e1;
      for (const r of morningRounds || []) rounds.push({ round: r, kind: "morning" });

      // Start: sessions beginning within the next 45 min (or just started).
      const { data: startRounds, error: e2 } = await supabase
        .from("program_rounds")
        .select(roundCols)
        .eq("program_slug", "igadsfree")
        .gte("first_session_date", new Date(now - 15 * 60_000).toISOString())
        .lte("first_session_date", new Date(now + 45 * 60_000).toISOString());
      if (e2) throw e2;
      for (const r of startRounds || []) rounds.push({ round: r, kind: "start" });

      // Reminder: any future session (per-signup 2–3h window filter applies).
      const { data: reminderRounds, error: e3 } = await supabase
        .from("program_rounds")
        .select(roundCols)
        .eq("program_slug", "igadsfree")
        .gte("first_session_date", new Date(now + 6 * 3600_000).toISOString())
        .lte("first_session_date", new Date(now + 14 * 24 * 3600_000).toISOString());
      if (e3) throw e3;
      for (const r of reminderRounds || []) rounds.push({ round: r, kind: "reminder" });
    }

    const results = [];
    for (const { round, kind } of rounds) {
      results.push(await processRound(round, kind, body.testEmail));
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("send-webinar-day-emails error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
