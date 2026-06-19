import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ChatRow {
  id: string;
  title: string;
  last_message_at: string;
  created_at: string;
  archived: boolean;
  entry_point?: string;
  bucket_slug?: string | null;
}

export interface MessageRow {
  id: string;
  chat_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  attachments?: Array<{
    file_id: string;
    storage_path: string;
    mime: string;
    name: string;
    size: number;
  }>;
}

export type ChatEntryPoint = "general_chat" | "memory_general" | "bucket_specific";

export interface CreateChatOptions {
  title?: string;
  entry_point?: ChatEntryPoint;
  bucket_slug?: string | null;
  /**
   * Pre-composed opener text. When omitted, the static general-chat
   * opener is used. Callers building memory_general / bucket_specific
   * chats should compose this from already-loaded buckets+items.
   */
  opener?: string;
}

/** List + create + delete chats for the current user. */
export function useApertureChatsDB() {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setChats([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("aperture_chats")
      .select("id,title,last_message_at,created_at,archived,entry_point,bucket_slug")
      .eq("user_id", user.id)
      .eq("archived", false)
      .order("last_message_at", { ascending: false });
    setChats((data ?? []) as ChatRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

const DEFAULT_OPENER = `What would you like to work on today?

[OPTIONS]
- My customers and market
- What I sell and how I price it
- Getting new clients
- My finances and profit
- My team and how I run things
- Where I want to take this business
[/OPTIONS]`;

  const createChat = useCallback(async (
    arg?: string | CreateChatOptions,
  ): Promise<ChatRow | null> => {
    if (!user) return null;
    const opts: CreateChatOptions = typeof arg === "string" || arg === undefined
      ? { title: typeof arg === "string" ? arg : "New chat" }
      : arg;
    const title = opts.title?.trim() || "New chat";
    const entry_point: ChatEntryPoint = opts.entry_point ?? "general_chat";
    const bucket_slug = opts.bucket_slug ?? null;

    const { data, error } = await supabase
      .from("aperture_chats")
      .insert({ user_id: user.id, title, entry_point, bucket_slug })
      .select("id,title,last_message_at,created_at,archived,entry_point,bucket_slug")
      .single();
    if (error || !data) return null;

    // Pre-seed the opening assistant message so the opener appears instantly
    // and stays in thread history when the user scrolls back later.
    const opener = opts.opener?.trim() || DEFAULT_OPENER;
    await supabase.from("aperture_messages").insert({
      chat_id: data.id,
      user_id: user.id,
      role: "assistant",
      content: opener,
    });

    // Log a bucket signal for memory-building chats so the (future)
    // relevance scorer has something to learn from. Fire-and-forget.
    if (entry_point !== "general_chat" && bucket_slug) {
      void supabase.from("aperture_user_bucket_signals").insert({
        user_id: user.id,
        bucket_slug,
        signal_type: "chat_topic",
        meta: { entry_point, chat_id: data.id },
      });
    }

    await refresh();
    return data as ChatRow;
  }, [user, refresh]);

  const renameChat = useCallback(async (id: string, title: string) => {
    if (!user) return;
    await supabase.from("aperture_chats").update({ title })
      .eq("id", id).eq("user_id", user.id);
    await refresh();
  }, [user, refresh]);

  const deleteChat = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from("aperture_chats").delete()
      .eq("id", id).eq("user_id", user.id);
    await refresh();
  }, [user, refresh]);

  return { chats, loading, refresh, createChat, renameChat, deleteChat };
}

/** Subscribes to messages for one chat (initial fetch + realtime). */
export function useApertureChatMessages(chatId: string | undefined) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user || !chatId) { setMessages([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("aperture_messages")
      .select("id,chat_id,role,content,created_at,attachments")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });
    setMessages((data ?? []) as MessageRow[]);
    setLoading(false);
  }, [user, chatId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { messages, setMessages, loading, refresh };
}