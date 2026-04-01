

# Educational Reading System — Full Plan

## Overview

Build a Headway/Imprint-style micro-learning feature where admin documents are converted into swipeable visual card lessons. Admin manages content at `/admin/read`, users consume it at `/app/read`.

## Database

### New table: `reading_lessons`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| title | text | Lesson title |
| subtitle | text | Short tagline |
| description | text | Brief summary |
| cover_image_url | text | Cover for the library |
| emoji | text | Fallback if no cover |
| source_document_id | uuid FK → admin_documents | Optional link to source doc |
| category | text | e.g. "Money", "Mindset" |
| is_published | boolean | default false |
| sort_order | int | default 0 |
| created_at / updated_at | timestamptz | |

### New table: `reading_cards`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| lesson_id | uuid FK → reading_lessons | |
| sort_order | int | Card position |
| title | text | Card headline |
| content | text | Main text (2-4 sentences) |
| key_point | text | Bold takeaway line |
| image_url | text | Optional visual |
| bg_color | text | Card background color |
| created_at | timestamptz | |

### New table: `reading_progress`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK → auth.users | |
| lesson_id | uuid FK → reading_lessons | |
| last_card_index | int | Where user left off |
| completed | boolean | default false |
| completed_at | timestamptz | |
| unique(user_id, lesson_id) | | |

### RLS
- `reading_lessons` / `reading_cards`: SELECT for authenticated (published only), full CRUD for admins
- `reading_progress`: Users can SELECT/INSERT/UPDATE their own rows

## Admin: `/admin/read`

### Features
1. **Lesson list** — table of all lessons with title, category, card count, published status
2. **Lesson editor** — form to create/edit a lesson (title, subtitle, description, cover image, category, published toggle)
3. **Card editor** — drag-reorderable list of cards within a lesson. Each card has: title, content, key_point, bg_color picker, optional image upload
4. **AI Generate from Document** — button to select an admin document → calls an edge function that chunks extracted_text into cards using AI (Gemini Flash via Lovable AI Gateway)
5. **Preview** — renders the swipeable card UX inline so admin can preview before publishing

### New edge function: `generate-reading-cards`
- Receives: `document_id` (to fetch `extracted_text` from `admin_documents`) + `lesson_id`
- Uses Gemini Flash to chunk text into 8-15 cards with title, content, key_point, and suggested bg_color
- Inserts cards into `reading_cards` table
- Returns the created cards

## App: `/app/read`

### Library page (`AppRead.tsx`)
- Grid of published lessons with cover image/emoji, title, subtitle
- Progress indicator (e.g. "3/12 cards read", or checkmark if completed)
- Tap opens the reader

### Reader page (`AppReadLesson.tsx`)
- Full-screen swipeable card experience (horizontal swipe using Embla carousel)
- Each card: colored background, title at top, content in center, key_point highlighted at bottom
- Progress dots at top
- Auto-saves progress to `reading_progress` on each swipe
- Final card shows "Lesson Complete" with confetti/celebration
- Back button returns to library

### Integration
- Add route `/app/read` to App.tsx inside the app layout routes
- Add route `/app/read/:lessonId` for the reader
- Add `read` as a tool type in `toolsConfig.ts` with 📖 emoji
- Add to the Tools/Explore page as a section or tool card
- Add `reading` to `proLinkPresentation.ts` for deep linking

### Admin route
- Add `/admin/read` route in App.tsx under admin routes
- Add nav item to admin sidebar

## File Structure

```text
src/pages/admin/ReadingManager.tsx        — Admin lesson list + CRUD
src/components/admin/ReadingCardEditor.tsx — Card editor with drag-reorder
src/pages/app/AppRead.tsx                 — Library grid
src/pages/app/AppReadLesson.tsx           — Swipeable reader
src/hooks/useReadingLessons.ts            — Data hooks
supabase/functions/generate-reading-cards/ — AI chunking edge function
```

## Implementation Order
1. Database migration (3 tables + RLS)
2. Hooks for CRUD operations
3. Admin lesson manager page + routing
4. Admin card editor with reorder
5. AI generation edge function
6. App library page + routing
7. App swipeable reader
8. Integration into tools page and navigation

