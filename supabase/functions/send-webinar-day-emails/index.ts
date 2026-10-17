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

type Kind = "morning" | "start" | "reminder" | "onehour";

// Subjects keep the prefixes that src/lib/igAdsRoundStats.ts uses to classify
// automated emails for open-rate stats. Copy matches the proven manual
// campaigns sent on 2026-10-17.
const SUBJECTS: Record<Kind, string> = {
  morning: "امروز: جذب مشتری واقعی — ۳ دروغ بزرگ اینستاگرام در آمریکا و کانادا 🌷",
  onehour: "۱ ساعت تا شروع: وبینار جذب مشتری با اینستاگرام ادز (بدون نیاز به دوربین) ⏳",
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
function calendarClickUrl(round: any, email: string, tyUrl: string): string {
  const start = new Date(round.first_session_date);
  const end = new Date(start.getTime() + 90 * 60_000);
  const meet: string = round.google_meet_link || "";
  const details =
    `ویدیوی پیش‌نیاز: ${tyUrl}\n` +
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
function buildHtml(kind: Kind, name: string, round: any, tz: string, email: string, tyUrl: string): string {
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
        سلام دوست عزیز، جای‌تان در وبینار اینستاگرام ادز رزرو شد 🌷
      </h1>

      ${p("<strong>دکمهٔ «Boost Post» سریع‌ترین راه سوزاندن بودجهٔ تبلیغات است.</strong> اینستاگرام آن را جلوی چشم‌تان گذاشته چون ساده است، نه چون برای بیزینس شما مشتری می‌آورد. نتیجه؟ لایک و بازدید از آدم‌هایی که هیچ‌وقت مشتری شما نمی‌شوند.")}
      ${p("حالا یک حساب ساده: اگر هر مشتری جدید برای بیزینس شما چند صد دلار ارزش دارد، فقط چند مشتری محلی بیشتر در ماه می‌تواند تفاوت بزرگی در درآمدتان بسازد. سوال این است که آن مشتری‌ها را چطور پیدا کنیم — نه با شانس، با یک سیستم.")}
      ${p(`${faWeekday(start, tz)} در جلسهٔ زنده، روی صفحه و داخل ادز منیجر نشان می‌دهم دقیقاً پول کجا هدر می‌رود و یک کمپین درست برای بیزینس محلی در آمریکا و کانادا چطور ساخته می‌شود. چند پیج را هم زنده بررسی می‌کنیم.`)}

      <div style="background:#ffffff;border:1px solid #fde68a;border-radius:14px;padding:12px 16px;margin:18px 0;">
        <p style="margin:0 0 8px;font-size:15px;font-weight:bold;">🎬 مقدمهٔ جلسه را از الان ببینید (۵ دقیقه)</p>
        ${p("در این ویدیوی کوتاه می‌گویم در جلسه دقیقاً چه چیزهایی می‌بینید و این جلسه برای چه کسی مناسب است. با دیدنش، مقدمه‌چینی را جلوتر تمام کرده‌اید و با یک سوال مشخص دربارهٔ بیزینس خودتان وارد جلسه می‌شوید.")}
        <p style="text-align:center;margin:12px 0 4px;">
          <a href="${escapeHtml(tyUrl)}" style="display:inline-block;background:#e11d48;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-size:15px;">
            دیدن ویدیوی ۵ دقیقه‌ای
          </a>
        </p>
      </div>

      <p style="margin:18px 0 10px;font-size:15px;line-height:1.9;">
        جلسه را همین حالا به تقویم‌تان اضافه کنید تا جای‌تان از دست نرود 👇
      </p>
      <p style="text-align:center;margin:16px 0;">
        <a href="${calendarClickUrl(round, email, tyUrl)}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-size:15px;">
          افزودن به تقویم
        </a>
      </p>

      <div style="border:2px dashed #fda4af;background:#fff1f2;border-radius:14px;padding:12px 16px;margin:18px 0;">
        <p style="margin:0;font-size:14px;line-height:1.9;font-weight:bold;color:#be123c;">🔥 جلسه ضبط نمی‌شود و ظرفیت اتاق زنده محدود است.</p>
      </div>

      <div style="background:#ffffff;border:1px solid #fde68a;border-radius:14px;padding:12px;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:14px;font-weight:bold;">⏰ ساعت جلسه در شهرهای مختلف</p>
        <table style="width:100%;border-collapse:collapse;">${zoneRows}</table>
      </div>

      <p style="margin:14px 0;font-size:14px;"><strong>🔗 لینک ورود:</strong><br>
        <a href="${escapeHtml(meetUrl)}" style="color:#e11d48;word-break:break-all;">${escapeHtml(meetUrl)}</a></p>

      <p style="margin:20px 0 0;font-size:16px;line-height:1.9;font-weight:bold;">🌷🌷 منتظرتون هستم</p>

      <p style="margin:18px 0 0;font-size:13px;color:#6b7280;line-height:1.9;">
        سوالی داشتی؟ <a href="${SUPPORT_URL}" style="color:#EA5B2B;">از اپ ریلو با ما چت کن 💬</a>
        <br>روی کامپیوتر هستی؟ <a href="https://ladybosslook.com/dashboard/chat" style="color:#EA5B2B;">چت پشتیبانی در داشبورد</a> — یا همین ایمیل را جواب بده.
        <br><br><strong>علی لطفی</strong><br><span dir="ltr">Rilo App - Ladybosslook llc</span>
      </p>
    </div>`;

  const signoff = `<br><br><strong>علی لطفی</strong><br><span dir="ltr">Rilo App - Ladybosslook llc</span>`;

  const morningInner = `
    <div dir="rtl" style="direction:rtl;text-align:right;max-width:560px;margin:0 auto;padding:24px 20px;">
      ${p("سلام دوست عزیز 🌅")}
      ${p("امروز همان روزی است که قرار است نگاهمان به اینستاگرام و جذب مشتری را از پایه بازبینی کنیم.")}
      ${p("اگر از بیشتر صاحبان بیزینس بپرسید: «هفتهٔ بعد دقیقاً چند مشتری جدید داری؟»، صادقانه می‌گویند: «بستگی دارد کی معرفی کند یا کی تصادفی پیدایمان کند.»")}
      ${p("اما تکیه کردن فقط به دهان‌به‌دهان، بیزینس ساختن نیست؛ <strong>شانس‌آزمایی است.</strong> یک کسب‌وکار پایدار در آمریکا یا کانادا باید بتواند اندازه بگیرد که هر دلار تبلیغ چند پیام و تماس برایش می‌آورد.")}

      <p style="margin:20px 0 10px;font-size:16px;font-weight:bold;">🚫 ۳ دروغ بزرگی که درباره اینستاگرام به ما گفته‌اند:</p>
      ${p("<strong>۱. «باید هر روز پست و ریلز بذاری تا دیده بشی!»</strong><br>حقیقت: شما صاحب بیزینس هستید، نه اینفلوئنسر تمام‌وقت. یک سیستم تبلیغاتی درست، بدون تولید محتوای شبانه‌روزی، شما را به مشتری‌های درست نشان می‌دهد.")}
      ${p("<strong>۲. «اول باید چند هزار فالوور داشته باشی تا بتونی بفروشی!»</strong><br>حقیقت: فالووری که در شهر شما زندگی نمی‌کند، از سالن، کلینیک یا خدمات شما خرید نمی‌کند. چیزی که لازم دارید مشتری‌های محلی است، نه عدد فالوور.")}
      ${p("<strong>۳. «تبلیغات متا خیلی گرونه و فقط به درد برندهای بزرگ می‌خوره!»</strong><br>حقیقت: اگر ندانید چطور تنظیمش کنید، بله، بودجه‌تان می‌سوزد. اما با بودجهٔ کوچک روزانه هم می‌شود در محدودهٔ خودتان تست را شروع کرد.")}

      <div style="background:#ffffff;border:1px solid #fde68a;border-radius:14px;padding:12px 16px;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:15px;font-weight:bold;">🔍 یک تمرین ۲ دقیقه‌ای برای امروز:</p>
        ${p("اینستاگرام بیزینس‌تان را باز کنید و به این ۳ عدد نگاه کنید:")}
        <ul style="margin:0 0 10px;padding:0 20px 0 0;font-size:15px;line-height:2;">
          <li>آخرین پست شما چند درصد مخاطبش از شهر خودتان بوده؟</li>
          <li>در ۳۰ روز گذشته، چند نفر مستقیماً از اینستاگرام با شما تماس گرفتند یا وقت رزرو کردند؟</li>
          <li>هزینهٔ جذب هر مشتری جدید تا الان برای شما چقدر تمام شده؟</li>
        </ul>
        ${p("اگر این اعداد را نمی‌دانید یا از آنها راضی نیستید، امروز در جلسهٔ زنده دقیقاً همین‌ها را روی میز می‌گذاریم.")}
      </div>

      <div style="background:#ffffff;border:1px solid #fde68a;border-radius:14px;padding:12px;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:14px;font-weight:bold;">⏰ زمان برگزاری: امروز</p>
        <table style="width:100%;border-collapse:collapse;">${zoneRows}</table>
      </div>

      ${meetBlock}

      <p style="margin:16px 0 8px;font-size:15px;font-weight:bold;">📌 چند نکته مهم:</p>
      <ul style="margin:0 0 14px;padding:0 20px 0 0;font-size:15px;line-height:2;">
        <li>دوربین و میکروفون شما خاموش است؛ با خیال راحت و در هر شرایطی شرکت کنید.</li>
        <li>جلسه ضبط نمی‌شود و ظرفیت اتاق محدود است؛ ۵ تا ۱۰ دقیقه زودتر وارد شوید.</li>
        <li>چک‌لیست کاربردی تبلیغات در طول همین جلسه به حاضرین زنده داده می‌شود.</li>
      </ul>
      ${p("این جلسه را به عنوان یک تصمیم کاری برای آیندهٔ بیزینس‌تان در تقویم خالی بگذارید. امروز می‌بینمتان.")}
      <p style="margin:18px 0 0;font-size:13px;color:#6b7280;line-height:1.9;">
        سوالی داشتی؟ <a href="${SUPPORT_URL}" style="color:#EA5B2B;">از اپ ریلو با ما چت کن 💬</a>
        <br>روی کامپیوتر هستی؟ <a href="https://ladybosslook.com/dashboard/chat" style="color:#EA5B2B;">چت پشتیبانی در داشبورد</a> — یا همین ایمیل را جواب بده.
        ${signoff}
      </p>
    </div>`;

  const oneHourInner = `
    <div dir="rtl" style="direction:rtl;text-align:right;max-width:560px;margin:0 auto;padding:24px 20px;">
      ${p("سلام دوست عزیز ⏳")}
      ${p("دقیقاً <strong>۱ ساعت دیگر</strong> وبینار زندهٔ «جذب مشتری واقعی با اینستاگرام ادز» شروع می‌شود.")}
      ${p("اگر درگیر کار، رفت‌وآمد یا کارهای خانه هستید، فقط این ۳ مورد را بدانید:")}
      ${p("<strong>۱. دوربین و میکروفون شما خاموش است.</strong><br>نیازی به آماده شدن نیست. با لپ‌تاپ یا حتی گوشی و یک هندزفری وارد شوید و راحت گوش کنید.")}
      ${p("<strong>۲. بازپخش یا رکورد ارسال نمی‌شود.</strong><br>جلسه کاملاً زنده است و همه‌چیز روی صفحه و داخل ادز منیجر نشان داده می‌شود؛ تنها فرصت دیدنش همین جلسهٔ زنده است.")}
      ${p("<strong>۳. هدیهٔ حاضرین زنده.</strong><br>«چک‌لیست قدم‌به‌قدم ستاپ ادز منیجر» در طول همین جلسه به شرکت‌کنندگان حاضر داده می‌شود.")}

      <div style="background:#ffffff;border:1px solid #fde68a;border-radius:14px;padding:12px;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:14px;font-weight:bold;">⏰ ساعت شروع در شهرهای مختلف</p>
        <table style="width:100%;border-collapse:collapse;">${zoneRows}</table>
      </div>

      ${meetBlock}
      ${p("پیشنهاد می‌کنم ۵ تا ۱۰ دقیقه زودتر روی لینک بزنید تا ظرفیت اتاق پر نشود.")}
      ${p("یک فنجان چای یا قهوه بریزید و دفترچه‌تان را بردارید؛ ۱ ساعت دیگر می‌بینمتان!")}
      <p style="margin:18px 0 0;font-size:13px;color:#6b7280;line-height:1.9;">
        سوالی داشتی؟ <a href="${SUPPORT_URL}" style="color:#EA5B2B;">از اپ ریلو با ما چت کن 💬</a>
        ${signoff}
      </p>
    </div>`;

  const inner =
    kind === "reminder"
      ? reminderInner
      : kind === "morning"
      ? morningInner
      : kind === "onehour"
      ? oneHourInner
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
        ${signoff}
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

interface Registrant { email: string; name: string; timezone: string | null; created_at: string | null; source?: string | null }

/** Each signup's own landing-page thank-you page, pinned to this round and person. */
function thankYouUrl(round: any, email: string, source?: string | null): string {
  const base = String(source || "").startsWith("aliagads")
    ? "https://ladybosslook.com/l/aliagads/thankyou"
    : "https://ladybosslook.com/l/igadsfree/thankyou";
  return `${base}?round=${encodeURIComponent(round.id)}&email=${encodeURIComponent(email)}`;
}

async function collectRegistrants(roundId: string): Promise<Registrant[]> {
  const map = new Map<string, Registrant>();
  for (let page = 0; page < 10; page++) {
    const { data, error } = await supabase
      .from("form_submissions")
      .select("email, name, timezone, created_at, source")
      .eq("round_id", roundId)
      .order("created_at", { ascending: true })
      .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    for (const r of data || []) {
      const e = String(r.email || "").trim().toLowerCase();
      if (e && !map.has(e)) {
        map.set(e, { email: e, name: String(r.name || "دوست عزیز"), timezone: r.timezone || null, created_at: r.created_at || null, source: r.source || null });
      }
    }
    if (!data || data.length < 1000) break;
  }
  // Extra emails added from a thank-you page belong to the round's own landing
  // page: use whichever registration page this (locked) round mostly came from.
  const list = [...map.values()];
  const ali = list.filter((r) => String(r.source || "").startsWith("aliagads")).length;
  const main = list.filter((r) => r.source === "igads_registration").length;
  const roundDefault = ali > main ? "aliagads_registration" : "igads_registration";
  for (const r of list) {
    if (r.source !== "igads_registration" && !String(r.source || "").startsWith("aliagads")) r.source = roundDefault;
  }
  return list;
}

/** Everyone who already received (sent or delivered) this kind of email for this round.
 * Scoped per round (people who re-register for a later round still get it) and by
 * kind rather than subject (editing a subject never causes repeat sends). */
async function collectAlreadySent(kind: Kind, roundKey: string): Promise<Set<string>> {
  const set = new Set<string>();
  for (let page = 0; page < 40; page++) {
    const { data, error } = await supabase
      .from("email_delivery_events")
      .select("recipient")
      .eq("tags->>campaign", "webinar_day")
      .eq("tags->>kind", kind)
      .eq("tags->>round", roundKey)
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
      collectAlreadySent(kind, String(round.round_number ?? round.id)),
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
          html: appendUnsubFooter(buildHtml(kind, r.name, round, tz, r.email, thankYouUrl(round, r.email, r.source)), unsubscribeUrl),
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

      // One hour before: sessions starting 45–105 min from now (hourly cron).
      const { data: hourRounds, error: e4 } = await supabase
        .from("program_rounds")
        .select(roundCols)
        .eq("program_slug", "igadsfree")
        .gte("first_session_date", new Date(now + 45 * 60_000).toISOString())
        .lte("first_session_date", new Date(now + 105 * 60_000).toISOString());
      if (e4) throw e4;
      for (const r of hourRounds || []) rounds.push({ round: r, kind: "onehour" });

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
