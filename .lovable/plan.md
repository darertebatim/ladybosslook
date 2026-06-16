
# Chat composer: attachments + screenshot intelligence

Adds image/file sending to the Aperture chat, with Gemini-vision auto-extraction of business facts into the matching memory bucket — reusing the existing `aperture-file-ingest` pipeline.

> Note: the `Build ▾` pill you saw is the Lovable editor toolbar, not your app. The real composer is just textarea + send. No app-side `Build` removal needed.

## 1. Composer redesign (`src/aperture/pages/real/ChatThread.tsx`)

New layout (mobile-first, matches ChatGPT pattern):

```text
[ attachment thumbnails row (only if files queued) ]
[ + ]  Type your answer...                    [ ↑ ]
```

- Left `+` button → bottom sheet: **Take photo · Choose photo · Choose file**.
  - "Take photo" uses native camera on Capacitor (`Camera.getPhoto`), falls back to `<input type="file" capture>` on web.
  - "Choose photo" → `<input type="file" accept="image/*" multiple>`.
  - "Choose file" → `<input type="file" accept="image/*,application/pdf,.txt,.md" multiple>`.
- Desktop **paste-to-attach**: `onPaste` on the textarea reads `clipboardData.items`, attaches any image blobs.
- Desktop **drag-and-drop**: `onDragOver`/`onDrop` on the chat scroll area attaches dropped files; show a dashed overlay while dragging.
- Thumbnail preview row above the input: 56×56 image thumbnails (or file-type chip for non-images) each with a small × to remove. Send button stays disabled while any attachment is still uploading.

Limits: max 5 files per message, 10 MB each, types `image/png|jpeg|webp|heic`, `application/pdf`, `text/plain`, `text/markdown`. Anything else → toast and reject.

## 2. Upload + persistence

Reuse the existing `aperture-files` storage bucket and `aperture_files` table from the Files feature. Per attachment:

1. Client uploads to `aperture-files/{user_id}/chat/{chatId}/{uuid}-{filename}` (private bucket).
2. Insert `aperture_files` row with `source = 'chat'`, `chat_id = <chat>`, status `'reading'`.
3. Insert a `chat_messages` row of role `user` whose `content` is the user's text (may be empty) and a new `attachments jsonb` column listing `[{ file_id, storage_path, mime, name, size }]`.

DB migration:
- `ALTER TABLE public.aperture_files ADD COLUMN IF NOT EXISTS chat_id uuid` (nullable; no FK enforcement needed, owner check via `user_id`).
- `ALTER TABLE public.aperture_files ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'upload'` if not already present.
- `ALTER TABLE public.aperture_chat_messages ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb`.
- No new GRANT/RLS changes (existing policies on both tables already scope to `user_id`).

## 3. Message rendering

`MessageBubble` learns to render `attachments`:
- Images → signed-URL thumbnail grid (tap = lightbox).
- PDFs/text → file chip with icon + name + size.
- Signed URLs fetched on demand and cached for the session.

## 4. Vision extraction → memory (auto)

For every attached image or PDF, after the user message is persisted:

1. Frontend invokes `aperture-file-ingest` (already exists) with `{ file_id, source: 'chat', chat_id }`. No new function needed — extend the existing handler to accept the `source/chat_id` context.
2. The function (already wired to Gemini) extracts structured business facts and writes them to `aperture_memory_items` with `source = 'file_extracted'`, `source_file_id = <id>`, `chat_id = <chat>`.
3. When extraction completes, the chat thread shows a small chip under the corresponding user message: **"Saved 3 facts → Money & Finance"** (linked to that bucket). Implemented by polling `aperture_files.status` for queued attachments, then loading the new `aperture_memory_items` linked via `source_file_id`.

The assistant's reply for that turn includes the attached images as multimodal input so it can answer about what's on screen even before extraction finishes. Update `streamApertureChat` + `aperture-chat` edge function to forward image parts as `image_url` content blocks (https signed URLs) to Gemini.

## 5. Files page integration

Files uploaded via chat appear on the Files page with a small "from chat" badge and a link back to the originating thread. No new code beyond an extra column read.

## Technical notes

- New component: `src/aperture/components/chat/Composer.tsx` (extracted from `ChatThread.tsx`) holding draft, attachments, paste/drop handlers, and the attachment sheet.
- New component: `src/aperture/components/chat/AttachmentSheet.tsx` (bottom sheet, native-on-Capacitor camera).
- New util: `src/aperture/lib/chatAttachments.ts` — upload, signed-URL fetch, mime/size validation, image compression to ≤2048px before upload.
- Edge fn change (`supabase/functions/aperture-chat/index.ts`): accept `attachments` on the latest user message, fetch short-lived signed URLs server-side, append `{type:'image_url',image_url:{url}}` blocks to the Gemini message.
- Edge fn change (`supabase/functions/aperture-file-ingest/index.ts`): accept optional `chat_id`, persist it on extracted memory items.
- DB: one migration with the three `ALTER TABLE` statements above.

## Out of scope

- No plugins/integrations menu in the + sheet (deferred to Tools page).
- No voice notes / mic re-design.
- No multi-image carousel composer reorder.
- No editing of sent attachments.
