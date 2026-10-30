// Customer Acquisition (casigads) Round 4 "last call" email to all IG Ads webinar sign-ups.
// Excludes anyone already enrolled in casigads (incl. their merged/alias emails),
// unsubscribed, or already sent this email.
//
// POST { "test_email": "you@x.com" } -> one test copy
// POST { "dry_run": true }           -> count recipients only
// POST {}                            -> real send
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { buildUnsubUrl, unsubHeaders, appendUnsubFooter, fetchUnsubscribed } from "../_shared/unsubscribe.ts";
import { isInternalOrAdmin, deny } from "../_shared/caller-auth.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const FROM = "Ali Lotfi <ali@ladybosslook.com>";
const MONITOR_EMAIL = "darertebatim@gmail.com";
const CAMPAIGN = "casigads_lastcall_r4";
const LANDING_URL = "https://ladybosslook.com/l/igadsprogram";
const SUBJECT = "تخفیف لحظه آخری دوره جذب مشتری (شروع از دوشنبه)";
const PREVIEW = "اولین جلسه لایو همین دوشنبه ۲ نوامبر — شهریه ۲۹۷ دلار به‌جای ۴۹۷ دلار";
const SOURCES = [
  "igads_registration", "aliagads_registration", "igads_gifts", "igads_additional_email",
  "igads_waitlist", "igadsfree_registration", "startads_registration", "startads_waitlist",
  "customerwithigads_waitlist", "igthree_video", "igthree_waitlist", "igthree_program_waitlist",
];
const PROGRAM = "casigads";

const norm = (e: unknown) => String(e || "").trim().toLowerCase();

