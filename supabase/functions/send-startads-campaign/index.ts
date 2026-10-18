// StartAds launch campaign — reactivation emails to past IG Ads signups.
// Email 1 ("invite"): short, direct invitation to the free first session of the
// 3-week Customer Acquisition program (50 seats), CTA to /l/startads.
//
// POST { "kind": "invite", "test_email": "you@x.com" }  -> sends one test copy
// POST { "kind": "invite", "dry_run": true }            -> counts recipients only
// POST { "kind": "invite" }                             -> real send to all eligible
//
// Dedupe: one "invite" per recipient ever (tags campaign=startads_launch).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { buildUnsubUrl, unsubHeaders, appendUnsubFooter, fetchUnsubscribed } from "../_shared/unsubscribe.ts";
import { isInternalOrAdmin, deny } from "../_shared/caller-auth.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const FROM = "Ali Lotfi <ali@ladybosslook.com>";
const MONITOR_EMAIL = "darertebatim@gmail.com";
const LANDING_URL = "https://ladybosslook.com/l/startads";
const HEADER_IMAGE =
  "https://ladybosslook.com/__l5e/assets-v1/d12d188c-82b1-4909-8f2a-c6b793eecc71/startads-email-header.png";

// Past IG Ads / webinar signup sources to reactivate.
const TARGET_SOURCES = [
  "igadsfree_registration",
  "igads_registration",
  "aliagads_registration",
  "sixtraps_registration",
  "presixtraps_interest",
  "smartinsta_registration",
];

type Kind = "invite" | "focus" | "urgency";
const KINDS: Kind[] = ["invite", "focus", "urgency"];
const SUBJECTS: Record<Kind, string> = {
  invite: "یک دعوت خصوصی (فقط ۵۰ نفر از بچه‌های اینستاگرام) 🎁",
  focus: "محصول یا خدمتت عالیه، ولی مشتری جدید کجاست؟ 🤔",
  urgency: "بازار آخر سال نزدیکه (چرا جلسه اول رو براتون رایگان کردم؟) 🛍️",
};
const PREVIEWS: Record<Kind, string> = {
  invite: "جلسه اول برنامه ۳ هفته‌ای رو رایگان گذاشتم براتون...",
  focus: "چرا بیشتر تبلیغ‌ها دیده نمیشن و توی جلسه اول دقیقاً روی چی کار می‌کنیم؟",
  urgency: "فقط روی پست گذاشتن و شانس نمیشه حساب کرد؛ چرا این آخرین فرصت امساله؟",
};

type Registrant = { email: string; name: string };

async function collectRecipients(): Promise<Registrant[]> {
  const map = new Map<string, Registrant>();
  for (let page = 0; page < 40; page++) {
    const { data, error } = await supabase
      .from("form_submissions")
      .select("email, name")
      .in("source", TARGET_SOURCES)
      .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    for (const r of data || []) {
      const e = String(r.email || "").trim().toLowerCase();
      if (!e || map.has(e)) continue;
      map.set(e, { email: e, name: String(r.name || "دوست عزیز").trim() || "دوست عزیز" });
    }
    if (!data || data.length < 1000) break;
  }
  // Skip people already signed up for an upcoming webinar round (any program
  // except startads) — they are in their own active round's email flow.
  const { data: upRounds } = await supabase
    .from("program_rounds")
    .select("id")
    .neq("program_slug", "startads")
    .gt("first_session_date", new Date().toISOString());
  const upIds = (upRounds || []).map((r: any) => r.id);
  if (upIds.length) {
    for (let page = 0; page < 20; page++) {
      const { data } = await supabase
        .from("form_submissions")
        .select("email")
        .in("round_id", upIds)
        .range(page * 1000, page * 1000 + 999);
      for (const r of data || []) map.delete(String(r.email || "").trim().toLowerCase());
      if (!data || data.length < 1000) break;
    }
  }
  return [...map.values()];
}

