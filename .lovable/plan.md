

# Reflection Tool - Implementation Plan

## Overview
Build a new "Reflection" tool -- a guided, step-by-step journaling experience. Each reflection is a multi-page flow where some pages ask questions (user writes an answer) and some pages display motivational/wisdom text (read-only). The admin can create and manage reflections via a new tab in `/admin/tools`.

## Data Model

### New Database Tables

**`reflections`** -- stores each reflection template
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| title | text | e.g. "Practice Gratitude" |
| subtitle | text | e.g. "Find ways to be happier" |
| cover_image_url | text | Square cover image URL |
| is_active | boolean | default true |
| is_featured | boolean | default false (for "For you" section) |
| sort_order | integer | default 0 |
| created_at / updated_at | timestamptz | auto |

**`reflection_pages`** -- ordered pages within a reflection
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| reflection_id | uuid (FK) | references reflections |
| page_order | integer | sequence number |
| type | text | 'question' or 'message' |
| content | text | The question prompt or the wisdom text |
| created_at | timestamptz | auto |

**`user_reflection_responses`** -- stores user answers
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | |
| user_id | uuid | not FK to auth.users |
| reflection_id | uuid (FK) | |
| page_id | uuid (FK) | which page they answered |
| response_text | text | user's written answer |
| completed_at | timestamptz | when they finished the full reflection |
| created_at | timestamptz | auto |

RLS: Users can only read/write their own responses. Reflections and reflection_pages are readable by all authenticated users.

### Storage
Use existing `routine-images` bucket for cover image uploads.

---

## App Frontend

### Route: `/app/reflections`
- Page listing all reflections (like the me+ screenshot)
- Header: "Reflection" title + subtitle "Find ways to be happier & healthier"
- Optional "For you" featured banner at top (for `is_featured` reflections)
- "All" section: list of reflections as horizontal cards with square cover image, title, and subtitle
- Tapping a reflection opens the step-by-step flow

### Route: `/app/reflections/:reflectionId` (full-screen, outside AppLayout)
- Bottom-sheet style UI matching the me+ screenshots
- Progress bar at top showing current page / total pages
- Back arrow to go to previous page
- Two page types:
  - **Question page**: Bold question text + textarea for answer + purple arrow FAB (bottom-right) to go next
  - **Message page**: Bold wisdom/motivational text + purple arrow FAB to continue (no input)
- Last page: purple checkmark FAB instead of arrow to finish
- On completion, saves all responses and navigates back to reflections list
- Responses are saved per-page as user progresses (not all at the end)

### Update toolsConfig
- Remove `comingSoon: true` and `hidden: true` from the existing reflections entry in `src/lib/toolsConfig.ts`

### Update App.tsx Routes
- Add `/app/reflections` inside AppLayout routes
- Add `/app/reflections/:reflectionId` as full-screen route (outside AppLayout, like journal entry)

---

## Admin Panel

### New tab in `/admin/tools`: "Reflections"
- Tab with `PenLine` icon
- List of all reflections with title, subtitle, cover preview, active toggle
- Create/Edit dialog with:
  - Title, Subtitle inputs
  - Cover image uploader (using existing `ImageUploader` component)
  - is_active toggle, is_featured toggle
  - Sort order
- When editing a reflection, a nested section to manage pages:
  - Ordered list of pages (drag-reorderable or manual sort_order)
  - Each page: type selector (question/message) + content textarea
  - Add/remove pages

---

## Files to Create/Modify

### New Files
1. **`src/hooks/useReflections.ts`** -- queries for reflections, reflection_pages, user_reflection_responses (CRUD hooks)
2. **`src/pages/app/AppReflections.tsx`** -- listing page
3. **`src/pages/app/AppReflectionFlow.tsx`** -- the step-by-step flow page
4. **`src/components/admin/ReflectionsManager.tsx`** -- admin CRUD for reflections + pages

### Modified Files
1. **`src/App.tsx`** -- add routes
2. **`src/pages/admin/Tools.tsx`** -- add Reflections tab
3. **`src/lib/toolsConfig.ts`** -- unhide reflections entry

### Database Migration
- Create `reflections`, `reflection_pages`, `user_reflection_responses` tables with RLS policies

---

## Technical Details

- The step-by-step flow stores answers locally in state as the user progresses, and upserts each answer to `user_reflection_responses` when moving to the next page
- Progress bar width = `(currentPage / totalPages) * 100%` (solid black bar matching me+ design)
- The FAB button is a 56px purple circle positioned at bottom-right
- Question pages auto-focus the textarea
- Message pages are read-only with no input field
- Last page shows a checkmark icon instead of arrow

