// TEMPORARY one-off repair tool: re-encodes a broadcast voice note into an iPhone-safe MP3.
// Deleted right after use.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const KEY = "rbv-7f3c9a1e-5d2b-4e8f-a6c0-91b2d4e7f8a3";
const SRC = "bce7b2e1-e60a-45d6-a172-264755a6627b/broadcast-226ca1ad-bd5c-41f4-acd6-c0e378b6aba7.m4a";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (url.searchParams.get("key") !== KEY) return new Response("no", { status: 403 });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  if (req.method === "GET") {
    const { data, error } = await sb.storage.from("chat-attachments").download(SRC);
    if (error || !data) return new Response(String(error?.message), { status: 500 });
    return new Response(data, { headers: { "content-type": "application/octet-stream" } });
  }

  // POST: body = mp3 bytes
  const bytes = new Uint8Array(await req.arrayBuffer());
  const path = `broadcast-voice/${crypto.randomUUID()}.mp3`;
  const up = await sb.storage.from("audio_files").upload(path, bytes, { contentType: "audio/mpeg" });
  if (up.error) return new Response(up.error.message, { status: 500 });
  const publicUrl = sb.storage.from("audio_files").getPublicUrl(path).data.publicUrl;
  const { data: rows, error } = await sb.from("chat_messages")
    .update({ attachment_url: publicUrl, attachment_type: "audio/mpeg", attachment_size: bytes.length, attachment_name: "voice-message.mp3" })
    .like("attachment_url", `%${SRC}`)
    .select("id");
  if (error) return new Response(error.message, { status: 500 });
  return Response.json({ publicUrl, updated: rows?.length ?? 0 });
});
