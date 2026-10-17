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
//
// Manual mode (admin): { "round_id": "...", "kind": "morning" | "start",
//   "testEmail": "you@x.com" }
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

type Kind = "morning" | "start";

// Subjects keep the prefixes that src/lib/igAdsRoundStats.ts uses to classify
// automated emails for open-rate stats.
const SUBJECTS: Record<Kind, string> = {
  morning: "امروز: جذب مشتری با اینستاگرام ادز — وبینار امروزه 🌅",
  start: "وبینار در حال شروع است — همین حالا وارد شو 🔴",
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

function buildHtml(kind: Kind, name: string, round: any, tz: string, unsubscribeUrl: string): string {
  const start = new Date(round.first_session_date);
  const meetUrl: string = round.google_meet_link || "";
  const when = fmtLocal(start, tz);
  const btn = (label: string, url: string, bg = "#EA5B2B") =>
    `<tr><td align="center" style="padding:6px 0;"><a href="${escapeHtml(url)}" style="display:inline-block;background:${bg};color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 28px;border-radius:12px;">${escapeHtml(label)}</a></td></tr>`;
  const p = (text: string) =>
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.9;color:#333;text-align:right;">${text}</p>`;

  const body =
    kind === "morning"
      ? [
          p(`سلام ${escapeHtml(name)} عزیز 👋`),
          p("فقط چند ساعت مونده! وبینار رایگان <b>«جذب مشتری با اینستاگرام ادز»</b> امروز برگزار می‌شه."),
          p(`🕐 <b>زمان جلسه به وقت شما:</b><br><span dir="ltr">${escapeHtml(when)}</span>`),
          p("لینک ورود رو همین ایمیل داری — سر ساعت کلیک کن و وارد شو. پیشنهاد ویژه‌ای هم برای شرکت‌کنندگان لایو در نظر گرفتیم که فقط تا ۲۴ ساعت بعد از وبینار فعاله."),
          p("اگر سؤالی داری، همین ایمیل رو جواب بده یا توی چت اپ ریلو پیام بده."),
        ]
      : [
          p(`سلام ${escapeHtml(name)} عزیز 👋`),
          p("<b>وبینار «جذب مشتری با اینستاگرام ادز» همین الان داره شروع می‌شه!</b>"),
          p("روی دکمه زیر کلیک کن و مستقیم وارد جلسه شو:"),
        ];

  const buttons =
    kind === "start" && meetUrl
      ? btn("ورود به وبینار 🔴", meetUrl, "#dc2626")
      : meetUrl
        ? btn("لینک ورود به وبینار 🎥", meetUrl)
        : "";

  return `<!DOCTYPE html>
<html dir="rtl">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body dir="rtl" style="direction:rtl;text-align:right;margin:0;padding:0;background:#f6f6f7;font-family:Tahoma, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f7;padding:24px 12px;">
      <tr><td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
          <tr><td style="padding:28px 28px 8px;" dir="rtl">
            <h1 style="margin:0 0 18px;font-size:22px;line-height:1.5;color:#111;text-align:right;">${escapeHtml(SUBJECTS[kind])}</h1>
            ${body.join("\n            ")}
          </td></tr>
          <tr><td style="padding:8px 28px 24px;"><table width="100%" cellpadding="0" cellspacing="0">
            ${buttons}
            ${btn("گفتگو با پشتیبانی در اپ ریلو 💬", SUPPORT_URL, "#111827")}
          </table></td></tr>
          <tr><td style="padding:4px 28px 24px;" dir="rtl">
            <div style="font-size:15px;line-height:1.8;color:#444;text-align:right;">
              منتظر دیدنت هستیم!<br>علی لطفی<br>Rilo App (Ladybosslook LLC.)
            </div>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

interface Registrant { email: string; name: string; timezone: string | null }

async function collectRegistrants(roundId: string): Promise<Registrant[]> {
  const map = new Map<string, Registrant>();
  for (let page = 0; page < 10; page++) {
    const { data, error } = await supabase
      .from("form_submissions")
      .select("email, name, timezone")
      .eq("round_id", roundId)
      .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    for (const r of data || []) {
      const e = String(r.email || "").trim().toLowerCase();
      if (e && !map.has(e)) map.set(e, { email: e, name: String(r.name || "دوست عزیز"), timezone: r.timezone || null });
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
    ? [{ email: testEmail.toLowerCase(), name: "دوست عزیز", timezone: null }]
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
          html: appendUnsubFooter(buildHtml(kind, r.name, round, tz, unsubscribeUrl), unsubscribeUrl),
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
