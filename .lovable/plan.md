## Plan: Files & Tools (Integrations) for Aperture Memory

Add two new pillars to the Memory page so users can feed Aperture context beyond the bucket questionnaire: **Files** (upload docs Aperture reads to extract facts) and **Tools** (which tools the user uses today + future integrations to their live infrastructure).

### 1. Memory header buttons

In `src/aperture/pages/real/Memory.tsx`, add two compact icon+label buttons to the `PageHeader` `action` slot, sitting alongside the existing `0% MAPPED` chip:

- **Files** → `/aperture/app/memory/files` (paperclip icon)
- **Tools** → `/aperture/app/memory/tools` (plug/grid icon)
- Keep the `% MAPPED` chip as well; lay out as a small row.

Mobile: the action row wraps under the title (PageHeader already uses `flexWrap`).

### 2. New page: Files (`/aperture/app/memory/files`)

File: `src/aperture/pages/real/Files.tsx`. Mirrors Claude Projects' file pane.

Sections:
- **Header** — "Files Aperture has read" + subcopy ("Upload contracts, price lists, old ads, past tax summaries — I'll read them and turn the useful bits into memory facts.")
- **Upload zone** — drag/drop + "Choose files" button. Accepts PDF, DOCX, TXT, MD, PNG, JPG up to 20MB each.
- **File list** — each row: filename, size, uploaded date, status chip (`Reading…` / `Read · N facts extracted` / `Failed`), and a "View extracted facts" link that filters Memory items by `source_file_id`. Delete (trash) action removes file + soft-deletes derived memory items.

Data layer (new):
- Storage bucket `aperture-files` (private). Path: `userId/fileId.ext`.
- Table `public.aperture_files` (id, user_id, file_name, mime_type, size_bytes, storage_path, status, extracted_text, extracted_fact_count, created_at, updated_at). RLS: owner-only; standard GRANTs (`authenticated` + `service_role`).
- Edge function `aperture-file-extract`: triggered after upload. Reuses logic from existing `extract-document-text` (pandoc/docx/AI Gemini for PDFs/images) to populate `extracted_text`, then calls a fact-extraction pass against Aperture's bucket schema and inserts rows into `aperture_memory_items` with `source = 'file_extracted'` and a new `source_file_id` column.
- Migration also adds `source_file_id uuid references aperture_files(id) on delete set null` to `aperture_memory_items` and extends the `source` check to include `file_extracted`.

### 3. New page: Tools (`/aperture/app/memory/tools`)

File: `src/aperture/pages/real/Tools.tsx`. Two parts:

**a) "Tools you use today"** — curated list of common SMB tools grouped by category (POS, Accounting, Marketing/Social, Booking, E-commerce, Ops). User toggles each on/off; selected tools are saved as memory facts ("Uses Square for POS") into the appropriate bucket (Tools & Systems mostly, some into Marketing/Money/Operations). Free-text "Add a tool" input for anything not in the list.

**b) "Connect Aperture to your tools" (Integrations)** — preview-only cards for future live integrations: Instagram, Google Business, QuickBooks, Shopify, Square, Stripe, Calendly, Gmail. Each card shows logo, name, one-line "what we'd read", and a `Coming soon` / `Connect` button (disabled, with tooltip explaining roadmap). This sets the surface up; real OAuth comes later.

Data layer:
- Table `public.aperture_user_tools` (id, user_id, tool_slug, tool_name, category, custom bool, is_active, connected_at, connection_metadata jsonb, created_at, updated_at). RLS owner-only + GRANTs.
- Curated tool catalog lives in `src/aperture/data/tools.ts` (static, ~40 entries).
- Toggling a tool on writes both an `aperture_user_tools` row AND a memory item (so the AI sees it in chat extraction immediately).
- Integration cards are static for now — no OAuth yet.

### 4. Router

Add two routes in `src/aperture/router.tsx`:
- `app/memory/files` → `RealFiles`
- `app/memory/tools` → `RealTools`

### 5. AI chat awareness

Update `supabase/functions/aperture-chat/index.ts` system prompt builder to:
- Mention attached files by name + extracted_text snippets (top N most relevant).
- Mention connected tools in the user's stack.

### Technical notes
- File uploads use the existing Supabase storage client; no new SDK.
- Reuse existing `extract-document-text` extraction primitives (copy or share a helper module under `supabase/functions/_shared/`).
- Fact extraction prompt mirrors `aperture-chat`'s extractor but runs over file text in one pass, scoped to the user's allowed bucket list (default + industry).
- Tool toggles use optimistic UI via React Query / local state — same pattern as `useApertureBucketsDB`.

### Out of scope (explicit)
- Real OAuth to Instagram/QuickBooks/etc. — surface only.
- Re-extracting files when bucket schema changes.
- File previews beyond filename (no PDF viewer).

Say **"go"** and I'll ship it.
