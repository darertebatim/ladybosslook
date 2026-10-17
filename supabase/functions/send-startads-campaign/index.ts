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

const SUBJECT = "یک دعوت خصوصی (فقط ۵۰ نفر از بچه‌های اینستاگرام) 🎁";
const PREVIEW_TEXT = "جلسه اول برنامه ۳ هفته‌ای رو رایگان گذاشتم براتون...";

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

function buildHtml(name: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Tahoma,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${PREVIEW_TEXT}</div>
<div style="max-width:560px;margin:0 auto;padding:16px;">
  <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
    <img src="${HEADER_IMAGE}" alt="جلسه اول رایگان — جذب مشتری و تبلیغات اینستاگرامی" width="560" style="display:block;width:100%;height:auto;" />
    <div style="padding:24px 22px 28px;color:#1e293b;font-size:15px;line-height:2;">
      <p style="margin:0 0 12px;">سلام ${name} عزیز، 👋</p>
      <p style="margin:0 0 12px;">تصمیم گرفتم جلسه اول دوره جذب مشتری رو ${R("رایگان")} براتون باز کنم... 🎁</p>
      <p style="margin:0 0 12px;">توی ویدیوی کوتاهی که گذاشتم مستقیم گفتم: بیشتر بیزینس‌های کوچیک توی آمریکا و کانادا مشکل محصول ندارن — مشکلشون اینه که ${R("مشتری بعدی")} رو نمی‌دونن از کجا میاد. 📉</p>
      <p style="margin:0 0 12px;">شنبه، جلسه اول برنامه ۳ هفته‌ای «شروع تبلیغات اینستاگرامی» برگزار میشه و من ${R("فقط ۵۰ جایگاه رایگان")} برای بچه‌هایی که قبلاً توی وبینارهای اینستاگرام ثبت‌نام کردن کنار گذاشتم. ✨</p>
      <p style="margin:0 0 20px;">اول ویدیو رو ببین، بعد اگر حس کردی این مسیر برای توئه، جایگاهت رو رزرو کن — قبل از اینکه ۵۰ صندلی پر بشه. ⏳</p>
      <div style="text-align:center;margin:8px 0 4px;">
        <a href="${LANDING_URL}" style="display:inline-block;background:#e11d48;color:#ffffff;text-decoration:none;font-weight:bold;font-size:17px;padding:14px 34px;border-radius:999px;">🎬 دیدن ویدیو و رزرو جایگاه رایگان</a>
      </div>
      <p style="margin:18px 0 0;text-align:center;font-size:13px;color:#64748b;">ظرفیت محدود · بدون ضبط · شنبه به وقت محلی تو 📅</p>
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
    const kind = String(body?.kind || "invite");
    if (kind !== "invite") {
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
            subject: SUBJECT,
            html: appendUnsubFooter(buildHtml(r.name), unsubscribeUrl),
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
        subject: `[کپی ارسال کمپین StartAds — ${sent} نفر] ${SUBJECT}`,
        html: buildHtml(recipients[0]?.name || "دوست عزیز"),
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