async function collectAlreadySent(kind: string): Promise<Set<string>> {
  const set = new Set<string>();
  for (let page = 0; page < 40; page++) {
    const { data, error } = await supabase
      .from("email_delivery_events")
      .select("recipient")
      .eq("tags->>campaign", "startads_launch")
      .eq("tags->>kind", kind)
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

const R = (t: string) =>
  `<strong style="color:#dc2626;">${t}</strong>`;

const P = (t: string, mb = 12) => `<p style="margin:0 0 ${mb}px;">${t}</p>`;
const CTA = (label: string) => `<div style="text-align:center;margin:8px 0 4px;">
        <a href="${LANDING_URL}" style="display:inline-block;background:#e11d48;color:#ffffff;text-decoration:none;font-weight:bold;font-size:17px;padding:14px 34px;border-radius:999px;">${label}</a>
      </div>`;
const SESSION_BOX = `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px 14px;margin:18px 0 0;font-size:14px;line-height:1.9;">
  📅 <strong>زمان جلسه اول:</strong> شنبه ۲۴ اکتبر — ۹:۳۰ صبح لس‌آنجلس (PDT) / ۱۲:۳۰ ظهر نیویورک و تورنتو (EDT)<br/>
  ⚠️ جلسه ${R("ضبط نمیشه")} و فقط لایو برگزار میشه.
</div>`;

function bodyFor(kind: Kind, name: string): string {
  if (kind === "focus") {
    return [
      P(`سلام ${name} عزیز، 👋`),
      P(`احتمالاً برات پیش اومده که یک پست رو با دکمه Boost تبلیغ کردی، چند تا لایک و شاید یکی دو تا پیام گرفتی، ولی آخرش هیچ ${R("مشتری واقعی")} یا فروشی ازش درنیومد. 😕`),
      P(`خیلی‌ها فکر می‌کنن مشکل از بودجه کم یا الگوریتم اینستاگرامه. ولی واقعیت اینه: وقتی کسی در آمریکا یا کانادا برای اولین بار تبلیغ تو رو می‌بینه، هنوز هیچ دلیلی نداره که بهت اعتماد کنه.`),
      P(`راه انداختن کمپین و کار با Ads Manager کاریه که در طول ${R("دوره ۳ هفته‌ای")} قدم‌به‌قدم با هم انجام میدیم.`),
      P(`اما توی <strong>جلسه اول (شنبه ۲۴ اکتبر)</strong> از یک جای اساسی‌تر شروع می‌کنیم: ${R("شفاف کردن پیامی که به مشتری میدی")} 🎯`),
      P(`توی این جلسه ۹۰ دقیقه‌ای لایو مشخص می‌کنیم:<br/>
۱. از بین خدماتت، دقیقاً <strong>کدوم پیشنهاد</strong> شانس جذب مشتری جدید در بازار محلی رو داره.<br/>
۲. چه زاویه‌ای رو توی معرفی بگی که مخاطب ارزش کارت رو بفهمه و به جای رد شدن، بهت پیام بده.<br/>
۳. چه اشتباهاتی باعث میشه آدم‌ها قیمت بپرسن و غیبشون بزنه! 👻`),
      P(`جایگاه‌های ${R("رایگان")} ۵۰ نفره داره پر میشه. اگر بیزینس فعال در آمریکا یا کانادا داری، جلسه اول مهمون مایی: ✨`, 20),
      CTA("🎬 دیدن ویدیو و رزرو جایگاه رایگان"),
      SESSION_BOX,
    ].join("\n");
  }
  if (kind === "urgency") {
    return [
      P(`سلام ${name} عزیز، 👋`),
      P(`مستقیم میرم سر اصل مطلب: ${R("بازار آخر سال")} در آمریکا و کانادا نزدیکه. 🛍️`),
      P(`اگر تا الان پست گذاشتی، استوری رفتی یا دکمه Boost رو زدی و فقط چند تا لایک یا کلیک گرون نصیبت شده، خودت خوب می‌دونی که برای بازار آخر سال ${R("فقط روی پست گذاشتن و شانس آوردن نمیشه حساب کرد.")}`),
      P(`اگر می‌خوای از خریدهای آخر سال سهم واقعی داشته باشی، سیستم جذب مشتریت باید <strong>قبل از شروع شلوغی‌ها</strong> ستاپ شده باشه. ⏰`),
      P(`برای همین این ${R("آخرین دوره امسال")} برای بیزینس‌های ایرانی آمریکا و کاناداست.`),
      P(`این دوره پولیه؛ اما چون آخرین سری قبل از بازار آخر ساله، تصمیم گرفتم 👈 <strong>جلسه اول رو برای ${R("فقط ۵۰ نفر رایگان")} باز بذارم</strong> تا تو هم قبل از آخر سال بتونی ازش استفاده کنی. 🎁`),
      P(`جلسه اول وبینار تئوری نیست؛ یک کلاس واقعی و تعاملی با پرسش‌وپاسخه. برای همین ظرفیت رو زیر ۵۰ نفر نگه داشتیم تا حق کسی ضایع نشه.`),
      P(`به محض اینکه ظرفیت پر بشه، صفحه ثبت‌نام بسته میشه: ⏳`, 20),
      CTA("🎟️ رزرو جایگاه رایگان جلسه اول"),
      SESSION_BOX,
    ].join("\n");
  }
  return [
    P(`سلام ${name} عزیز، 👋`),
    P(`تصمیم گرفتم جلسه اول دوره جذب مشتری رو ${R("رایگان")} براتون باز کنم... 🎁`),
    P(`توی ویدیوی کوتاهی که گذاشتم مستقیم گفتم: بیشتر بیزینس‌های کوچیک توی آمریکا و کانادا مشکل محصول ندارن — مشکلشون اینه که ${R("مشتری بعدی")} رو نمی‌دونن از کجا میاد. 📉`),
    P(`شنبه، جلسه اول برنامه ۳ هفته‌ای «شروع تبلیغات اینستاگرامی» برگزار میشه و من ${R("فقط ۵۰ جایگاه رایگان")} برای بچه‌هایی که قبلاً توی وبینارهای اینستاگرام ثبت‌نام کردن کنار گذاشتم. ✨`),
    P(`اول ویدیو رو ببین، بعد اگر حس کردی این مسیر برای توئه، جایگاهت رو رزرو کن — قبل از اینکه ۵۰ صندلی پر بشه. ⏳`, 20),
    CTA("🎬 دیدن ویدیو و رزرو جایگاه رایگان"),
    `<p style="margin:18px 0 0;text-align:center;font-size:13px;color:#64748b;">ظرفیت محدود · بدون ضبط · شنبه به وقت محلی تو 📅</p>`,
  ].join("\n");
}

function buildHtml(kind: Kind, name: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Tahoma,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${PREVIEWS[kind]}</div>
<div style="max-width:560px;margin:0 auto;padding:16px;">
  <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
    <img src="${HEADER_IMAGE}" alt="جلسه اول رایگان — جذب مشتری و تبلیغات اینستاگرامی" width="560" style="display:block;width:100%;height:auto;" />
    <div style="padding:24px 22px 28px;color:#1e293b;font-size:15px;line-height:2;">
      ${bodyFor(kind, name)}
      <p style="margin:24px 0 0;">می‌بینمت، 🌷<br/>علی لطفی<br/><span style="color:#64748b;font-size:13px;">Rilo App — Ladybosslook llc</span></p>
    </div>
  </div>
</div>
</body>
</html>`;
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!(await isInternalOrAdmin(req))) return deny(corsHeaders);
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");

    const body = await req.json().catch(() => ({}));
    const kind = String(body?.kind || "invite") as Kind;
    if (!KINDS.includes(kind)) {
      return new Response(JSON.stringify({ error: "unknown kind" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const testEmail = typeof body?.test_email === "string" ? body.test_email.trim().toLowerCase() : "";
    const dryRun = body?.dry_run === true;

    let recipients: Registrant[] = testEmail
      ? [{ email: testEmail, name: "دوست عزیز" }]
      : await collectRecipients();

    if (!testEmail) {
      const [unsub, alreadySent] = await Promise.all([
        fetchUnsubscribed(supabase, recipients.map((r) => r.email)),
        collectAlreadySent(kind),
      ]);
      recipients = recipients.filter((r) => !unsub.has(r.email) && !alreadySent.has(r.email));
    }

    if (dryRun) {
      return new Response(JSON.stringify({ kind, recipients: recipients.length, dry_run: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    let failed = 0;
    const batchSize = 100;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const payload = await Promise.all(
        batch.map(async (r) => {
          const unsubscribeUrl = await buildUnsubUrl(r.email);
          return {
            from: FROM,
            to: [r.email],
            subject: SUBJECTS[kind],
            html: appendUnsubFooter(buildHtml(kind, r.name), unsubscribeUrl),
            reply_to: "support@ladybosslook.com",
            tags: [
              { name: "campaign", value: "startads_launch" },
              { name: "kind", value: kind },
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
      if (i + batchSize < recipients.length) await new Promise((r) => setTimeout(r, 600));
    }

    if (!testEmail && sent > 0) {
      await sendBatch([{
        from: FROM,
        to: [MONITOR_EMAIL],
        subject: `[کپی ارسال کمپین StartAds — ${sent} نفر] ${SUBJECTS[kind]}`,
        html: buildHtml(kind, recipients[0]?.name || "دوست عزیز"),
        tags: [
          { name: "campaign", value: "startads_launch_monitor" },
          { name: "kind", value: kind },
        ],
      }]).catch((e) => console.error("monitor copy failed", e));
    }

    console.log(`startads ${kind}: sent=${sent} failed=${failed} of ${recipients.length}`);
    return new Response(JSON.stringify({ kind, recipients: recipients.length, sent, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("send-startads-campaign error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
