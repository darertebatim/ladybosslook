// Public unsubscribe endpoint for marketing emails.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sign(email: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(email));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

function page(title: string, body: string, ok = true) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#f6f6f7;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:520px;margin:12vh auto;background:#fff;border-radius:16px;padding:32px;text-align:center;">
<h1 style="font-size:20px;color:#111;margin:0 0 12px;">${title}</h1>
<p style="color:#555;font-size:15px;line-height:1.7;margin:0;">${body}</p>
<p style="margin-top:24px;"><a href="https://ladybosslook.com" style="color:${ok ? "#EA5B2B" : "#888"};text-decoration:none;">ladybosslook.com</a></p>
</div></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const email = (url.searchParams.get("e") || "").trim().toLowerCase();
  const token = (url.searchParams.get("t") || "").trim();

  const html = (t: string, b: string, ok = true) =>
    new Response(page(t, b, ok), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });

  if (!email.includes("@") || !token) return html("Invalid link", "This unsubscribe link is not valid.", false);
  if (token !== (await sign(email))) return html("Invalid link", "This unsubscribe link is not valid.", false);

  const { error } = await supabase
    .from("email_unsubscribes")
    .upsert({ email, source: "email_link" }, { onConflict: "email" });

  if (error) {
    console.error("[UNSUBSCRIBE] error", error.message);
    return html("Something went wrong", "Please try again in a moment.", false);
  }

  return html(
    "You're unsubscribed",
    `<strong>${email}</strong> will no longer receive marketing emails from us.`,
  );
});
