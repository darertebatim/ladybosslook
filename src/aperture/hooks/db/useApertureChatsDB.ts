import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ChatRow {
  id: string;
  title: string;
  last_message_at: string;
  created_at: string;
  archived: boolean;
}

export interface MessageRow {
  id: string;
  chat_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
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
      .select("id,title,last_message_at,created_at,archived")
      .eq("user_id", user.id)
      .eq("archived", false)
      .order("last_message_at", { ascending: false });
    setChats((data ?? []) as ChatRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

const OPENER_TEXT = `What would you like to work on today?

[OPTIONS]
- My customers and market
- What I sell and how I price it
- Getting new clients
- My finances and profit
- My team and how I run things
- Where I want to take this business
[/OPTIONS]`;

  const createChat = useCallback(async (title = "New chat"): Promise<ChatRow | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("aperture_chats")
      .insert({ user_id: user.id, title })
      .select("id,title,last_message_at,created_at,archived")
      .single();
    if (error || !data) return null;
    // Pre-seed the opening assistant message so the opener appears instantly
    // and stays in thread history when the user scrolls back later.
    await supabase.from("aperture_messages").insert({
      chat_id: data.id,
      user_id: user.id,
      role: "assistant",
      content: OPENER_TEXT,
    });
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
      .select("id,chat_id,role,content,created_at")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });
    setMessages((data ?? []) as MessageRow[]);
    setLoading(false);
  }, [user, chatId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { messages, setMessages, loading, refresh };
}