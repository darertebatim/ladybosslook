// Shared caller verification for edge functions.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const URL_ = () => Deno.env.get("SUPABASE_URL")!;
const SERVICE = () => Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = () => Deno.env.get("SUPABASE_ANON_KEY")!;

function bearer(req: Request): string {
  const h = req.headers.get("Authorization") || req.headers.get("authorization") || "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : "";
}

/** True when the call comes from our own backend (service role) or a scheduled job. */
export async function isInternalCall(req: Request): Promise<boolean> {
  const token = bearer(req);
  if (token && token === SERVICE()) return true;
  const cron = req.headers.get("x-cron-secret");
  if (cron) {
    const admin = createClient(URL_(), SERVICE());
    const { data } = await admin.rpc("verify_cron_secret", { _token: cron });
    if (data === true) return true;
  }
  return false;
}

/** Returns the signed-in user's id, or null. */
export async function getCallerId(req: Request): Promise<string | null> {
  const token = bearer(req);
  if (!token || token === ANON()) return null;
  const client = createClient(URL_(), ANON(), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user.id;
}

export async function isAdminUser(userId: string): Promise<boolean> {
  const admin = createClient(URL_(), SERVICE());
  const { data } = await admin.from("user_roles").select("role")
    .eq("user_id", userId).eq("role", "admin").maybeSingle();
  return !!data;
}

/** Internal call or an admin user. */
export async function isInternalOrAdmin(req: Request): Promise<boolean> {
  if (await isInternalCall(req)) return true;
  const uid = await getCallerId(req);
  return !!uid && (await isAdminUser(uid));
}

export function deny(cors: Record<string, string>, status = 401, msg = "Unauthorized") {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

/** Mask an email for logs: jo***@gmail.com */
export function maskEmail(e?: string | null): string {
  if (!e) return "";
  const [u, d] = String(e).split("@");
  return `${(u || "").slice(0, 2)}***@${d || ""}`;
}

/** Escape text for safe insertion into HTML emails. */
export function escapeHtml(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
