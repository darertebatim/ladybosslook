// Admin/internal helper: fetch a sent email's content from Resend by its
// resend_id (stored in email_logs). Used to recover historical campaign copy.
// POST { "resend_id": "..." } -> { subject, html, text }
import { isInternalOrAdmin, deny } from "../_shared/caller-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!(await isInternalOrAdmin(req))) return deny(corsHeaders);
    if (!RESEND_API_KEY) throw new Error("Email service not configured");

    const body = await req.json().catch(() => ({}));
    const id = String(body?.resend_id || "").trim();
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return new Response(JSON.stringify({ error: "invalid resend_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(`https://api.resend.com/emails/${id}`, {
      headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return new Response(JSON.stringify({ error: json?.message || `Resend ${res.status}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ subject: json?.subject ?? null, html: json?.html ?? null, text: json?.text ?? null }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("get-sent-email-content error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
