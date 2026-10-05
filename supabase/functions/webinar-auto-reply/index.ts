import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-timezone",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "content-type": "application/json" } });

const TRIGGER = "در وبینار اینستاگرام ادز ثبت‌نام کرده‌ام";
const APP_LINK = "https://ladyboss.onelink.me/lt6v?pid=webinar&c=igads_support";
const FA_DAYS: Record<string, string> = {
  Sunday: "یکشنبه", Monday: "دوشنبه", Tuesday: "سه‌شنبه", Wednesday: "چهارشنبه",
  Thursday: "پنجشنبه", Friday: "جمعه", Saturday: "شنبه",
};

function fmt(d: Date, tz: string, opts: Intl.DateTimeFormatOptions) {
  try { return new Intl.DateTimeFormat("en-US", { timeZone: tz, ...opts }).format(d); }
  catch { return new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", ...opts }).format(d); }
}
const gcalStamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") || "";
    const url = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } }, auth: { persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { conversationId, timezone } = await req.json().catch(() => ({}));
    const { data: conv } = await admin.from("chat_conversations")
      .select("id, user_id, unread_count_user").eq("id", conversationId).maybeSingle();
    if (!conv || conv.user_id !== user.id) return json({ sent: false });

    // Latest user message must be the webinar request
    const { data: last } = await admin.from("chat_messages").select("content")
      .eq("conversation_id", conv.id).eq("sender_type", "user")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!last?.content?.includes(TRIGGER)) return json({ sent: false });

    // Don't reply twice within 6 hours
    const since = new Date(Date.now() - 6 * 3600_000).toISOString();
    const { data: prior } = await admin.from("chat_messages").select("id")
      .eq("conversation_id", conv.id).eq("sender_type", "admin")
      .ilike("content", "%جای شما در جلسه زنده رزرو است%").gte("created_at", since).limit(1).maybeSingle();
    if (prior) return json({ sent: false, reason: "duplicate" });

    // Find their registration (by message email, account email, or merged emails)
    const emails = new Set<string>();
    const m = last.content.match(/ایمیل:\s*(\S+@\S+)/);
    if (m) emails.add(m[1].toLowerCase().trim());
    if (user.email) emails.add(user.email.toLowerCase());
    const { data: aliases } = await admin.from("account_email_aliases").select("email").eq("user_id", user.id);
    (aliases || []).forEach((a: any) => a.email && emails.add(a.email.toLowerCase()));

    const { data: reg } = await admin.from("form_submissions").select("name, round_id")
      .in("email", [...emails]).eq("source", "igads_registration")
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!reg?.round_id) return json({ sent: false, reason: "no_registration" });

    const { data: round } = await admin.from("program_rounds")
      .select("first_session_date, first_session_duration, google_meet_link").eq("id", reg.round_id).maybeSingle();
    if (!round?.first_session_date) return json({ sent: false, reason: "no_round" });
    const start = new Date(round.first_session_date);
    if (start.getTime() + 3 * 3600_000 < Date.now()) return json({ sent: false, reason: "past" });

    let tz = typeof timezone === "string" && timezone ? timezone : "";
    if (!tz) {
      const { data: s } = await admin.from("journal_reminder_settings").select("timezone").eq("user_id", user.id).maybeSingle();
      tz = s?.timezone || "America/Los_Angeles";
    }
    const weekdayEn = fmt(start, tz, { weekday: "long" });
    const date = fmt(start, tz, { month: "long", day: "numeric" });
    const time = fmt(start, tz, { hour: "numeric", minute: "2-digit" });
    const city = tz.split("/").pop()!.replace(/_/g, " ");
    const name = (reg.name || "").trim() || "دوست";
    const duration = round.first_session_duration || 120;

    const content =
      `سلام ${name} عزیز، وقت بخیر 🌷\n\n` +
      `ثبت‌نام شما در وبینار رایگان «جذب مشتری با تبلیغات اینستاگرام» تایید شد و جای شما در جلسه زنده رزرو است.\n\n` +
      `📅 زمان برگزاری به وقت شما:\n` +
      `• روز: ${FA_DAYS[weekdayEn] || weekdayEn}، ${date}\n` +
      `• ساعت محلی شما: ${time} (${city})\n` +
      `• مدت جلسه: ${duration} دقیقه — لایو در Google Meet\n\n` +
      `🔗 لینک ورود به جلسه، نیم ساعت قبل از شروع به ایمیل شما ارسال می‌شود (پوشه اسپم را هم چک کنید).\n\n` +
      `📱 برای دریافت یادآوری‌ها و پیام‌های جلسه، حتماً اپلیکیشن Rilo را نصب کنید:\n${APP_LINK}\n\n` +
      `منتظر دیدن شما در لایو هستیم 💛`;

    const end = new Date(start.getTime() + duration * 60_000);
    const gcal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      "وبینار جذب مشتری با اینستاگرام ادز",
    )}&dates=${gcalStamp(start)}/${gcalStamp(end)}`;
    const buttons = [
      { label: "📱 دانلود اپلیکیشن Rilo", url: APP_LINK },
      { label: "📅 افزودن به Google Calendar", url: gcal },
      { label: "🎬 ویدیوی پیش‌نیاز وبینار", url: `https://ladybosslook.com/l/igadsfree/thankyou?round=${reg.round_id}` },
    ];

    const { data: sender } = await admin.from("user_roles").select("user_id").eq("role", "admin").limit(1).maybeSingle();
    if (!sender) return json({ sent: false });
    const { error } = await admin.from("chat_messages").insert({
      conversation_id: conv.id, sender_id: sender.user_id, sender_type: "admin", content, buttons, is_read: false,
    });
    if (error) throw error;
    await admin.from("chat_conversations").update({
      last_message_at: new Date().toISOString(), unread_count_user: (conv.unread_count_user || 0) + 1,
    }).eq("id", conv.id);
    try {
      await admin.functions.invoke("send-chat-notification", {
        body: { conversationId: conv.id, messageContent: "✅ جزئیات وبینار شما", senderType: "admin", senderId: sender.user_id },
      });
    } catch (_) { /* ignore */ }
    return json({ sent: true });
  } catch (e) {
    console.error("[webinar-auto-reply]", e);
    return json({ error: String(e) }, 500);
  }
});
