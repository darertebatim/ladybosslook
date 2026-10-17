// Sends the 2-email post-live sequence to verified live attendees (show-ups)
// of the IG Ads webinar: Email 1 at +3h (direct Acquisition offer), Email 2 at
// +24h (last chance). Runs hourly via pg_cron; also supports manual sends:
//   { "round_id": "...", "kind": "3h" | "24h", "testEmail": "you@x.com" }
import { isInternalOrAdmin, deny } from "../_shared/caller-auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

function buildHtml(kind: Kind, unsubscribeUrl: string): string {
  const btn = (label: string, url: string) =>
    `<tr><td align="center" style="padding:6px 0;"><a href="${esc(url)}" style="display:inline-block;background:#EA5B2B;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 28px;border-radius:12px;">${esc(label)}</a></td></tr>`;
  const p = (text: string) =>
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.9;color:#333;text-align:right;">${text}</p>`;

  const body =
    kind === "3h"
      ? [
          p("سلام! علی هستم 👋"),
          p("اول ازت تشکر می‌کنم که امروز لایو وبینار «جذب مشتری با اینستاگرام ادز» بودی. انرژی جلسه فوق‌العاده بود و خوشحالم که تا آخر همراهم بودی."),
          p("همون‌طور که توی جلسه گفتم، یک پیشنهاد ویژه فقط برای شرکت‌کنندگان لایو آماده کردم: <b>دوره جذب مشتری با اینستاگرام ادز</b> — جایی که قدم‌به‌قدم کنار هم کمپین‌هات رو می‌سازیم و راه می‌ندازیم."),
          p("این پیشنهاد فقط برای کسانیه که لایو بودن و <b>تا ۲۴ ساعت آینده</b> بازه. بعد از اون، ثبت‌نام با قیمت عادی و بدون بونوس‌های ویژه وبینار خواهد بود."),
          p("اگر سؤالی داری، همین ایمیل رو جواب بده یا توی چت اپ ریلو بهم پیام بده — خودم جواب می‌دم."),
        ]
      : [
          p("سلام دوباره! علی هستم 👋"),
          p("دیروز توی وبینار «جذب مشتری با اینستاگرام ادز» بودی و دیدی که چطور می‌شه با تبلیغات اینستاگرام مشتری جذب کرد."),
          p("فقط خواستم یادآوری کنم که <b>پیشنهاد ویژه شرکت‌کنندگان لایو تا چند ساعت دیگر بسته می‌شود.</b> بعد از اون دیگه قیمت ویژه و بونوس‌های وبینار در دسترس نخواهد بود."),
          p("اگر دیروز گفتی «بعداً تصمیم می‌گیرم» — اون «بعداً» همین الان‌ه 🙂"),
          p("سؤالی داری؟ همین ایمیل رو جواب بده یا توی چت اپ ریلو پیام بده."),
        ];

  return `<!DOCTYPE html>
<html dir="rtl">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body dir="rtl" style="direction:rtl;text-align:right;margin:0;padding:0;background:#f6f6f7;font-family:Tahoma, 'Iranian Sans', Arial, sans-serif;">
    <span style="display:none;font-size:0;line-height:0;opacity:0;">${esc(KINDS[kind].preheader)}</span>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f7;padding:24px 12px;">
      <tr><td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
          <tr><td style="padding:28px 28px 8px;" dir="rtl">
            <h1 style="margin:0 0 18px;font-size:22px;line-height:1.5;color:#111;text-align:right;">${esc(KINDS[kind].subject)}</h1>
            ${body.join("\n            ")}
          </td></tr>
          <tr><td style="padding:8px 28px 24px;"><table width="100%" cellpadding="0" cellspacing="0">
            ${btn(kind === "3h" ? "ثبت‌نام در دوره جذب مشتری 🚀" : "ثبت‌نام قبل از بسته شدن پیشنهاد ⏳", PROGRAM_URL)}
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

/** Distinct lowercased emails of live gift-page submitters within [start, start+2h]. */
async function collectLiveAttendees(roundId: string, sessionStart: Date): Promise<string[]> {
  const windowEnd = new Date(sessionStart.getTime() + 2 * 60 * 60 * 1000);
  const set = new Set<string>();
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
      if (e) set.add(e);
    }
    if (!data || data.length < 1000) break;
  }
  return [...set];
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

  const subject = KINDS[kind].subject;
  let recipients = testEmail ? [testEmail.toLowerCase()] : await collectLiveAttendees(round.id, sessionStart);

  if (!testEmail) {
    const [unsub, alreadySent, buyers] = await Promise.all([
      collectUnsubscribed(),
      collectAlreadySent(subject),
      collectBuyers(),
    ]);
    recipients = recipients.filter((e) => !unsub.has(e) && !alreadySent.has(e) && !buyers.has(e));
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
          html: buildHtml(kind, unsubscribeUrl),
          reply_to: "support@ladybosslook.com",
          tags: [
            { name: "campaign", value: "live_followup" },
            { name: "kind", value: kind },
            { name: "round", value: String(round.round_number ?? round.id) },
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
        .select("id, round_name, round_number, first_session_date")
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
          .select("id, round_name, round_number, first_session_date")
          .eq("program_slug", "igadsfree")
          .gte("first_session_date", new Date(now - maxH * 3600_000).toISOString())
          .lte("first_session_date", new Date(now - minH * 3600_000).toISOString());
        if (error) throw error;
        for (const r of data || []) rounds.push({ ...r, _kind: kind });
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
