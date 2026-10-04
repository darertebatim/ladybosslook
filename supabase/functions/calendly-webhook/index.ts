import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { notifyNewBookings } from "../_shared/one-on-one-chat.ts";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/calendly";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function hmacHex(key: string, msg: string) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const norm = (u?: string | null) => (u || "").split("?")[0].replace(/\/+$/, "").toLowerCase();

async function gatewayGet(uri: string) {
  const path = uri.replace("https://api.calendly.com", "");
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      "X-Connection-Api-Key": Deno.env.get("CALENDLY_API_KEY") ?? "",
    },
  });
  if (!res.ok) {
    console.error(`Gateway GET ${path} failed [${res.status}]: ${await res.text()}`);
    return null;
  }
  return (await res.json())?.resource ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  const raw = await req.text();
  const signingKey = Deno.env.get("CALENDLY_WEBHOOK_SIGNING_KEY");
  const header = req.headers.get("Calendly-Webhook-Signature") || "";
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  if (!signingKey || !parts.t || !parts.v1) return json({ error: "unsigned" }, 401);
  const expected = await hmacHex(signingKey, `${parts.t}.${raw}`);
  if (expected !== parts.v1) return json({ error: "bad signature" }, 401);

  const body = JSON.parse(raw);
  const event: string = body.event;
  const p = body.payload || {};
  if (!["invitee.created", "invitee.canceled"].includes(event)) return json({ ok: true, ignored: event });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const inviteeUri: string = p.uri;
  const email = String(p.email || "").toLowerCase().trim();

  if (event === "invitee.canceled") {
    // A reschedule cancels the old invitee and creates a new one — mark the old as canceled either way.
    await admin.from("one_on_one_bookings")
      .update({ status: p.rescheduled ? "rescheduled" : "canceled", updated_at: new Date().toISOString() })
      .eq("calendly_invitee_uri", inviteeUri);
    return json({ ok: true });
  }

  // Scheduled event details
  let se = p.scheduled_event;
  if (!se || typeof se === "string") se = await gatewayGet(typeof se === "string" ? se : p.event);
  const eventTypeUri: string | undefined = se?.event_type;

  // Program: prefer tracking tag from Rilo link, else match event type's link
  const tracking = p.tracking || {};
  let programSlug: string | null = tracking.utm_campaign === "rilo" ? tracking.utm_content || null : null;
  if (!programSlug && eventTypeUri) {
    const et = await gatewayGet(eventTypeUri);
    if (et?.scheduling_url) {
      const { data: progs } = await admin.from("program_catalog").select("slug, booking_url").not("booking_url", "is", null);
      programSlug = (progs || []).find((pr: any) => norm(pr.booking_url) === norm(et.scheduling_url))?.slug ?? null;
    }
  }

  // User: tracking tag (validated against email), else email / merged emails
  let userId: string | null = null;
  const { data: prof } = await admin.from("profiles").select("id").ilike("email", email).maybeSingle();
  userId = prof?.id ?? null;
  if (!userId) {
    const { data: alias } = await admin.from("account_email_aliases").select("primary_user_id").ilike("email", email).maybeSingle();
    userId = alias?.primary_user_id ?? null;
  }
  if (!userId && tracking.utm_term) {
    const { data: p2 } = await admin.from("profiles").select("id").eq("id", tracking.utm_term).maybeSingle();
    userId = p2?.id ?? null;
  }

  const { error } = await admin.from("one_on_one_bookings").upsert({
    calendly_invitee_uri: inviteeUri,
    calendly_event_uri: se?.uri ?? p.event ?? null,
    event_type_uri: eventTypeUri ?? null,
    event_name: se?.name ?? null,
    invitee_email: email,
    invitee_name: p.name ?? null,
    user_id: userId,
    program_slug: programSlug,
    start_time: se?.start_time ?? null,
    end_time: se?.end_time ?? null,
    join_url: se?.location?.join_url ?? null,
    cancel_url: p.cancel_url ?? null,
    reschedule_url: p.reschedule_url ?? null,
    status: "active",
    updated_at: new Date().toISOString(),
  }, { onConflict: "calendly_invitee_uri" });
  if (error) {
    console.error("upsert failed", error);
    return json({ error: error.message }, 500);
  }
  await notifyNewBookings(admin, userId);
  return json({ ok: true, userId, programSlug });
});
