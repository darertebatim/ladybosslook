import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEB_BASE = "https://ladybosslook.com";
const VALID_DAYS = 30;
const PATH_RE = /^\/[A-Za-z0-9\-_/]{0,120}$/;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function sign(payload: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SERVICE_KEY), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // Public redirector: verifies the signed link, then signs the student in with a fresh one-time link.
  if (req.method === "GET") {
    const url = new URL(req.url);
    const u = url.searchParams.get("u") || "";
    const p = url.searchParams.get("p") || "/";
    const e = (url.searchParams.get("e") || "0").replace(/[^0-9]/g, "");
    const s = (url.searchParams.get("s") || "").replace(/[^A-Za-z0-9_-]/g, "");
    const safePath = PATH_RE.test(p) ? p : "/";
    const target = `${WEB_BASE}${safePath}`;
    const redirect = (to: string) => new Response(null, { status: 302, headers: { Location: to } });
    try {
      if (!/^[0-9a-f-]{36}$/i.test(u) || Number(e) < Date.now()) return redirect(target);
      if ((await sign(`${u}|${safePath}|${e}`)) !== s) return redirect(target);
      const { data: au } = await admin.auth.admin.getUserById(u);
      const email = au?.user?.email;
      if (!email) return redirect(target);
      const { data: link } = await admin.auth.admin.generateLink({ type: "magiclink", email, options: { redirectTo: target } });
      return redirect(link?.properties?.action_link || target);
    } catch (err) {
      console.error("redirect failed", err);
      return redirect(target);
    }
  }

  try {
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "").trim();
    const { data: u } = await admin.auth.getUser(token);
    const adminId = u?.user?.id;
    if (!adminId) return json({ error: "Not authenticated" }, 401);
    const [{ data: isAdmin }, { data: canSupport }] = await Promise.all([
      admin.rpc("has_role", { _user_id: adminId, _role: "admin" }),
      admin.rpc("can_access_admin_page", { _user_id: adminId, _page_slug: "support" }),
    ]);
    if (!isAdmin && !canSupport) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const userId = String(body.userId || "");
    const path = String(body.path || "");
    if (!/^[0-9a-f-]{36}$/i.test(userId)) return json({ error: "Invalid user" }, 400);
    if (!PATH_RE.test(path)) return json({ error: "Invalid path" }, 400);

    const exp = String(Date.now() + VALID_DAYS * 24 * 3600 * 1000);
    const s = await sign(`${userId}|${path}|${exp}`);
    const qs = new URLSearchParams({ u: userId, p: path, e: exp, s });
    return json({ url: `${SUPABASE_URL}/functions/v1/support-signin-link?${qs}` });
  } catch (err) {
    console.error("support-signin-link error", err);
    return json({ error: String(err) }, 500);
  }
});
