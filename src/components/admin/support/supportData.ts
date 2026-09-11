import { supabase } from "@/integrations/supabase/client";

export interface MessageButton {
  label: string;
  url: string;
}

export interface SupportConversation {
  id: string;
  user_id: string;
  status: string;
  unread_count_admin: number;
  last_message_at: string;
  created_at: string;
  assigned_to?: string | null;
  resolved_at?: string | null;
  display_name?: string | null;
  email?: string | null;
  phone?: string | null;
  last_message?: string | null;
  last_sender_type?: string | null;
  programs?: string[];
  /** Round keys in the form "slug::Round label" */
  rounds?: string[];
  orders_count?: number;
  total_spent?: number;
  /** legacy shape kept for compatibility with older callers */
  profiles?: { full_name: string | null; email: string };
}

const PROGRAM_LABELS: Record<string, string> = {
  "simora-plus": "Rilo Plus",
};

export function getProgramLabel(slug: string): string {
  return (
    PROGRAM_LABELS[slug] ||
    slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
  );
}

export function conversationName(c: SupportConversation): string {
  return (
    c.display_name?.trim() ||
    c.profiles?.full_name?.trim() ||
    c.email?.split("@")[0] ||
    c.profiles?.email?.split("@")[0] ||
    "Unknown User"
  );
}

export function conversationEmail(c: SupportConversation): string {
  return c.email || c.profiles?.email || "";
}

/** Loads every support/coach conversation with resolved identity in one round trip. */
export async function fetchSupportConversations(
  inbox: "support" | "coach"
): Promise<SupportConversation[]> {
  const { data, error } = await (supabase as any).rpc("admin_support_conversations", {
    _inbox: inbox,
  });
  if (error) throw error;
  return ((data || []) as SupportConversation[]).map((c) => ({
    ...c,
    programs: c.programs || [],
    rounds: c.rounds || [],
    profiles: {
      full_name: c.display_name ?? null,
      email: c.email ?? "",
    },
  }));
}

/** Replaces {first_name} / {name} / {email} placeholders in a ready message. */
export function expandPlaceholders(text: string, c?: SupportConversation | null): string {
  if (!c) return text;
  const name = conversationName(c);
  const first = name.split(" ")[0];
  return text
    .replace(/\{first_name\}/g, first)
    .replace(/\{name\}/g, name)
    .replace(/\{email\}/g, conversationEmail(c));
}