async function paged(build: (from: number) => any): Promise<any[]> {
  const out: any[] = [];
  for (let p = 0; p < 50; p++) {
    const { data, error } = await build(p * 1000);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

async function collectRecipients(): Promise<string[]> {
  const rows = await paged((f) =>
    supabase.from("form_submissions").select("email").in("source", SOURCES).range(f, f + 999));
  const set = new Set(rows.map((r) => norm(r.email)).filter((e) => e.includes("@")));

  // Enrolled in casigads (any status) -> their profile email + every merged alias.
  const enr = await paged((f) =>
    supabase.from("course_enrollments").select("user_id").eq("program_slug", PROGRAM).range(f, f + 999));
  const ids = [...new Set(enr.map((r) => r.user_id).filter(Boolean))];
  const excluded = new Set<string>();
  for (let i = 0; i < ids.length; i += 300) {
    const chunk = ids.slice(i, i + 300);
    const [{ data: profs }, { data: aliases }] = await Promise.all([
      supabase.from("profiles").select("email").in("id", chunk),
      supabase.from("account_email_aliases").select("email").in("primary_user_id", chunk),
    ]);
    for (const r of profs || []) excluded.add(norm(r.email));
    for (const r of aliases || []) excluded.add(norm(r.email));
  }
  // Paid casigads orders (covers buyers whose enrollment is under another email).
  const orders = await paged((f) =>
    supabase.from("orders").select("email").eq("program_slug", PROGRAM).eq("status", "paid").range(f, f + 999));
  for (const r of orders) excluded.add(norm(r.email));

  return [...set].filter((e) => !excluded.has(e));
}

async function alreadySent(): Promise<Set<string>> {
  const rows = await paged((f) =>
    supabase.from("email_delivery_events").select("recipient")
      .eq("tags->>campaign", CAMPAIGN).in("event_type", ["sent", "delivered"]).range(f, f + 999));
  return new Set(rows.map((r) => norm(r.recipient)));
}

const P = (t: string) => `<p style="margin:0 0 14px;">${t}</p>`;
function buildHtml(): string {
  return `<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f6f7;font-family:Tahoma,Arial,sans-serif;">
<span style="display:none;font-size:0;line-height:0;opacity:0;">${PREVIEW}</span>
<div style="max-width:600px;margin:0 auto;padding:24px 12px;">
<div dir="rtl" style="background:#fff;border-radius:16px;padding:28px 24px;font-size:16px;line-height:1.95;color:#222;text-align:right;">
${P("سلام سلام، روزتون بخیر باشه 🌸")}
${P("از طرف استاد لطفی براتون ایمیل می‌فرستم.")}
${P("چون اولین جلسه کارگاه لایو <strong>همین دوشنبه (کُد ۴)</strong> شروع میشه، ثبت‌نام این دوره داره بسته میشه تا بتونیم به همه شرکت‌کننده‌ها دسترسی کامل پنل رو بدیم و گروه پشتیبانی تخصصی ۳ هفته‌ای رو قبل از شروع جلسه اول هماهنگ کنیم.")}
${P(`شهریه ثبت‌نام با تخفیف لحظه آخری این کُد <strong style="color:#dc2626;">۲۹۷ دلاره</strong> (به‌جای <s>۴۹۷ دلار</s> — ۲۰۰ دلار تخفیف).`)}
${P("اگر می‌خواین در این کُد همراه استاد باشین تا از همین هفته کمپین‌های تبلیغاتی بیزینس‌تون رو در آمریکا یا کانادا اصولی راه بندازین 🇺🇸🇨🇦، از طریق لینک زیر می‌تونین مستقیم ثبت‌نام کنین:")}
<div style="text-align:center;margin:18px 0;">
<a href="${LANDING_URL}" style="display:inline-block;background:#EA5B2B;color:#fff;text-decoration:none;font-weight:bold;font-size:17px;padding:14px 32px;border-radius:999px;">ورود به کُد ۴ و ثبت‌نام با ۲۹۷ دلار</a>
</div>
<p style="margin:0 0 18px;font-size:13px;color:#555;text-align:center;">یا این آدرس رو باز کنین: <a href="${LANDING_URL}" style="color:#EA5B2B;">${LANDING_URL}</a></p>
<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px 14px;margin:0 0 16px;font-size:15px;">
📅 <strong>ساعت برگزاری جلسه اول (همین دوشنبه ۲ نوامبر):</strong><br/>
• لس‌آنجلس / ونکوور (غرب): ۵:۰۰ بعدازظهر<br/>
• نیویورک / تورنتو (شرق): ۸:۰۰ شب<br/>
<span style="font-size:13px;color:#555;">(تمام ۳ جلسه ضبط میشن و اگر نتونین در ساعتی آنلاین باشین، ویدیو و فایل‌های تمرینی همون شب در پنل کاربری‌تون قرار می‌گیره.)</span>
</div>
${P("همچنین ثبت‌نام شما شامل <strong>۳۰ روز ضمانت کامل بازگشت وجه (بدون هیچ سؤالی)</strong> است تا با خیال کاملاً راحت شروع کنین.")}
${P("اگر سؤالی درباره بیزینس‌تون یا محتوای دوره دارین، همین ایمیل رو ریپلای کنین تا راهنماییتون کنیم.")}
<p style="margin:20px 0 0;">ارادتمند شما،<br/><strong>تیم استاد علی لطفی</strong></p>
</div></div></body></html>`;
}

async function sendBatch(payload: any[]): Promise<{ ids: (string | null)[] } | null> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.status === 429 || res.status >= 500) { await new Promise((r) => setTimeout(r, 1000 * (attempt + 1))); continue; }
    const json = await res.json().catch(() => null);
    if (!res.ok) { console.error("batch failed", res.status, JSON.stringify(json)); return null; }
    return { ids: (json?.data ?? []).map((d: any) => d?.id ?? null) };
  }
  return null;
}

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!(await isInternalOrAdmin(req))) return deny(corsHeaders);
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");
    const body = await req.json().catch(() => ({}));
    const testEmail = typeof body?.test_email === "string" ? norm(body.test_email) : "";
    const dryRun = body?.dry_run === true;

    let recipients = testEmail ? [testEmail] : await collectRecipients();
    if (!testEmail) {
      const [unsub, sent] = await Promise.all([fetchUnsubscribed(supabase, recipients), alreadySent()]);
      recipients = recipients.filter((e) => !unsub.has(e) && !sent.has(e));
    }
    if (dryRun) return json({ recipients: recipients.length, dry_run: true });

    const html = buildHtml();
    let sent = 0, failed = 0;
    for (let i = 0; i < recipients.length; i += 100) {
      const batch = recipients.slice(i, i + 100);
      const payload = await Promise.all(batch.map(async (email) => {
        const u = await buildUnsubUrl(email);
        return {
          from: FROM, to: [email], subject: SUBJECT, reply_to: "support@ladybosslook.com",
          html: appendUnsubFooter(html, u), headers: unsubHeaders(u),
          tags: [{ name: "campaign", value: testEmail ? `${CAMPAIGN}_test` : CAMPAIGN }],
        };
      }));
      const r = await sendBatch(payload);
      if (!r) failed += batch.length;
      else {
        sent += batch.length;
        await supabase.from("email_logs").insert(batch.map((e, idx) => ({ recipient_email: e, status: "success", resend_id: r.ids[idx] ?? null })));
      }
      if (i + 100 < recipients.length) await new Promise((r) => setTimeout(r, 600));
    }
    if (!testEmail && sent > 0) {
      await sendBatch([{ from: FROM, to: [MONITOR_EMAIL], subject: `[کپی کمپین — ${sent} نفر] ${SUBJECT}`, html, tags: [{ name: "campaign", value: `${CAMPAIGN}_monitor` }] }]);
    }
    console.log(`${CAMPAIGN}: sent=${sent} failed=${failed} of ${recipients.length}`);
    return json({ recipients: recipients.length, sent, failed });
  } catch (e: any) {
    console.error("send-casigads-lastcall error", e);
    return json({ error: e?.message || "Failed" }, 500);
  }
});
