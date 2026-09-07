import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const resend = new Resend(RESEND_API_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ButtonInput {
  label?: string;
  url?: string;
}

interface Body {
  subject?: string;
  message?: string;
  buttons?: ButtonInput[];
  sources?: string[];
  excludeSources?: string[];
  rtl?: boolean;
  testEmail?: string;
  preheader?: string;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const safeUrl = (u: string) => (/^https?:\/\//i.test(u.trim()) ? u.trim() : "");

function buildHtml(opts: {
  subject: string;
  message: string;
  buttons: { label: string; url: string }[];
  rtl: boolean;
  preheader: string;
}) {
  const dir = opts.rtl ? "rtl" : "ltr";
  const align = opts.rtl ? "right" : "left";
  const font = opts.rtl
    ? "Tahoma, 'Iranian Sans', Arial, sans-serif"
    : "Arial, Helvetica, sans-serif";
  const body = esc(opts.message)
    .split(/\n{2,}/)
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.9;color:#333;text-align:${align};">${p.replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
  const buttons = opts.buttons
    .map(
      (b) =>
        `<tr><td align="center" style="padding:6px 0;"><a href="${esc(b.url)}" style="display:inline-block;background:#EA5B2B;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 28px;border-radius:12px;">${esc(b.label)}</a></td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html dir="${dir}">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#f6f6f7;font-family:${font};">
    <span style="display:none;font-size:0;line-height:0;opacity:0;">${esc(opts.preheader)}</span>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f7;padding:24px 12px;">
      <tr><td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
          <tr><td style="padding:28px 28px 8px;" dir="${dir}">
            <h1 style="margin:0 0 18px;font-size:22px;line-height:1.5;color:#111;text-align:${align};">${esc(opts.subject)}</h1>
            ${body}
          </td></tr>
          ${buttons ? `<tr><td style="padding:8px 28px 24px;"><table width="100%" cellpadding="0" cellspacing="0">${buttons}</table></td></tr>` : ""}
          <tr><td style="padding:16px 28px 28px;border-top:1px solid #eee;text-align:center;color:#8a8a8a;font-size:12px;line-height:1.7;">
            Rilo App (Ladybosslook LLC.)<br>
            <a href="https://ladybosslook.com" style="color:#EA5B2B;text-decoration:none;">ladybosslook.com</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

async function collectEmails(supabase: any, sources: string[]): Promise<Set<string>> {
  const set = new Set<string>();
  if (!sources.length) return set;
  for (let page = 0; page < 30; page++) {
    const { data, error } = await supabase
      .from("form_submissions")
      .select("email")
      .in("source", sources)
      .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    for (const r of data || []) {
      const e = String(r.email || "").trim().toLowerCase();
      if (e.includes("@")) set.add(e);
    }
    if (!data || data.length < 1000) break;
  }
  return set;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!RESEND_API_KEY) throw new Error("Email service not configured");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = (await req.json()) as Body;
    const subject = String(body.subject || "").trim();
    const message = String(body.message || "").trim();
    if (!subject || subject.length > 200) throw new Error("Subject is required (max 200 chars)");
    if (!message || message.length > 20000) throw new Error("Message is required (max 20000 chars)");

    const buttons = (body.buttons || [])
      .map((b) => ({ label: String(b.label || "").trim().slice(0, 60), url: safeUrl(String(b.url || "")) }))
      .filter((b) => b.label && b.url)
      .slice(0, 3);

    const html = buildHtml({
      subject,
      message,
      buttons,
      rtl: !!body.rtl,
      preheader: String(body.preheader || "").slice(0, 160),
    });

    let recipients: string[] = [];
    if (body.testEmail) {
      const t = String(body.testEmail).trim().toLowerCase();
      if (!t.includes("@")) throw new Error("Invalid test email");
      recipients = [t];
    } else {
      const sources = (body.sources || []).map(String).filter(Boolean);
      if (!sources.length) throw new Error("Pick at least one audience");
      const include = await collectEmails(supabase, sources);
      const exclude = await collectEmails(supabase, (body.excludeSources || []).map(String).filter(Boolean));
      for (const e of exclude) include.delete(e);
      recipients = Array.from(include);
    }

    if (!recipients.length) {
      return new Response(JSON.stringify({ success: true, sent: 0, failed: 0, total: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let sent = 0;
    let failed = 0;
    const batchSize = 20;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(async (email) => {
          const res = await resend.emails.send({
            from: "Ladyboss <support@ladybosslook.com>",
            to: [email],
            subject,
            html,
          });
          if ((res as any)?.error) throw new Error(JSON.stringify((res as any).error));
          await supabase.from("email_logs").insert({
            recipient_email: email,
            status: "success",
            resend_id: (res as any)?.data?.id ?? null,
          });
          return true;
        }),
      );
      for (const r of results) {
        if (r.status === "fulfilled") sent++;
        else {
          failed++;
          console.error("send failed:", (r as PromiseRejectedResult).reason);
        }
      }
      if (i + batchSize < recipients.length) await new Promise((r) => setTimeout(r, 600));
    }

    return new Response(JSON.stringify({ success: true, sent, failed, total: recipients.length }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("send-lead-email error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
