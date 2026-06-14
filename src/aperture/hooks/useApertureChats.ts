import { useCallback, useEffect, useState } from "react";

/**
 * Local-only chat threads for the design demo.
 * No model is called. Assistant replies are scripted in Chat.tsx.
 */

const STORAGE_KEY = "aperture.chats.v1";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: number;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

function readChats(): ChatThread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ChatThread[]) : [];
  } catch {
    return [];
  }
}
function writeChats(next: ChatThread[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("aperture:chats-changed"));
  } catch { /* noop */ }
}

export function useApertureChats() {
  const [chats, setChats] = useState<ChatThread[]>(() => readChats());

  useEffect(() => {
    const onChange = () => setChats(readChats());
    window.addEventListener("aperture:chats-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("aperture:chats-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const sortedChats = [...chats].sort((a, b) => b.updatedAt - a.updatedAt);

  const getChat = useCallback((id: string) => readChats().find(c => c.id === id), []);

  const createChat = useCallback((seedText?: string, seedTitle?: string): ChatThread => {
    const now = Date.now();
    const id = `c_${now.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const thread: ChatThread = {
      id,
      title: seedTitle ?? (seedText ? seedText.slice(0, 48) : "New conversation"),
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    const next = [thread, ...readChats()];
    writeChats(next);
    setChats(next);
    return thread;
  }, []);

  const appendMessage = useCallback((id: string, msg: Omit<ChatMessage, "id" | "createdAt">) => {
    const current = readChats();
    const idx = current.findIndex(c => c.id === id);
    if (idx === -1) return;
    const full: ChatMessage = {
      id: `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`,
      createdAt: Date.now(),
      ...msg,
    };
    const updated: ChatThread = {
      ...current[idx],
      messages: [...current[idx].messages, full],
      updatedAt: Date.now(),
      title:
        current[idx].messages.length === 0 && msg.role === "user"
          ? msg.text.slice(0, 48)
          : current[idx].title,
    };
    const next = [...current];
    next[idx] = updated;
    writeChats(next);
    setChats(next);
    return full;
  }, []);

  const deleteChat = useCallback((id: string) => {
    const next = readChats().filter(c => c.id !== id);
    writeChats(next);
    setChats(next);
  }, []);

  return { chats: sortedChats, getChat, createChat, appendMessage, deleteChat };
}