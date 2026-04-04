

## Quiz Center - Plan

### Overview
Build a full Quiz Center system with an admin management page and a user-facing quiz experience. Quizzes reuse the existing onboarding questionnaire UI (single-select, multi-select, etc.) and add analysis/results screens inspired by the Dear Me app screenshots.

### Database Schema

**`admin_quizzes` table** -- quiz metadata
- `id` (uuid, PK)
- `title` (text) -- e.g. "Discover Your Social Style"
- `slug` (text, unique) -- URL-friendly identifier
- `overview` (text) -- short description shown on detail page
- `description` (text) -- "What you'll get" section
- `cover_url` (text) -- 6:4 cover image URL
- `theme_color` (text) -- background color for header area
- `is_active` (boolean, default true)
- `is_premium` (boolean, default false)
- `sort_order` (int, default 0)
- `created_at`, `updated_at`

**`admin_quiz_questions` table** -- ordered questions per quiz
- `id` (uuid, PK)
- `quiz_id` (uuid, FK -> admin_quizzes)
- `sort_order` (int)
- `question_text` (text)
- `type` (text) -- 'single-select', 'multi-select', 'yes-no', 'slider'
- `options` (jsonb) -- array of `{ label, emoji?, score? }`
- `is_active` (boolean, default true)

**`admin_quiz_results` table** -- possible result outcomes per quiz
- `id` (uuid, PK)
- `quiz_id` (uuid, FK -> admin_quizzes)
- `result_key` (text) -- e.g. "introvert", "extrovert", "ambivert"
- `title` (text) -- "Introvert"
- `subtitle` (text) -- short label
- `description` (text) -- detailed result text
- `image_url` (text) -- result illustration
- `characteristics` (jsonb) -- string array
- `strengths` (jsonb) -- string array
- `weaknesses` (jsonb) -- string array
- `suggestions` (jsonb) -- string array of recommended actions
- `score_min` (int) -- score range lower bound
- `score_max` (int) -- score range upper bound

**`quiz_submissions` table** -- user answers and results
- `id` (uuid, PK)
- `user_id` (uuid, FK -> auth.users)
- `quiz_id` (uuid, FK -> admin_quizzes)
- `answers` (jsonb) -- full answer map
- `total_score` (int)
- `result_key` (text) -- matched result
- `completed_at` (timestamptz)
- `created_at`

### Admin Pages

**1. Quiz Center page (`/admin/quizzes`)**
- Grid of quiz cards showing cover, title, question count, status badge
- "New Quiz" button
- Each card has Edit, Preview, toggle active actions

**2. Quiz Editor (inline or separate route)**
- Form for title, slug, overview, description, cover upload, theme color
- Sortable question list with inline editing
- Result outcomes editor (key, title, description, score range, characteristics/strengths/weaknesses arrays)
- Preview button opens the user-facing quiz flow

### User-Facing Pages

**3. Quiz Library page (`/app/quizzes`)**
- 2-column grid of quiz cards (6:4 cover, title, "Take the test" CTA) -- matches the Dear Me screenshot layout

**4. Quiz Detail page (`/app/quiz/:slug`)**
- Hero image with colored background + title overlay
- White cards for "Overview" and "What you'll get" sections
- "Start test" button at bottom

**5. Quiz Flow (`/app/quiz/:slug/play`)**
- Reuses existing `OnboardingStepRenderer` question UI components (single-select, multi-select, yes-no)
- Compact header: quiz title + illustration peek, progress bar with "QUESTION N/M"
- Each answer selection records a score value

**6. Analyzing screen**
- Animated progress circle with percentage
- "Analyzing your answers" text
- Mascot illustration
- Auto-advances after ~3 seconds

**7. Results page**
- Header with quiz title + illustration
- Colored result card: "My Result" label + result title + illustration
- White cards for: Details, Characteristics, Strengths, Weaknesses
- "Share my result" button (native share API)
- Bottom bar: "Retake" + "Get suggested routine" buttons
- Result saved to `quiz_submissions`

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/...quiz_tables.sql` | Create 4 tables + RLS |
| `src/pages/admin/Quizzes.tsx` | Admin quiz list + editor |
| `src/pages/app/QuizLibrary.tsx` | User quiz grid |
| `src/pages/app/QuizDetail.tsx` | Quiz overview + start |
| `src/pages/app/QuizPlay.tsx` | Question flow + analysis + results |
| `src/components/admin/AdminNav.tsx` | Add "Quizzes" nav item |
| `src/App.tsx` | Add routes for admin + app quiz pages |

### Scoring Logic
Each option in a question carries a `score` value (integer). After all questions are answered, scores are summed. The result whose `score_min <= total <= score_max` is matched. This allows flexible personality-type mappings.

### Technical Notes
- Cover images uploaded via existing Supabase Storage bucket
- Quiz question UI components are reused directly from `OnboardingStepRenderer` (single-select, multi-select chips)
- The analyzing animation uses a circular SVG progress with framer-motion
- Share uses the Web Share API / Capacitor Share plugin
- Admin quiz editor follows the same patterns as existing admin managers (e.g., RoutineManagement, TasksBank)

