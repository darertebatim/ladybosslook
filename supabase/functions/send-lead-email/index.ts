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

const SENDER_EMAIL = "support@ladybosslook.com";
const UNSUB_BASE = `${supabaseUrl}/functions/v1/email-unsubscribe`;

interface ButtonInput {
  label?: string;
  url?: string;
}

interface Body {
  subject?: string;
  message?: string;
  signature?: string;
  fromName?: string;
  address?: string;
  buttons?: ButtonInput[];
  sources?: string[];
  excludeSources?: string[];
  programs?: string[];
  excludePrograms?: string[];
  rtl?: boolean;
  testEmail?: string;
  preheader?: string;
  offset?: number;
  limit?: number;
  /** Skip anyone who already received an email with this subject. */
  skipSubject?: string;

}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const safeUrl = (u: string) => (/^https?:\/\//i.test(u.trim()) ? u.trim() : "");

/** Very small allow-list sanitizer for editor HTML. */
function sanitizeHtml(input: string): string {
  return input
    .replace(/<\s*(script|style|iframe|object|embed|form)[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*\/?\s*(script|style|iframe|object|embed|form)[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

function toHtmlBody(message: string, align: string): string {
  const looksHtml = /<[a-z][\s\S]*>/i.test(message);
  if (looksHtml) {
    return `<div style="font-size:16px;line-height:1.9;color:#333;text-align:${align};">${sanitizeHtml(message)}</div>`;
  }
  return esc(message)
    .split(/\n{2,}/)
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.9;color:#333;text-align:${align};">${p.replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
}

async function unsubToken(email: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(supabaseServiceKey),
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

async function unsubUrl(email: string) {
  return `${UNSUB_BASE}?e=${encodeURIComponent(email)}&t=${await unsubToken(email)}`;
}

function buildHtml(opts: {
  subject: string;
  message: string;
  signature: string;
  buttons: { label: string; url: string }[];
  rtl: boolean;
  preheader: string;
  address: string;
  unsubscribeUrl: string;
}) {
  const dir = opts.rtl ? "rtl" : "ltr";
  const align = opts.rtl ? "right" : "left";
  const font = opts.rtl
    ? "Tahoma, 'Iranian Sans', Arial, sans-serif"
    : "Arial, Helvetica, sans-serif";
  const body = toHtmlBody(opts.message, align);
  const buttons = opts.buttons
    .map(
      (b) =>
        `<tr><td align="center" style="padding:6px 0;"><a href="${esc(b.url)}" style="display:inline-block;background:#EA5B2B;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 28px;border-radius:12px;">${esc(b.label)}</a></td></tr>`,
    )
    .join("");
  const signature = opts.signature.trim()
    ? `<tr><td style="padding:4px 28px 24px;" dir="${dir}">
         <div style="font-size:15px;line-height:1.8;color:#444;text-align:${align};">${sanitizeHtml(opts.signature)}</div>
       </td></tr>`
    : "";

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
          ${signature}
          <tr><td style="padding:16px 28px 28px;border-top:1px solid #eee;text-align:center;color:#8a8a8a;font-size:12px;line-height:1.7;">
            Rilo App (Ladybosslook LLC.)<br>
            ${opts.address ? `${esc(opts.address)}<br>` : ""}
            <a href="https://ladybosslook.com" style="color:#EA5B2B;text-decoration:none;">ladybosslook.com</a><br><br>
            You are receiving this email because you signed up on one of our pages.<br>
            <a href="${esc(opts.unsubscribeUrl)}" style="color:#8a8a8a;text-decoration:underline;">Unsubscribe</a>
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

async function collectProgramEmails(supabase: any, slugs: string[]): Promise<Set<string>> {
  const set = new Set<string>();
  if (!slugs.length) return set;
  const userIds = new Set<string>();
  for (let page = 0; page < 30; page++) {
    const { data, error } = await supabase
      .from("course_enrollments")
      .select("user_id, status")
      .in("program_slug", slugs)
      .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    for (const r of data || []) {
      if (!r.status || r.status === "active" || r.status === "completed") {
        if (r.user_id) userIds.add(r.user_id);
      }
    }
    if (!data || data.length < 1000) break;
  }
  const ids = Array.from(userIds);
  for (let i = 0; i < ids.length; i += 500) {
    const { data, error } = await supabase
      .from("profiles")
      .select("email")
      .in("id", ids.slice(i, i + 500));
    if (error) throw error;
    for (const r of data || []) {
      const e = String(r.email || "").trim().toLowerCase();
      if (e.includes("@")) set.add(e);
    }
  }
  return set;
}

async function collectUnsubscribed(supabase: any): Promise<Set<string>> {
  const set = new Set<string>();
  for (let page = 0; page < 30; page++) {
    const { data, error } = await supabase
      .from("email_unsubscribes")
      .select("email")
      .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    for (const r of data || []) set.add(String(r.email || "").trim().toLowerCase());
    if (!data || data.length < 1000) break;
  }
  return set;
}

/** Everyone who already received (sent or delivered) an email with this subject. */
async function collectAlreadySent(supabase: any, subject: string): Promise<Set<string>> {
  const set = new Set<string>();
  if (!subject) return set;
  for (let page = 0; page < 40; page++) {
    const { data, error } = await supabase
      .from("email_delivery_events")
      .select("recipient")
      .eq("subject", subject)
      .in("event_type", ["sent", "delivered"])
      .range(page * 1000, page * 1000 + 999);
    if (error) throw error;
    for (const r of data || []) {
      const e = String(r.recipient || "").trim().toLowerCase();
      if (e) set.add(e);
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
    if (!message || message.length > 60000) throw new Error("Message is required (max 60000 chars)");

    const fromName = (String(body.fromName || "").trim() || "Ali Lotfi").slice(0, 60).replace(/["<>]/g, "");
    const from = `${fromName} <${SENDER_EMAIL}>`;
    const signature = String(body.signature || "").slice(0, 5000);
    const address = String(body.address || "").trim().slice(0, 200);

    const buttons = (body.buttons || [])
      .map((b) => ({ label: String(b.label || "").trim().slice(0, 60), url: safeUrl(String(b.url || "")) }))
      .filter((b) => b.label && b.url)
      .slice(0, 3);

    let recipients: string[] = [];
    if (body.testEmail) {
      const t = String(body.testEmail).trim().toLowerCase();
      if (!t.includes("@")) throw new Error("Invalid test email");
      recipients = [t];
    } else {
      const sources = (body.sources || []).map(String).filter(Boolean);
      const programs = (body.programs || []).map(String).filter(Boolean);
      if (!sources.length && !programs.length) throw new Error("Pick at least one audience");
      const include = await collectEmails(supabase, sources);
      for (const e of await collectProgramEmails(supabase, programs)) include.add(e);
      const exclude = await collectEmails(supabase, (body.excludeSources || []).map(String).filter(Boolean));
      for (const e of await collectProgramEmails(supabase, (body.excludePrograms || []).map(String).filter(Boolean))) exclude.add(e);
      for (const e of await collectUnsubscribed(supabase)) exclude.add(e);
      for (const e of exclude) include.delete(e);
      recipients = Array.from(include).sort();
    }

    const total = recipients.length;
    const offset = Math.max(0, Number(body.offset) || 0);
    const limit = Math.min(Math.max(1, Number(body.limit) || total || 1), 1000);
    const slice = body.testEmail ? recipients : recipients.slice(offset, offset + limit);

    if (!slice.length) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, failed: 0, total, processed: 0, done: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    let sent = 0;
    let failed = 0;

    // Resend allows 10 requests/sec. Use the batch endpoint (up to 100 messages
    // per single request) and pace requests, with retry/back-off on 429.
    const buildPayload = async (email: string) => {
      const unsubscribeUrl = await unsubUrl(email);
      return {
        from,
        to: [email],
        subject,
        html: buildHtml({
          subject,
          message,
          signature,
          buttons,
          rtl: !!body.rtl,
          preheader: String(body.preheader || "").slice(0, 160),
          address,
          unsubscribeUrl,
        }),
        reply_to: SENDER_EMAIL,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      };
    };

    const sendBatch = async (payload: any[]): Promise<{ ids: (string | null)[] } | null> => {
      for (let attempt = 0; attempt < 5; attempt++) {
        const res = await fetch("https://api.resend.com/emails/batch", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (res.status === 429) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          console.error("batch send failed:", res.status, JSON.stringify(json));
          if (res.status >= 500) {
            await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }
          return null;
        }
        const ids = (json?.data ?? []).map((d: any) => d?.id ?? null);
        return { ids };
      }
      return null;
    };

    const batchSize = 100;
    for (let i = 0; i < slice.length; i += batchSize) {
      const batch = slice.slice(i, i + batchSize);
      const payload = await Promise.all(batch.map(buildPayload));
      const result = await sendBatch(payload);
      if (!result) {
        failed += batch.length;
      } else {
        sent += batch.length;
        const logs = batch.map((email, idx) => ({
          recipient_email: email,
          status: "success",
          resend_id: result.ids[idx] ?? null,
        }));
        const { error: logErr } = await supabase.from("email_logs").insert(logs);
        if (logErr) console.error("log insert failed:", logErr.message);
      }
      if (i + batchSize < slice.length) await new Promise((r) => setTimeout(r, 600));
    }


    const processed = slice.length;
    return new Response(
      JSON.stringify({
        success: true,
        sent,
        failed,
        total,
        processed,
        done: !!body.testEmail || offset + processed >= total,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );

  } catch (error: any) {
    console.error("send-lead-email error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
