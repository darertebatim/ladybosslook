// Sends the 2-email post-live sequence to verified live attendees (show-ups)
// of the IG Ads and IG Free webinars: Email 1 at +3h (direct Acquisition offer), Email 2 at
// +24h (last chance). Runs hourly via pg_cron; also supports manual sends:
//   { "round_id": "...", "kind": "3h" | "24h", "testEmail": "you@x.com" }
import { isInternalOrAdmin, deny } from "../_shared/caller-auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { registeredGiftEmails, webinarRoundKey, webinarRoundKeys } from "../_shared/webinar-campaign.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-timezone",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PROGRAM_URL = "https://ladybosslook.com/casigads";
const SUPPORT_URL =
  "https://ladyboss.onelink.me/lt6v?af_xp=custom&pid=email_support&c=live_followup&deep_link_value=support&af_web_dp=https%3A%2F%2Fladybosslook.com%2Fdashboard%2Fchat";
const FROM = "Ali Lotfi <support@ladybosslook.com>";
const STARTADS_URL = "https://ladybosslook.com/l/startads";

// IG Free Webinar: sent to ALL registrants (not only live attendees), inviting them to
// the free first session of the Acquisition program. Email 1 = morning after (9 AM LA),
// Email 2 = 24h after email 1.
const IGFREE_KINDS = {
  "3h": {
    subject: "فرصت ویژه برای شرکت‌کنندگان وبینار افزایش مشتری ۲۰۲۷ 🎯",
    preheader: "نقشه راه یک تبلیغ برنده برای بیزینس تو (جلسه اول دوره ۴ هفته‌ای)...",
  },
  "24h": {
    subject: "نقشه O.M.C جذب مشتری (آخرین فرصت ۵۰ صندلی رایگان) ⏳",
    preheader: "چطور ۲۰۰+ بیزینس در آمریکا و کانادا تبلیغ سودده ساختن...",
  },
} as const;

