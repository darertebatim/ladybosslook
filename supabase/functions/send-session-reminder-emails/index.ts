import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { buildUnsubUrl, fetchUnsubscribed, unsubHeaders, appendUnsubFooter } from "../_shared/unsubscribe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-timezone",
};

// Two emails per live session: ~1 hour before and ~15 minutes before.
// Windows are wider than the 5-minute schedule so a missed run still sends; a
// dedupe marker per session+type ensures each email goes out only once.
const TYPES = [
  { key: "1h", minMin: 20, maxMin: 65 },
  { key: "15m", minMin: -5, maxMin: 20 },
] as const;

const fmt = (d: Date, tz: string) =>
  d.toLocaleString("en-US", { timeZone: tz, weekday: "short", hour: "numeric", minute: "2-digit" });

function html(opts: { name: string; program: string; title: string; when: string; meet: string; appUrl: string; type: string }) {
  const heading = opts.type === "1h" ? "⏰ یک ساعت تا شروع جلسه زنده" : "🔴 جلسه ۱۵ دقیقه دیگر شروع می‌شود";
  return `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a;line-height:1.9">
<h2 style="margin:0 0 12px">${heading}</h2>
<p>${opts.name ? opts.name + " جان، " : ""}سلام 🌸</p>
<p>جلسه <b>${opts.title}</b> از دوره <b>${opts.program}</b> به‌زودی شروع می‌شود.</p>
<p style="direction:ltr;text-align:right;background:#fff4ec;padding:12px;border-radius:12px">${opts.when}</p>
<p>برای ورود مستقیم، روی دکمه زیر بزنید (نیازی به باز کردن اپ نیست):</p>
<p style="text-align:center;margin:24px 0"><a href="${opts.meet}" style="background:#16a34a;color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:bold;display:inline-block">ورود به گوگل میت</a></p>
<p style="text-align:center"><a href="${opts.appUrl}" style="color:#c2410c">مشاهده در اپلیکیشن ریلو</a></p>
<p style="font-size:13px;color:#555">اگر دکمه کار نکرد، این لینک را کپی کنید:<br><span style="direction:ltr;display:inline-block">${opts.meet}</span></p>
<p>سؤالی دارید؟ همین ایمیل را جواب بدهید.</p>
</div>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY missing");
    const resend = new Resend(resendKey);

    const now = Date.now();
    const { data: sessions, error } = await supabase
      .from("program_sessions")
      .select("id, title, session_date, meeting_link, round_id, program_rounds(id, round_name, program_slug, google_meet_link)")
      .gte("session_date", new Date(now - 5 * 60_000).toISOString())
      .lte("session_date", new Date(now + 65 * 60_000).toISOString())
      .eq("status", "scheduled");
    if (error) throw error;

    let sent = 0;
    for (const s of sessions || []) {
      const round: any = (s as any).program_rounds;
      const meet = s.meeting_link || round?.google_meet_link;
      if (!round || !meet) continue;
      const start = new Date(s.session_date);
      const minsUntil = (start.getTime() - now) / 60_000;
      const type = TYPES.find((t) => minsUntil > t.minMin && minsUntil <= t.maxMin);
      if (!type) continue;

      const marker = `sent_session_email_${s.id}_${type.key}`;
      const { data: existing } = await supabase.from("app_settings").select("id").eq("key", marker).maybeSingle();
      if (existing) continue;
      const { error: markErr } = await supabase.from("app_settings").insert({
        key: marker, value: new Date().toISOString(), description: "Session reminder email dedupe marker",
      });
      if (markErr) continue; // another run claimed it

      const { data: program } = await supabase.from("program_catalog").select("title").eq("slug", round.program_slug).maybeSingle();
      const { data: enrollments } = await supabase.from("course_enrollments").select("user_id").eq("round_id", round.id).eq("status", "active");
      const userIds = [...new Set((enrollments || []).map((e: any) => e.user_id).filter(Boolean))];
      if (!userIds.length) continue;

      const { data: prefs } = await supabase.from("user_notification_preferences").select("user_id, session_reminders").in("user_id", userIds);
      const off = new Set((prefs || []).filter((p: any) => p.session_reminders === false).map((p: any) => p.user_id));
      const ids = userIds.filter((u) => !off.has(u));

      const recipients = new Map<string, string>(); // email -> name
      for (let i = 0; i < ids.length; i += 500) {
        const chunk = ids.slice(i, i + 500);
        const { data: profiles } = await supabase.from("profiles").select("id, email, full_name").in("id", chunk);
        const names = new Map((profiles || []).map((p: any) => [p.id, (p.full_name || "").split(" ")[0]]));
        (profiles || []).forEach((p: any) => p.email && recipients.set(p.email.trim().toLowerCase(), names.get(p.id) || ""));
        const { data: aliases } = await supabase.from("account_email_aliases").select("email, primary_user_id").in("primary_user_id", chunk);
        (aliases || []).forEach((a: any) => {
          const k = String(a.email || "").trim().toLowerCase();
          if (k && !recipients.has(k)) recipients.set(k, names.get(a.primary_user_id) || "");
        });
      }
      const optedOut = await fetchUnsubscribed(supabase, [...recipients.keys()]);

      const when = `${fmt(start, "America/Los_Angeles")} (Los Angeles) · ${fmt(start, "America/New_York")} (New York) · ${fmt(start, "Europe/London")} (London)`;
      const subject = type.key === "1h" ? `⏰ یک ساعت تا جلسه زنده: ${s.title}` : `🔴 ۱۵ دقیقه تا شروع: ${s.title} — لینک ورود`;
      const appUrl = `https://ladybosslook.com/app/programs/${round.program_slug}`;

      for (const [email, name] of recipients) {
        if (optedOut.has(email)) continue;
        try {
          const unsub = await buildUnsubUrl(email);
          const r = await resend.emails.send({
            from: "Ladyboss Academy <support@ladybosslook.com>",
            reply_to: "support@ladybosslook.com",
            to: [email],
            subject,
            html: appendUnsubFooter(html({ name, program: program?.title || round.round_name, title: s.title, when, meet, appUrl, type: type.key }), unsub),
            headers: unsubHeaders(unsub),
          } as any);
          if (r.data?.id) sent++;
        } catch (e) {
          console.error("email error", e);
        }
        await new Promise((res) => setTimeout(res, 120)); // stay under provider rate limit
      }
      console.log(`Session ${s.id} ${type.key}: ${recipients.size} recipients`);
    }

    return new Response(JSON.stringify({ success: true, sent }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
