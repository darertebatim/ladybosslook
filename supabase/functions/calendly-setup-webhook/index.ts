import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/calendly";
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: u } = await admin.auth.getUser(token);
    if (!u?.user) return json({ error: "not_authenticated" }, 401);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "forbidden" }, 403);

    const headers = {
      Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      "X-Connection-Api-Key": Deno.env.get("CALENDLY_API_KEY") ?? "",
      "Content-Type": "application/json",
    };
    const meRes = await fetch(`${GATEWAY_URL}/users/me`, { headers });
    if (!meRes.ok) return json({ error: "calendly_me_failed", status: meRes.status, details: await meRes.text() }, 502);
    const me = (await meRes.json()).resource;
    const callback = `${url}/functions/v1/calendly-webhook`;

    // Remove stale subscriptions pointing to us (they may have an old signing key)
    for (const scope of ["user", "organization"]) {
      const q = new URL(`${GATEWAY_URL}/webhook_subscriptions`);
      q.searchParams.set("organization", me.current_organization);
      q.searchParams.set("scope", scope);
      if (scope === "user") q.searchParams.set("user", me.uri);
      const r = await fetch(q.toString(), { headers });
      if (!r.ok) continue;
      for (const s of (await r.json()).collection || []) {
        if (s.callback_url === callback) {
          await fetch(`${GATEWAY_URL}${s.uri.replace("https://api.calendly.com", "")}`, { method: "DELETE", headers });
        }
      }
    }

    const base = {
      url: callback,
      events: ["invitee.created", "invitee.canceled"],
      organization: me.current_organization,
      signing_key: Deno.env.get("CALENDLY_WEBHOOK_SIGNING_KEY"),
    };
    let res = await fetch(`${GATEWAY_URL}/webhook_subscriptions`, {
      method: "POST", headers, body: JSON.stringify({ ...base, scope: "organization" }),
    });
    if (!res.ok) {
      res = await fetch(`${GATEWAY_URL}/webhook_subscriptions`, {
        method: "POST", headers, body: JSON.stringify({ ...base, scope: "user", user: me.uri }),
      });
    }
    const text = await res.text();
    if (!res.ok) return json({ error: "subscribe_failed", status: res.status, details: text }, res.status);
    return json({ ok: true, subscription: JSON.parse(text).resource?.uri });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
