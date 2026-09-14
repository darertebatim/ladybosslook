// Shared unsubscribe helpers for marketing / lead emails.
// Keeps the token format identical to send-igads-gifts so the public
// /unsubscribe page (email-unsubscribe function) validates every link.

const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

export async function unsubToken(email: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(serviceKey),
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

export async function buildUnsubUrl(email: string): Promise<string> {
  const clean = email.trim().toLowerCase();
  return `https://ladybosslook.com/unsubscribe?e=${encodeURIComponent(clean)}&t=${await unsubToken(clean)}`;
}

export function unsubHeaders(url: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${url}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/** Injects a small RTL unsubscribe footer right before </body>. */
export function appendUnsubFooter(html: string, url: string): string {
  const footer = `
      <div dir="rtl" style="direction:rtl;text-align:center;margin:28px auto 0;padding-top:14px;border-top:1px solid #eee;color:#9ca3af;font-size:12px;line-height:1.8;max-width:600px;">
        Rilo App (Ladybosslook LLC.)<br>
        <a href="${url}" style="color:#9ca3af;text-decoration:underline;">لغو اشتراک ایمیل‌ها</a>
      </div>`;
  return html.includes("</body>")
    ? html.replace("</body>", `${footer}\n  </body>`)
    : html + footer;
}

/** Returns the set of emails (lowercased) that opted out. */
export async function fetchUnsubscribed(
  supabase: any,
  emails: string[],
): Promise<Set<string>> {
  const out = new Set<string>();
  if (!emails.length) return out;
  const chunkSize = 500;
  for (let i = 0; i < emails.length; i += chunkSize) {
    const chunk = emails.slice(i, i + chunkSize).map((e) => e.trim().toLowerCase());
    const { data, error } = await supabase
      .from("email_unsubscribes")
      .select("email")
      .in("email", chunk);
    if (error) {
      console.warn("[unsubscribe] lookup failed", error.message);
      continue;
    }
    for (const row of data || []) out.add(String(row.email).trim().toLowerCase());
  }
  return out;
}
