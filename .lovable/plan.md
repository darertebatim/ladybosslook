

# Merge Journal into Reflections

## What we're merging

**Journal** (`journal_entries` table): title, content, mood, shared_with_admin, shared_at, created_at
**Free-form Reflections** (`free_form_reflections` table): title, content, created_at

They're essentially the same thing. Journal has two extra fields: `mood` and `shared_with_admin/shared_at`.

## Full scope of work

### 1. Database Migration — Add missing columns to `free_form_reflections`
- Add `mood` (text, nullable) column
- Add `shared_with_admin` (boolean, nullable) column  
- Add `shared_at` (timestamptz, nullable) column
- Add `updated_at` (timestamptz) column

### 2. Data Migration — Copy all journal entries into free_form_reflections
- SQL script to INSERT all `journal_entries` rows into `free_form_reflections` with matching fields (preserving original `id`, `created_at`, mood, etc.)
- This ensures no user data is lost

### 3. Redirect all `/app/journal` routes
- `/app/journal` → `/app/reflections`
- `/app/journal/new` → `/app/reflections` (open free-form)
- `/app/journal/:entryId` → `/app/reflections/notes/free/:entryId`

### 4. Update the Journal Entry editor (`AppJournalEntry.tsx`)
- Repoint it to read/write from `free_form_reflections` instead of `journal_entries`
- OR retire it entirely and enhance `AppFreeFormReflection.tsx` to support mood selection + editing existing entries (currently it only creates new ones)

### 5. Update `AppFreeFormNoteDetail.tsx`
- Add mood display and editing support
- Add shared_with_admin support

### 6. Update hooks
- Retire `useJournal.tsx` (or repoint it to `free_form_reflections`)
- Update `useAutoCompleteProTask` — the `autoCompleteJournal` function should now trigger when a free-form reflection is saved

### 7. Update stats & achievements
- `usePresenceStats.tsx` — count `free_form_reflections` instead of `journal_entries`
- `useAppData.tsx` — same: query `free_form_reflections` for monthly presence
- `JournalStats.tsx` — repoint to free_form_reflections, or merge into reflections stats
- `achievements.ts` — journal achievement thresholds should count free_form_reflections
- `get_home_data` DB function — update the journal days query to use `free_form_reflections`

### 8. Remove the Journal tool from tools config
- In `toolsConfig.ts`, remove the `journal` entry (id: 'journal') since it's now part of Reflections
- Update the Reflections tool description from "Guided prompts" to something like "Journal & guided prompts"

### 9. Update Reflection Notes page
- Already merges both — will now show journal entries too (migrated data)
- Mood emoji should display on cards for entries that have mood

### 10. Update admin panel
- `SharedJournalsManager` — repoint queries to `free_form_reflections` where `shared_with_admin = true`
- Keep the "Journals" tab in admin Community page

### 11. Cleanup references
- `JournalPromptMarquee` — keep it, it's used in free-form reflections already
- `JournalCalendar`, `JournalHeaderStats` — either retire or integrate into reflections page
- `JournalReminderSettings` / `journal_reminder_settings` table — keep working, just redirect to reflections context
- Update nav hiding logic in `NativeAppLayout.tsx`
- Update `BreathingCompleteSheet.tsx` "Write in Journal" link
- Update `AnnouncementCreator.tsx` journal link
- Update `CompactStatsPills.tsx` journal link
- Update `AppProfile.tsx` journal stats section
- Update `PromoBanner.tsx` journal usage check

### 12. Edge functions
- `send-weekly-summary` — update journal stats query
- `local-smart-nudges` — update journal proaction references

## What stays the same
- Guided reflections (multi-page) — untouched
- Reflection Notes page — already unified, just gains mood display
- The ✏️ emoji for the Reflections tool

## Order of execution
1. DB migration (add columns) → data migration (copy entries)
2. Repoint all code from `journal_entries` to `free_form_reflections`
3. Add redirects for old routes
4. Remove journal tool entry, update descriptions
5. Clean up unused components

This is a large change touching ~20 files. Shall I proceed?

