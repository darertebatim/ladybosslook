// Student-facing Calendly helper.
// action "sync": pulls this student's bookings for a program straight from Calendly and saves them.
// action "link": returns a single-use booking link, only if the student has meetings left.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { notifyNewBookings } from "../_shared/one-on-one-chat.ts";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/calendly";
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const norm = (s: string) => s.trim().toLowerCase().replace(/\/+$/, "").split("?")[0];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: u } = await admin.auth.getUser(token);
    if (!u?.user) return json({ error: "not_authenticated" }, 401);
    const user = u.user;

    const { action, programSlug } = await req.json();
    if (!programSlug || typeof programSlug !== "string") return json({ error: "missing_program" }, 400);

    const { data: program } = await admin.from("program_catalog")
      .select("slug, booking_url, one_on_one_count, includes_one_on_one, is_one_on_one")
      .eq("slug", programSlug).maybeSingle();
    if (!program?.booking_url) return json({ error: "no_booking_link" }, 400);
    const included = program.one_on_one_count || 1;

    const headers = {
      Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      "X-Connection-Api-Key": Deno.env.get("CALENDLY_API_KEY") ?? "",
      "Content-Type": "application/json",
    };
    const gget = async (path: string) => {
      const r = await fetch(path.startsWith("http") ? path.replace("https://api.calendly.com", GATEWAY_URL) : `${GATEWAY_URL}${path}`, { headers });
      if (!r.ok) throw new Error(`calendly [${r.status}]: ${await r.text()}`);
      return r.json();
    };

    const me = (await gget("/users/me")).resource;
    // Resolve the program's event type from its booking link
    const ets = await gget(`/event_types?user=${encodeURIComponent(me.uri)}&count=100`);
    const et = (ets.collection || []).find((e: any) => norm(e.scheduling_url) === norm(program.booking_url));
    if (!et) return json({ error: "event_type_not_found" }, 400);

    // All of the student's emails (main + merged)
    const emails = new Set<string>([String(user.email || "").toLowerCase()]);
    const { data: aliases } = await admin.from("account_email_aliases").select("email").eq("primary_user_id", user.id);
    (aliases || []).forEach((a: any) => a.email && emails.add(String(a.email).toLowerCase()));

    // Sync from Calendly
    const seen = new Set<string>();
    for (const email of emails) {
      if (!email) continue;
      const q = new URLSearchParams({ user: me.uri, invitee_email: email, count: "100" });
      const evs = await gget(`/scheduled_events?${q}`);
      for (const se of evs.collection || []) {
        if (se.event_type !== et.uri) continue;
        const inv = await gget(`${se.uri}/invitees?email=${encodeURIComponent(email)}`);
        for (const i of inv.collection || []) {
          seen.add(i.uri);
          const status = i.status === "canceled" || se.status === "canceled" ? (i.rescheduled ? "rescheduled" : "canceled") : "active";
          await admin.from("one_on_one_bookings").upsert({
            calendly_invitee_uri: i.uri,
            calendly_event_uri: se.uri,
            event_type_uri: se.event_type,
            event_name: se.name,
            invitee_email: email,
            invitee_name: i.name ?? null,
            user_id: user.id,
            program_slug: programSlug,
            start_time: se.start_time,
            end_time: se.end_time,
            join_url: se.location?.join_url ?? null,
            cancel_url: i.cancel_url ?? null,
            reschedule_url: i.reschedule_url ?? null,
            status,
            updated_at: new Date().toISOString(),
          }, { onConflict: "calendly_invitee_uri" });
        }
      }
    }

    await notifyNewBookings(admin, user.id);

    const { data: bookings } = await admin.from("one_on_one_bookings")
      .select("id, start_time, end_time, join_url, reschedule_url, status")
      .eq("user_id", user.id).eq("program_slug", programSlug).eq("status", "active");
    const used = (bookings || []).length;

    if (action !== "link") return json({ ok: true, used, included, bookings });

    if (used >= included) return json({ error: "limit_reached", used, included }, 409);

    const r = await fetch(`${GATEWAY_URL}/scheduling_links`, {
      method: "POST", headers,
      body: JSON.stringify({ max_event_count: 1, owner: et.uri, owner_type: "EventType" }),
    });
    const text = await r.text();
    if (!r.ok) return json({ error: "link_failed", status: r.status, details: text }, 502);
    const link = new URL(JSON.parse(text).resource.booking_url);
    const name = (user.user_metadata as any)?.full_name;
    if (name) link.searchParams.set("name", name);
    if (user.email) link.searchParams.set("email", user.email);
    link.searchParams.set("utm_campaign", "rilo");
    link.searchParams.set("utm_content", programSlug);
    link.searchParams.set("utm_term", user.id);
    return json({ ok: true, url: link.toString(), used, included });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
