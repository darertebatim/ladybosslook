import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const MARKER = "/storage/v1/object/public/chat-attachments/";
const cache: Record<string, { url: string; expires: number }> = {};

/** chat-attachments is a private bucket: turn stored public URLs into short-lived signed URLs. */
export function useChatAttachmentUrl(raw?: string | null): string | null {
  const idx = raw ? raw.indexOf(MARKER) : -1;
  const path = idx >= 0 ? decodeURIComponent(raw!.slice(idx + MARKER.length).split("?")[0]) : null;
  const [url, setUrl] = useState<string | null>(() => {
    if (!raw) return null;
    if (!path) return raw;
    const c = cache[path];
    return c && c.expires > Date.now() ? c.url : null;
  });

  useEffect(() => {
    if (!raw) { setUrl(null); return; }
    if (!path) { setUrl(raw); return; }
    const c = cache[path];
    if (c && c.expires > Date.now()) { setUrl(c.url); return; }
    let alive = true;
    supabase.storage.from("chat-attachments").createSignedUrl(path, 60 * 60 * 6).then(({ data }) => {
      if (!alive) return;
      if (data?.signedUrl) {
        cache[path] = { url: data.signedUrl, expires: Date.now() + 5.5 * 3600 * 1000 };
        setUrl(data.signedUrl);
      } else setUrl(raw);
    });
    return () => { alive = false; };
  }, [raw, path]);

  return url;
}
