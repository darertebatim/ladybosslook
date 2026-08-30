// Resend webhook receiver: records delivery/open/click/bounce events so we can
// compute open rates inside the admin panel.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function verifySvix(
  secret: string,
  id: string,
  timestamp: string,
  signatureHeader: string,
  payload: string,
): Promise<boolean> {
  try {
    const base64Secret = secret.startsWith("whsec_") ? secret.slice(6) : secret;
    const keyBytes = Uint8Array.from(atob(base64Secret), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signed = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(`${id}.${timestamp}.${payload}`),
    );
    const expected = btoa(String.fromCharCode(...new Uint8Array(signed)));
    return signatureHeader
      .split(" ")
      .map((p) => p.split(",").pop() ?? "")
      .some((sig) => sig === expected);
  } catch (_e) {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const raw = await req.text();
    const secret = Deno.env.get("RESEND_WEBHOOK_SECRET");

    if (secret) {
      const id = req.headers.get("svix-id") ?? "";
      const ts = req.headers.get("svix-timestamp") ?? "";
      const sig = req.headers.get("svix-signature") ?? "";
      const ok = id && ts && sig && (await verifySvix(secret, id, ts, sig, raw));
      if (!ok) {
        console.error("[RESEND-WEBHOOK] invalid signature");
        return new Response(JSON.stringify({ error: "invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body = JSON.parse(raw);
    const type: string = body?.type ?? "unknown"; // e.g. email.opened
    const data = body?.data ?? {};
    const eventType = type.replace(/^email\./, "");
    const recipients: string[] = Array.isArray(data.to)
      ? data.to
      : data.to
        ? [data.to]
        : [];

    const rows = (recipients.length ? recipients : [null]).map((to) => ({
      resend_email_id: data.email_id ?? null,
      event_type: eventType,
      recipient: to ? String(to).toLowerCase() : null,
      subject: data.subject ?? null,
      tags: data.tags ?? {},
      occurred_at: body?.created_at ?? data.created_at ?? new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("email_delivery_events")
      .upsert(rows, {
        onConflict: "resend_email_id,event_type",
        ignoreDuplicates: true,
      });

    if (error) console.error("[RESEND-WEBHOOK] insert error", error.message);
    else console.log("[RESEND-WEBHOOK] ✓", eventType, recipients.join(","));

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[RESEND-WEBHOOK] error", err?.message || err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
