// Public redirector for 1-on-1 chat links: signs the student in with a fresh
// one-time link and opens /dashboard/one-on-one/:slug in the browser.
import { createClient } from "npm:@supabase/supabase-js@2";

const WEB_BASE = "https://ladybosslook.com";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("i") || "";
  const redirect = (to: string) => new Response(null, { status: 302, headers: { Location: to } });
  const fallback = `${WEB_BASE}/dashboard/one-on-one`;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return redirect(fallback);
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });
    const { data: inv } = await admin.from("form_invites").select("user_id, form_key, sent_at").eq("id", id).maybeSingle();
    const key = String(inv?.form_key || "");
    if (!inv || !key.startsWith("oneonone:")) return redirect(fallback);
    const slug = key.slice("oneonone:".length).replace(/[^a-z0-9-_]/gi, "");
    const target = `${WEB_BASE}/dashboard/one-on-one/${slug}`;
    const fresh = Date.now() - new Date(inv.sent_at).getTime() < 60 * 24 * 3600 * 1000;
    if (!fresh) return redirect(target);
    const { data: au } = await admin.auth.admin.getUserById(inv.user_id);
    const email = au?.user?.email;
    if (!email) return redirect(target);
    const { data: link } = await admin.auth.admin.generateLink({ type: "magiclink", email, options: { redirectTo: target } });
    return redirect(link?.properties?.action_link || target);
  } catch (e) {
    console.error("redirect failed", e);
    return redirect(fallback);
  }
});
