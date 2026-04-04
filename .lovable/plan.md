

## Rebuild Read: Visual Stories + Lessons with TTS

### What We're Building
A Blinkist-inspired reading experience with two content types -- **Stories** (narrative, entertaining, 5-30 min) and **Lessons** (educational, from uploaded documents). Both share the same visual reader UI with swipeable screens, cover images, and text-to-speech narration.

### Database Changes

**Replace existing tables** with a unified content model:

**`reading_content`** -- replaces `reading_lessons`
- `id` (uuid PK), `title`, `subtitle`, `description` (text)
- `cover_url` (text) -- 6:4 cover image
- `type` (text: 'story' or 'lesson')
- `category` (text), `author` (text)
- `reading_time_minutes` (int) -- estimated read time
- `theme_color` (text, default '#F0E3FF')
- `is_published` (boolean), `is_premium` (boolean)
- `sort_order` (int), `created_at`, `updated_at`

**`reading_sections`** -- replaces `reading_cards` (now full article sections, not micro-cards)
- `id` (uuid PK), `content_id` (FK -> reading_content)
- `sort_order` (int)
- `heading` (text) -- section heading
- `body` (text) -- rich text / markdown body
- `quote` (text, nullable) -- highlighted pull-quote
- `image_url` (text, nullable) -- section illustration
- `created_at`

**`reading_user_progress`** -- replaces `reading_progress`
- `id` (uuid PK), `user_id` (FK -> auth.users)
- `content_id` (FK -> reading_content)
- `last_section_index` (int)
- `completed` (boolean), `completed_at` (timestamptz)
- unique on (user_id, content_id)

**New storage bucket**: `reading-covers` (public)

### Text-to-Speech (ElevenLabs)

**Edge function**: `supabase/functions/elevenlabs-tts/index.ts`
- Accepts `{ text, voiceId? }`, returns audio/mpeg binary
- Uses ElevenLabs TTS API with `eleven_multilingual_v2` model

**Requires**: User needs to add `ELEVENLABS_API_KEY` secret in Supabase dashboard.

**Client integration**: A play/pause button in the reader that streams the current section's text as narrated audio. Fetches from the edge function using `fetch()` + `.blob()`.

### Admin: Reading Manager (rebuilt)

**Route**: `/admin/read` (same URL, rebuilt component)

Two tabs: **Stories** | **Lessons**

Each tab shows a table of content items with:
- Cover thumbnail, title, type badge, status badge, reading time
- Actions: Edit, Manage Sections, Delete

**Content Editor** (dialog):
- Title, subtitle, description, author, category, reading time
- Cover image upload (6:4 aspect ratio)
- Theme color picker
- Published/Premium toggles

**Section Editor** (inline, below content):
- Ordered list of sections with heading, body (textarea), quote, image upload
- Add/reorder/delete sections
- Preview button

### User-Facing Pages

**1. Read Library (`/app/read`)** -- rebuilt
- Two horizontal pill tabs at top: "Stories" | "Lessons"
- Vertical list of cards (Blinkist-style): 6:4 cover image on left, title + subtitle + reading time + category on right
- Completed items show a checkmark

**2. Content Detail (`/app/read/:id`)** -- rebuilt
- Hero: full-width 6:4 cover with gradient overlay, title + author
- White card below: description, reading time, category
- "Start Reading" / "Continue" CTA button
- If completed: "Read Again" button

**3. Reader (`/app/read/:id/reader`)** -- new
- Clean, distraction-free reading screen
- Top bar: back button + progress bar + section counter
- Scrollable single-section view with heading, body text, pull-quote highlight, section image
- Bottom: prev/next navigation buttons
- Floating TTS play/pause button (bottom-right corner)
- On last section complete: celebration screen with "Back to Library"

### Sample Content (1 test story)

Insert a sample story: "The Jar of Stones" -- a classic parable about priorities (approx 5 min read), split into 5 sections with headings and quotes. No cover image (placeholder color).

### Files to Create/Modify

| File | Action |
|------|--------|
| Migration SQL | Drop old tables, create new schema + RLS + storage bucket |
| `supabase/functions/elevenlabs-tts/index.ts` | TTS edge function |
| `src/hooks/useReading.ts` | New hooks for reading_content, sections, progress |
| `src/pages/admin/ReadingManager.tsx` | Rebuild with Stories/Lessons tabs |
| `src/components/admin/ReadingSectionEditor.tsx` | Section editor component |
| `src/pages/app/AppRead.tsx` | Rebuild as Blinkist-style library |
| `src/pages/app/AppReadDetail.tsx` | New content detail page |
| `src/pages/app/AppReadReader.tsx` | New reader with TTS |
| `src/App.tsx` | Add new routes |
| `src/hooks/useReadingLessons.ts` | Remove (replaced by useReading.ts) |
| `src/components/admin/ReadingCardEditor.tsx` | Remove (replaced) |

### Technical Notes
- TTS requires `ELEVENLABS_API_KEY` -- will prompt user to add it
- Cover images uploaded to `reading-covers` bucket
- Reader uses simple prev/next navigation (not carousel) for long-form content
- Old `reading_lessons`, `reading_cards`, `reading_progress` tables will be dropped and replaced

