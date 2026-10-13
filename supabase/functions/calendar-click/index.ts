import { createClient } from "npm:@supabase/supabase-js@2";

const UUID_RE = /^[0-9a-f-]{36}$/i;
const FALLBACK = "https://calendar.google.com/";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const to = url.searchParams.get("to") || "";
  // Only ever redirect to Google Calendar (no open redirect).
  let dest = FALLBACK;
  try {
    const u = new URL(to);
    if (u.protocol === "https:" && u.hostname === "calendar.google.com") dest = u.toString();
  } catch { /* fallback */ }

  try {
    const page = (url.searchParams.get("p") || "email").slice(0, 40);
    const r = url.searchParams.get("r");
    const e = (url.searchParams.get("e") || "").trim().toLowerCase().slice(0, 320);
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await sb.from("webinar_calendar_clicks").insert({
      calendar: "google",
      page,
      round_id: r && UUID_RE.test(r) ? r : null,
      email: e && e.includes("@") ? e : null,
    });
  } catch (err) {
    console.error("calendar-click log failed", err);
  }

  return new Response(null, { status: 302, headers: { Location: dest, "Cache-Control": "no-store" } });
});
