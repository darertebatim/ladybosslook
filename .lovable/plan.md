

## "What's Missing?" Self-Care Diagnostic Quiz

A 5-screen onboarding-style flow that identifies users' neglected self-care areas through 3 natural questions, then uses AI to generate personalized task suggestions from the 15 self-care tagged categories.

### Quiz Flow

```text
Screen 1 — Hook (motivational)
Screen 2 — "What's draining you?" (single-select)
Screen 3 — "Your perfect morning" (single-select)  
Screen 4 — "Be honest..." (multi-select of neglected habits)
Screen 5 — AI Diagnosis + Task Suggestions (new step type)
```

**Screen 1 — Hook**: "Your problem isn't productivity." → "It's that one part of your life is quietly falling apart." CTA: "Let's find out →"

**Screen 2 — What's draining you?** (single-select, 4 options):
- 😰 Stress & anxiety → calm, sleep
- 😴 Constant tiredness → sleep, nutrition, movement
- 📱 Screen overload → Presence, calm
- 😔 Feeling disconnected → connection, self-kindness

**Screen 3 — Your perfect morning** (single-select, 4 options):
- ☀️ Peaceful & slow → calm, gratitude
- 💪 Active & energized → Exercise, movement
- 🧴 Fresh & put-together → hygiene, self-kindness
- 📋 Organized & productive → productivity, TidyUp

**Screen 4 — "Be honest... which of these have you been skipping?"** (multi-select, 8 chips):
- 😴 Getting enough sleep → sleep, Night
- 💧 Drinking water → nutrition
- 🚶 Moving your body → movement, Exercise
- 🧴 Skincare / grooming → hygiene
- 🧘 A moment of silence → calm, Presence
- 💬 Connecting with someone → connection
- 🧹 Tidying your space → TidyUp
- 💕 Doing something kind for yourself → self-kindness, gratitude

**Screen 5 — AI Diagnosis** (new type: `selfcare-diagnosis`):
- 3-second "analyzing" animation
- AI generates personalized 2-3 sentence insight based on: gap categories + (for returning users) previous quiz results and task completion stats in those categories
- Shows top 2-3 gap categories with emoji
- Displays 3-5 suggested task cards from `admin_task_bank` filtered by those categories
- "Add to My Planner" action on each task

### AI Context for Returning Users

When a user has taken the quiz before, the diagnosis edge function will also receive:
- **Previous quiz answers** from `selfcare_quiz_results` table
- **Task completion stats** per category (how many tasks completed in each gap category in the last 30 days) from `task_completions` joined with `user_tasks` → `admin_task_bank`
- This lets AI say things like "Last time you were skipping sleep — looks like you've improved there! But connection is still a gap."

### Technical Plan

**1. New DB table**: `selfcare_quiz_results`
- `id` (uuid), `user_id` (uuid, FK profiles), `answers` (jsonb), `gap_categories` (text[]), `ai_insight` (text), `suggested_task_ids` (uuid[]), `created_at` (timestamptz)
- RLS: users can read/insert their own rows

**2. New edge function**: `selfcare-diagnosis`
- Receives: quiz answers, user_id
- Fetches from DB: previous quiz results, task completion counts per self-care category (last 30 days)
- Calls Lovable AI Gateway (Gemini Flash) to generate personalized insight
- Returns: gap categories, AI insight text, suggested task IDs from `admin_task_bank`
- Saves result to `selfcare_quiz_results`

**3. New flow file**: `src/data/onboarding-flows/selfcare-quiz.ts`
- 5 steps using existing types (motivational, single-select, multi-select) + new `selfcare-diagnosis`
- Each option's `description` field stores mapped category slugs

**4. New step type + component**:
- Add `'selfcare-diagnosis'` to `OnboardingStepType`
- Create `src/components/app/selfcare-quiz/SelfCareDiagnosisStep.tsx`
  - Reads answers from previous steps
  - Calls `selfcare-diagnosis` edge function
  - Shows loading → AI insight → category badges → task cards
  - "Add to Planner" button per task (reuses existing task-add logic)

**5. Wire it up**:
- Register in `OnboardingStepRenderer.tsx` switch
- Add to `allFlows` in `AppOnboarding.tsx`
- Add to admin `Onboarding.tsx` for preview
- Add entry banner in `AppTasksBank.tsx`: "Not sure where to start? Take the quiz ✨"

### Files to Create
- `supabase/migrations/...selfcare_quiz_results.sql`
- `supabase/functions/selfcare-diagnosis/index.ts`
- `src/data/onboarding-flows/selfcare-quiz.ts`
- `src/components/app/selfcare-quiz/SelfCareDiagnosisStep.tsx`

### Files to Modify
- `src/types/onboarding.ts` — add `'selfcare-diagnosis'` step type
- `src/components/admin/onboarding/OnboardingStepRenderer.tsx` — render new step
- `src/pages/app/AppOnboarding.tsx` — register flow
- `src/pages/admin/Onboarding.tsx` — register for preview
- `src/pages/app/AppTasksBank.tsx` — add quiz entry banner