/** 9 AM America/Los_Angeles on the calendar day after the session (as UTC Date). */
export function morningAfter(sessionStart: Date): Date {
  const la = new Date(sessionStart.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const offsetMs = sessionStart.getTime() - la.getTime();
  const target = new Date(la);
  target.setDate(target.getDate() + 1);
  target.setHours(9, 0, 0, 0);
  return new Date(target.getTime() + offsetMs);
}

const KINDS = {
  "3h": {
    subject: "علی اینجاست — پیشنهاد ویژه برای تو که لایو بودی 🎯",
    preheader: "پیشنهاد ویژه دوره جذب مشتری با اینستاگرام ادز، فقط برای شرکت‌کنندگان لایو",
  },
  "24h": {
    subject: "⏳ آخرین فرصت: پیشنهاد وبینار تا چند ساعت دیگر بسته می‌شود",
    preheader: "پیشنهاد ویژه وبینار دیشب تا چند ساعت دیگر تمام می‌شود",
  },
} as const;

type Kind = keyof typeof KINDS;

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

function igFreeBody(kind: Kind, p: (t: string) => string): string[] {
  if (kind === "3h") {
    return [
      p("سلام عزیز 👋"),
      p("تو برای وبینار افزایش مشتری ۲۰۲۷ ثبت‌نام کردی، چون می‌خوای برای بیزینست یک جریان مداوم و قابل‌پیش‌بینی از مشتری‌های جدید در اینستاگرام بسازی."),
      p("همون‌طور که توی وبینار آموزش دادم، قوی‌ترین و قابل‌کنترل‌ترین روش جذب مشتری در سال ۲۰۲۷، به کمک تبلیغات با متا ادز (Meta Ads) روی اینستاگرامه — نه جنگیدن با الگوریتم و منتظر لایک و ویوی شانسی موندن."),
      p("سیستم ما برای اینکه یک تبلیغ به فروش و مشتری واقعی تبدیل بشه، روی روش ۳ مرحله‌ای <b>O.M.C</b> سوار شده:"),
      p("۱. <b>پلن آفر و پیشنهاد (Offer):</b> دقیقاً کدوم محصول یا خدمتت، برای کدوم دسته از مشتری‌ها و با چه آفر متمایزی باید تبلیغ بشه.<br>۲. <b>پیام متقاعدکننده (Message):</b> نوشتن پیام و سناریویی که وقتی یک غریبه در شهر و منطقه‌ت تبلیغ رو دید، متوقف بشه و بگه: «همین الان اینو می‌خوام».<br>۳. <b>راه‌اندازی کمپین در متا ادز (Campaign):</b> تنظیمات اصولی ادز منیجر و شروع تست با بودجه کم تا تبلیغت مثل یک شیر آب مطمئن کار کنه."),
      p("تا امروز <b>بیشتر از ۲۰۰ کسب‌وکار در سراسر آمریکا و کانادا</b> توی این دوره ۴ هفته‌ای شرکت کردن و یاد گرفتن چطور بدون وابستگی به آژانس‌ها، خودشون مستقیماً با تبلیغات اینستاگرام مشتری بگیرن."),
      p("ارزش ثبت‌نام در این دوره ۴ هفته‌ای ۴۹۷ دلاره (با ارزش واقعی بالای ۹۹۷ دلار). اما می‌دونم برای خیلی از صاحبان بیزینس مهمه که قبل از هر پرداختی، سیستم رو از نزدیک لمس کنن. به همین خاطر:"),
      p("👈 <b>جلسه اول این دوره ۴ هفته‌ای رو برای فقط ۵۰ نفر کاملاً رایگان باز کردم.</b>"),
      p("توی این جلسه اول:<br>• نقشه راه یک تبلیغ برنده رو برای بیزینس خودت قدم‌به‌قدم باز می‌کنم — چطوری تبلیغی بسازی که برات مشتری بیاره.<br>• روش خودم رو قدم‌به‌قدم نشونت می‌دم.<br>• بدون هیچ ریسک و هزینه‌ای، ساختار اصلی کار رو می‌بینی و یاد می‌گیری."),
      p("ظرفیت این جلسه به <b>فقط ۵۰ نفر</b> محدوده، جلسه ضبط نمیشه و به محض تکمیل ظرفیت بسته خواهد شد."),
    ];
  }
  return [
    p("سلام عزیز 👋"),
    p("یکی از بزرگ‌ترین دلایلی که بیزینس‌های خوب در مهاجرت رشد نمی‌کنن، اینه که وقت و هزینه‌شون رو صرف کارهای اشتباه می‌کنن: روزی چند ساعت ریلز ساختن، تخفیف دادن به امید معرفی دهان‌به‌دهان، یا بوست کردن تصادفی پست‌ها."),
    p("واقعیت اینه که جذب مشتری در سال ۲۰۲۷ فرمول پیچیده‌ای نداره، اما اصول داره — روش <b>O.M.C</b>:"),
    p("۱. <b>Offer — آفر مشخص</b> (مشتری دقیقاً چی گیرش میاد؟)<br>۲. <b>Message — پیام برنده</b> (چرا باید همین الان از تو بخره نه رقیبت؟)<br>۳. <b>Campaign — کمپین در متا ادز</b> (رسیدن به آدم‌هایی که توان خرید دارن و در شهر تو هستن)"),
    p("همین روش بود که به <b>بیش از ۲۰۰ بیزینس در سراسر آمریکا و کانادا</b> کمک کرد تا از بلاتکلیفی خارج بشن و کمپین‌های تبلیغاتی خودشون رو سودده کنن."),
    p("در ایمیل قبلی برات نوشتم که <b>جلسه اول این دوره ۴ هفته‌ای (به ارزش ۴۹۷ دلار) رو برای ۵۰ نفر کاملاً رایگان باز کردم.</b>"),
    p("بیشتر این ۵۰ جایگاه تا الان رزرو شده. اگر می‌خوای در این جلسه کنار من باشی و نقشه راه تبلیغ بیزینست رو با هم مرور کنیم، همین الان قبل از بسته شدن لینک، ثبت‌نامت رو قطعی کن:"),
  ];
}

function buildHtml(kind: Kind, unsubscribeUrl: string, topic: string, igFree = false): string {
  const btn = (label: string, url: string) =>
    `<tr><td align="center" style="padding:6px 0;"><a href="${esc(url)}" style="display:inline-block;background:#EA5B2B;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 28px;border-radius:12px;">${esc(label)}</a></td></tr>`;
  const p = (text: string) =>
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.9;color:#333;text-align:right;">${text}</p>`;

  const body = igFree
    ? igFreeBody(kind, p)
    : kind === "3h"
      ? [
          p("سلام! علی هستم 👋"),
          p(`اول ازت تشکر می‌کنم که امروز لایو وبینار «${topic}» بودی. انرژی جلسه فوق‌العاده بود و خوشحالم که تا آخر همراهم بودی.`),
          p("همون‌طور که توی جلسه گفتم، یک پیشنهاد ویژه فقط برای شرکت‌کنندگان لایو آماده کردم: <b>دوره جذب مشتری با اینستاگرام ادز</b> — جایی که قدم‌به‌قدم کنار هم کمپین‌هات رو می‌سازیم و راه می‌ندازیم."),
          p("این پیشنهاد فقط برای کسانیه که لایو بودن و <b>تا ۲۴ ساعت آینده</b> بازه. بعد از اون، ثبت‌نام با قیمت عادی و بدون بونوس‌های ویژه وبینار خواهد بود."),
          p("اگر سؤالی داری، همین ایمیل رو جواب بده یا توی چت اپ ریلو بهم پیام بده — خودم جواب می‌دم."),
        ]
      : [
          p("سلام دوباره! علی هستم 👋"),
          p(`دیروز توی وبینار «${topic}» بودی و دیدی که چطور می‌شه با تبلیغات اینستاگرام مشتری جذب کرد.`),
          p("فقط خواستم یادآوری کنم که <b>پیشنهاد ویژه شرکت‌کنندگان لایو تا چند ساعت دیگر بسته می‌شود.</b> بعد از اون دیگه قیمت ویژه و بونوس‌های وبینار در دسترس نخواهد بود."),
          p("اگر دیروز گفتی «بعداً تصمیم می‌گیرم» — اون «بعداً» همین الان‌ه 🙂"),
          p("سؤالی داری؟ همین ایمیل رو جواب بده یا توی چت اپ ریلو پیام بده."),
        ];

  return `<!DOCTYPE html>
<html dir="rtl">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body dir="rtl" style="direction:rtl;text-align:right;margin:0;padding:0;background:#f6f6f7;font-family:Tahoma, 'Iranian Sans', Arial, sans-serif;">
    <span style="display:none;font-size:0;line-height:0;opacity:0;">${esc((igFree ? IGFREE_KINDS : KINDS)[kind].preheader)}</span>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f7;padding:24px 12px;">
      <tr><td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
          <tr><td style="padding:28px 28px 8px;" dir="rtl">
            <h1 style="margin:0 0 18px;font-size:22px;line-height:1.5;color:#111;text-align:right;">${esc((igFree ? IGFREE_KINDS : KINDS)[kind].subject)}</h1>
            ${body.join("\n            ")}
          </td></tr>
          <tr><td style="padding:8px 28px 24px;"><table width="100%" cellpadding="0" cellspacing="0">
            ${igFree
              ? btn(kind === "3h" ? "رزرو رایگان صندلی در جلسه اول دوره 🎟️" : "رزرو صندلی رایگان در جلسه اول ⏳", STARTADS_URL)
              : btn(kind === "3h" ? "ثبت‌نام در دوره جذب مشتری 🚀" : "ثبت‌نام قبل از بسته شدن پیشنهاد ⏳", PROGRAM_URL)}
            ${btn("گفتگو با علی در اپ ریلو 💬", SUPPORT_URL)}
          </table></td></tr>
          <tr><td style="padding:4px 28px 24px;" dir="rtl">
            <div style="font-size:15px;line-height:1.8;color:#444;text-align:right;">
              با احترام،<br>علی لطفی<br>Rilo App (Ladybosslook LLC.)
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

/** Gift-page submitters in the live window who registered for this exact round. */
async function collectLiveAttendees(roundId: string, sessionStart: Date): Promise<string[]> {
  const windowEnd = new Date(sessionStart.getTime() + 2 * 60 * 60 * 1000);
  const gifts = new Set<string>();
  for (let page = 0; page < 10; page++) {
    const { data, error } = await supabase
      .from("form_submissions")
      .select("email, submitted_at")
      .eq("source", "igads_gifts")
      .gte("submitted_at", sessionStart.toISOString())
      .lte("submitted_at", windowEnd.toISOString())
      .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    for (const r of data || []) {
      const e = String(r.email || "").trim().toLowerCase();
      if (e) gifts.add(e);
    }
    if (!data || data.length < 1000) break;
  }

  const registrations: string[] = [];
  for (let page = 0; page < 10; page++) {
    const { data, error } = await supabase
      .from("form_submissions")
      .select("email")
      .eq("round_id", roundId)
      .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    for (const r of data || []) {
      const e = String(r.email || "").trim().toLowerCase();
      if (e) registrations.push(e);
    }
    if (!data || data.length < 1000) break;
  }
  return registeredGiftEmails(gifts, registrations);
}

async function collectUnsubscribed(): Promise<Set<string>> {
  const set = new Set<string>();
  for (let page = 0; page < 30; page++) {
    const { data, error } = await supabase
      .from("email_unsubscribes")
      .select("email")
      .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    for (const r of data || []) set.add(String(r.email || "").trim().toLowerCase());
    if (!data || data.length < 1000) break;
  }
  return set;
}

/** Everyone who already received this follow-up kind for this exact round. */
async function collectAlreadySent(kind: Kind, roundKeys: string[]): Promise<Set<string>> {
  const set = new Set<string>();
  for (let page = 0; page < 40; page++) {
    const { data, error } = await supabase
      .from("email_delivery_events")
      .select("recipient")
      .eq("tags->>campaign", "live_followup")
      .eq("tags->>kind", kind)
      .in("tags->>round", roundKeys)
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

/** Every registrant of this round (IG Free: everyone who signed up, not only attendees). */
async function collectRoundRegistrants(roundId: string): Promise<string[]> {
  const set = new Set<string>();
  for (let page = 0; page < 20; page++) {
    const { data, error } = await supabase
      .from("form_submissions")
      .select("email")
      .eq("round_id", roundId)
      .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    for (const r of data || []) {
      const e = String(r.email || "").trim().toLowerCase();
      if (e) set.add(e);
    }
    if (!data || data.length < 1000) break;
  }
  return [...set];
}

/** People who already claimed a free Start Ads seat — they get the Start Ads emails instead. */
async function collectStartAdsSignups(): Promise<Set<string>> {
  const set = new Set<string>();
  for (let page = 0; page < 20; page++) {
    const { data, error } = await supabase
      .from("form_submissions")
      .select("email")
      .eq("source", "startads_registration")
      .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    for (const r of data || []) {
      const e = String(r.email || "").trim().toLowerCase();
      if (e) set.add(e);
    }
    if (!data || data.length < 1000) break;
  }
  return set;
}

/** Emails that already bought the Acquisition program — no point pitching them. */
async function collectBuyers(): Promise<Set<string>> {
  const set = new Set<string>();
  for (let page = 0; page < 20; page++) {
    const { data, error } = await supabase
      .from("orders")
      .select("email")
      .eq("program_slug", "casigads")
      .in("status", ["completed", "paid", "partially_refunded"])
      .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    for (const r of data || []) {
      const e = String(r.email || "").trim().toLowerCase();
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
  const sessionStart = new Date(round.first_session_date);
  const markerKey = `live_followup_${round.id}_${kind}`;
  const roundKey = webinarRoundKey(round);
  const topic = round.program_slug === "igfreewebinar"
    ? "وبینار رایگان افزایش مشتری ۲۰۲۷"
    : "جذب مشتری با اینستاگرام ادز";

  if (!testEmail) {
    const { data: marker } = await supabase
      .from("app_settings")
      .select("id")
      .eq("key", markerKey)
      .maybeSingle();
    if (marker) {
      console.log(`Already sent ${kind} for round ${round.round_name}`);
      return { round: round.round_name, kind, skipped: true };
    }
    // Mark first to prevent duplicate sends from overlapping cron runs.
    await supabase.from("app_settings").insert({
      key: markerKey,
      value: new Date().toISOString(),
      description: `Live follow-up ${kind} sent for round ${round.round_name}`,
    });
  }

  const igFree = round.program_slug === "igfreewebinar";
  const subject = (igFree ? IGFREE_KINDS : KINDS)[kind].subject;
  let recipients = testEmail
    ? [testEmail.toLowerCase()]
    : igFree
      ? await collectRoundRegistrants(round.id)
      : await collectLiveAttendees(round.id, sessionStart);

  if (!testEmail) {
    const [unsub, alreadySent, buyers, startAds] = await Promise.all([
      collectUnsubscribed(),
      collectAlreadySent(kind, webinarRoundKeys(round)),
      collectBuyers(),
      igFree ? collectStartAdsSignups() : Promise.resolve(new Set<string>()),
    ]);
    recipients = recipients.filter(
      (e) => !unsub.has(e) && !alreadySent.has(e) && !buyers.has(e) && !startAds.has(e),
    );
  }

  let sent = 0;
  let failed = 0;
  const batchSize = 100;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    const payload = await Promise.all(
      batch.map(async (email) => {
        const unsubscribeUrl = `https://ladybosslook.com/unsubscribe?e=${encodeURIComponent(email)}&t=${await unsubToken(email)}`;
        return {
          from: FROM,
          to: [email],
          subject,
          html: buildHtml(kind, unsubscribeUrl, topic, igFree),
          reply_to: "support@ladybosslook.com",
          tags: [
            { name: "campaign", value: "live_followup" },
            { name: "kind", value: kind },
            { name: "round", value: roundKey },
          ],
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        };
      }),
    );
    const result = await sendBatch(payload);
    if (!result) {
      failed += batch.length;
    } else {
      sent += batch.length;
      const logs = batch.map((email, idx) => ({
        recipient_email: email,
        status: "success",
        resend_id: result.ids[idx] ?? null,
      }));
      const { error: logErr } = await supabase.from("email_logs").insert(logs);
      if (logErr) console.error("log insert failed:", logErr.message);
    }
    if (i + batchSize < recipients.length) await new Promise((r) => setTimeout(r, 600));
  }

  console.log(`${kind} follow-up for round ${round.round_name}: sent=${sent} failed=${failed} of ${recipients.length}`);
  return { round: round.round_name, kind, recipients: recipients.length, sent, failed };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!(await isInternalOrAdmin(req))) return deny(corsHeaders);
    if (!RESEND_API_KEY) throw new Error("Email service not configured");

    const body = await req.json().catch(() => ({}));
    const now = Date.now();

    let rounds: any[] = [];
    let kinds: Kind[] = ["3h", "24h"];

    if (body.round_id && body.kind) {
      // Manual send for a specific round + kind (admin).
      const { data, error } = await supabase
        .from("program_rounds")
        .select("id, round_name, round_number, first_session_date, program_slug")
        .eq("id", body.round_id)
        .single();
      if (error || !data) throw new Error("Round not found");
      rounds = [data];
      kinds = [body.kind as Kind];
    } else {
      // Auto mode: rounds whose live session started ~3h or ~24h ago.
      const windows: Record<Kind, [number, number]> = {
        "3h": [2.5, 4.5],
        "24h": [23, 26],
      };
      for (const kind of kinds) {
        const [minH, maxH] = windows[kind];
        const { data, error } = await supabase
          .from("program_rounds")
          .select("id, round_name, round_number, first_session_date, program_slug")
          .eq("program_slug", "igadsfree")
          .gte("first_session_date", new Date(now - maxH * 3600_000).toISOString())
          .lte("first_session_date", new Date(now - minH * 3600_000).toISOString());
        if (error) throw error;
        for (const r of data || []) rounds.push({ ...r, _kind: kind });
      }
      // IG Free Webinar: email 1 at 9 AM LA the morning after, email 2 24h later.
      const { data: igf, error: igfErr } = await supabase
        .from("program_rounds")
        .select("id, round_name, round_number, first_session_date, program_slug")
        .eq("program_slug", "igfreewebinar")
        .gte("first_session_date", new Date(now - 4 * 86400_000).toISOString())
        .lte("first_session_date", new Date(now).toISOString());
      if (igfErr) throw igfErr;
      for (const r of igf || []) {
        const first = morningAfter(new Date(r.first_session_date)).getTime();
        const due: Record<Kind, number> = { "3h": first, "24h": first + 24 * 3600_000 };
        for (const kind of kinds) {
          if (now >= due[kind] && now < due[kind] + 6 * 3600_000) rounds.push({ ...r, _kind: kind });
        }
      }
    }

    const results = [];
    for (const round of rounds) {
      const roundKinds = body.round_id ? kinds : [round._kind as Kind];
      for (const kind of roundKinds) {
        results.push(await processRound(round, kind, body.testEmail));
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("send-live-followup-emails error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
