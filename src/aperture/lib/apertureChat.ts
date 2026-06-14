import { supabase } from "@/integrations/supabase/client";

export interface ApertureMsg { role: "user" | "assistant" | "system"; content: string }

/**
 * Streams a reply from the aperture-chat edge function. Calls onDelta
 * with each text chunk and resolves with the full assembled text.
 * The edge function persists both the user message and the assistant
 * reply to aperture_messages itself — no client-side write needed.
 */
export async function streamApertureChat(opts: {
  chatId: string;
  messages: ApertureMsg[];
  onDelta: (text: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not signed in");

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aperture-chat`;
  const res = await fetch(url, {
    method: "POST",
    signal: opts.signal,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
    },
    body: JSON.stringify({
      chatId: opts.chatId,
      messages: opts.messages,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Chat failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let assembled = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const obj = JSON.parse(payload);
        const delta = obj?.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta.length > 0) {
          assembled += delta;
          opts.onDelta(delta);
        }
      } catch { /* skip parse errors */ }
    }
  }
  return assembled;
}

export async function regenerateMemoryCard(): Promise<{ summary: string; length: number }> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not signed in");
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aperture-regenerate-memory-card`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}