import { supabase } from "@/integrations/supabase/client";

/**
 * Helpers for sending images/files as chat attachments.
 *
 * Uploads go to the existing private `aperture-files` bucket; each upload
 * inserts an `aperture_files` row tagged with `source = 'chat'` and the
 * originating `chat_id`, then queues the existing `aperture-file-ingest`
 * pipeline so any business facts get extracted into memory.
 */

export const MAX_ATTACHMENTS = 5;
export const MAX_BYTES = 10 * 1024 * 1024;
export const ALLOWED_MIME = new Set([
  "image/png", "image/jpeg", "image/jpg", "image/webp", "image/heic", "image/heif",
  "application/pdf", "text/plain", "text/markdown",
]);

export interface PendingAttachment {
  localId: string;
  file: File;
  name: string;
  size: number;
  mime: string;
  previewUrl: string | null;   // object URL for image preview
  status: "queued" | "uploading" | "uploaded" | "failed";
  error?: string;
  // Once uploaded:
  fileId?: string;
  storagePath?: string;
}

export interface SentAttachment {
  file_id: string;
  storage_path: string;
  mime: string;
  name: string;
  size: number;
}

export function validateFiles(files: File[]): { ok: File[]; rejected: { file: File; reason: string }[] } {
  const ok: File[] = [];
  const rejected: { file: File; reason: string }[] = [];
  for (const f of files) {
    const mime = (f.type || "").toLowerCase();
    if (f.size > MAX_BYTES) {
      rejected.push({ file: f, reason: `${f.name} is over 10 MB` });
      continue;
    }
    if (mime && !ALLOWED_MIME.has(mime)) {
      rejected.push({ file: f, reason: `${f.name} is not a supported file type` });
      continue;
    }
    ok.push(f);
  }
  return { ok, rejected };
}

/** Resize big images to ≤ 2048px before upload to keep latency reasonable. */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/heic" || file.type === "image/heif") return file;
  try {
    const bmp = await createImageBitmap(file);
    const maxDim = 2048;
    const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
    if (scale >= 0.999) { bmp.close?.(); return file; }
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close?.();
    const blob: Blob | null = await new Promise(r => canvas.toBlob(r, "image/jpeg", 0.85));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.(png|webp|heic|heif|gif)$/i, ".jpg"), { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function makePending(file: File): PendingAttachment {
  const isImage = file.type.startsWith("image/");
  return {
    localId: crypto.randomUUID(),
    file,
    name: file.name,
    size: file.size,
    mime: file.type || "application/octet-stream",
    previewUrl: isImage ? URL.createObjectURL(file) : null,
    status: "queued",
  };
}

/** Upload one pending attachment, insert aperture_files row, kick ingestion. */
export async function uploadPending(
  pending: PendingAttachment,
  opts: { userId: string; chatId: string },
): Promise<SentAttachment> {
  const raw = pending.file;
  const finalFile = raw.type.startsWith("image/") ? await compressImage(raw) : raw;
  const id = crypto.randomUUID();
  const ext = finalFile.name.includes(".") ? finalFile.name.split(".").pop() : "bin";
  const storagePath = `${opts.userId}/chat/${opts.chatId}/${id}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("aperture-files")
    .upload(storagePath, finalFile, { contentType: finalFile.type || pending.mime, upsert: false });
  if (upErr) throw new Error(upErr.message);

  const { error: insErr } = await supabase.from("aperture_files").insert({
    id,
    user_id: opts.userId,
    file_name: pending.name,
    mime_type: finalFile.type || pending.mime,
    size_bytes: finalFile.size,
    storage_path: storagePath,
    status: "reading",
    source: "chat",
    chat_id: opts.chatId,
  } as any);
  if (insErr) throw new Error(insErr.message);

  // Fire-and-forget — extraction runs in the background; UI polls aperture_files.status.
  supabase.functions.invoke("aperture-file-ingest", {
    body: { file_id: id, chat_id: opts.chatId },
  }).catch((e) => console.error("ingest invoke failed", e));

  return {
    file_id: id,
    storage_path: storagePath,
    mime: finalFile.type || pending.mime,
    name: pending.name,
    size: finalFile.size,
  };
}

/** Short-lived signed URL for displaying an attachment in chat. */
const urlCache = new Map<string, { url: string; expires: number }>();
export async function getSignedAttachmentUrl(storagePath: string): Promise<string | null> {
  const cached = urlCache.get(storagePath);
  if (cached && cached.expires > Date.now()) return cached.url;
  const { data, error } = await supabase.storage
    .from("aperture-files")
    .createSignedUrl(storagePath, 60 * 60); // 1h
  if (error || !data?.signedUrl) return null;
  urlCache.set(storagePath, { url: data.signedUrl, expires: Date.now() + 55 * 60 * 1000 });
  return data.signedUrl;
}