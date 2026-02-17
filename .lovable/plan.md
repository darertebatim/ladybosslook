

# Simplify Ritual Detail Page -- Blog-Style Description

## What Changes

The ritual detail page currently has a complex structure with **sections** (title + content + image blocks) that group tasks. This will be simplified to match the me+ style: a clean **blog post** layout where the description is rich HTML content, followed by a flat list of actions.

## Summary of Changes

### 1. Admin: Replace Description Textarea with Rich Text Editor
- Swap the plain `<Textarea>` for the existing `<RichTextEditor>` component (already built with react-quill)
- Add `image` to the RichTextEditor's toolbar formats so admins can embed images inline
- The AI text generator stays, but its output will be inserted as HTML

### 2. Admin: Remove the "Sections" Tab
- Remove the entire "Sections" tab from the ritual edit dialog
- Remove section-related state (`localSections`, `editingSection`, `sectionDialogOpen`)
- Remove section CRUD logic (create/edit/delete sections, move tasks between sections)
- Tasks will no longer have `section_id` -- they're just a flat ordered list
- Keep the task list management (add/remove/reorder tasks) but without section grouping

### 3. User-Facing Detail Page: Blog-Style Layout
- Render the `description` field as sanitized HTML using `DOMPurify` (same pattern used in `AppCourseDetail.tsx`)
- Remove all section-based rendering (section titles, section content, section images, tasks-by-section grouping)
- Show actions as a simple flat list under a "What's Included" header after the description
- Layout becomes: **Cover Image -> Title -> Subtitle/Badges -> Rich Description (HTML) -> Actions list -> Add button**

### 4. RichTextEditor: Add Image Support
- Add `image` to the toolbar and formats arrays so admins can paste/insert images within the description
- This lets the description act as a true blog post with inline images

### 5. AI Assistant: Simplify Section Tools
- Update the AI assistant system prompt to stop using sections
- The assistant should put all long content directly into the `description` field as rich HTML instead of creating sections

## Files to Modify

| File | Change |
|------|--------|
| `src/components/admin/RichTextEditor.tsx` | Add `image` to toolbar and formats |
| `src/components/admin/RoutinesBank.tsx` | Replace Textarea with RichTextEditor, remove Sections tab and all section logic, flatten task management |
| `src/pages/app/AppInspireDetail.tsx` | Remove section rendering, render description as HTML with DOMPurify, show flat task list |
| `supabase/functions/admin-assistant/index.ts` | Update system prompt rules to use HTML description instead of sections |

## Technical Notes

- The `description` column in `routines_bank` is already `text` type -- it can store HTML without any schema change
- The `routines_bank_sections` table stays in the database (no migration needed) but won't be used going forward
- Existing sections won't be migrated -- they'll simply stop being fetched/rendered
- DOMPurify is already installed and used elsewhere in the app (`AppCourseDetail.tsx`, `ProgramPage.tsx`)
- The `RichTextEditor` component already exists with react-quill -- just needs `image` format added
