Align the `aperture_tools` table, the admin **Aperture → Tools** tab, and the user-facing **Memory → Tools** page with the v3 list (single row per tool, tagged with multiple categories and optional industries; per-category "Nothing yet" / "Spreadsheet / notes" options).

## 1. Database migration

Extend `public.aperture_tools` (keep existing rows, no breaking renames):

- Add `categories text[] not null default '{}'` — primary source of truth for grouping.
- Add `industries text[] not null default '{}'` — industry-bucket signals (empty for general tools).
- Keep `category text` for back-compat; backfill `categories = ARRAY[category]` for existing rows where `categories = '{}'`.
- Reseed the full v3 catalog (60+ rows) via `INSERT ... ON CONFLICT (slug) DO UPDATE SET label, categories, industries, sort_order, is_active`. Sort order grouped by primary category in the order shown in v3 (Accounting, AI, Design, E-commerce, Email & CRM, Communication, HR & People, Marketing & Social, Payments, Productivity, Scheduling, Website & Domain, Industry-specific).

No new tables. No RLS changes (existing read-all + admin-write policies still apply).

## 2. Admin — `src/pages/admin/Aperture.tsx` → `ToolsTab`

Replace the single `category` text field with:

- **Categories** — multi-select / comma-separated input (chip list). Stored as `categories text[]`. Fixed option set: `Accounting, AI, Design, E-commerce, Email & CRM, Communication, HR & People, Marketing & Social, Payments, Productivity, Scheduling, Website & Domain, Industry-specific`.
- **Industries** — multi-select / comma-separated input. Fixed option set matches the 11 industry group labels used in v3 (Food & Hospitality, Beauty & Wellness, Fitness/Training/Movement, Retail & E-Commerce, Professional Services & Agencies, Coaching/Consulting/Therapy, Education & Tutoring, Real Estate, General Contracting & Renovation, Outdoor & Recurring Trade Services, Medical & Dental Practices).
- Table columns become: Categories (chips) · Industries (chips) · Slug · Label · Active · Actions.
- Drop the legacy single-`category` text field from the editor (still kept in DB for back-compat but hidden in UI).

Use a small `EditorDialog` field-type extension `chips` (multi-value chip editor) or, if simpler, a comma-separated `text` field that the upsert handler splits/joins into `string[]`.

## 3. Memory Tools page — `src/aperture/pages/real/Tools.tsx`

Switch from the static `TOOL_CATALOG` to live `aperture_tools` rows:

- Fetch all active tools once, then group **by every value in `categories`** (a tool tagged `Payments, Scheduling, E-commerce` appears under all three groups but is still one logical row — `aperture_user_tools` is keyed by slug so toggling it in any group flips the same state).
- Render category groups in fixed display order (same list as admin). For each group:
  - Tools as togglable chips (same UI we have now).
  - Append two fixed pseudo-chips at the end: **"Nothing yet"** and **"Spreadsheet / notes / in my head"**. Selecting one writes an `aperture_user_tools` row with `tool_slug = nothing_yet_<category>` / `spreadsheet_or_notes_<category>`, `custom = false`, and a memory fact `"For <category>: nothing yet"` / `"For <category>: spreadsheet / notes / in my head"` into the matching bucket. Selecting any real tool in the same category auto-clears the "nothing yet" selection for that category.
- Show industry tag(s) as a tiny muted suffix on industry-specific chips (e.g. "Jobber · Trades").
- Keep the custom "Add anything else" input and the read-only "Integrations" preview section unchanged.

Bucket mapping (used when writing memory facts) lives in a small helper in `src/aperture/data/tools.ts`:

```text
Accounting, Payments         -> money-finance
Marketing & Social           -> marketing-visibility
Email & CRM                  -> marketing-visibility
E-commerce                   -> sales-conversion
Scheduling, Communication,
Productivity, HR & People,
AI, Design, Website & Domain,
Industry-specific            -> tools-systems
```

`tools.ts` keeps `INTEGRATIONS` and the bucket-mapping helper; the hard-coded `TOOL_CATALOG` / `TOOL_CATEGORIES` arrays are removed (the page now reads them from the DB).

## 4. Out of scope

- No changes to onboarding flow / `useApertureOnboardingDB` (it already reads `aperture_tools`).
- No real OAuth — integrations stay preview-only.
- No edits to `aperture_user_tools` schema.

Say **go** and I'll ship the migration + the two file changes.