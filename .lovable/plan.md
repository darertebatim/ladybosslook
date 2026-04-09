

# Fix: Align Weekly Review with Self-Care Quiz Categories

## The Problem
The selfcare quiz works with **14 specific categories** (calm, sleep, nutrition, movement, Exercise, hygiene, Presence, connection, self-kindness, gratitude, productivity, TidyUp, Evening, LovedOnes). The weekly review ignores these and maps everything to 4 broad clusters (body/mind/environment/people), then tries to find tasks by cluster. This loses all specificity and often returns nothing useful.

## The Fix

### 1. Rewrite the question options to map directly to selfcare categories
**File: `src/data/onboarding-flows/selfcare-weekly-review.ts`**

Replace the current `wr-selfcare-wins` and `wr-struggled` options with ones that directly reference the 14 selfcare categories (using the `description` field as the category key, not the cluster).

For example:
- "Slept well" -> description: `sleep` (not `body`)
- "Practiced mindfulness" -> description: `calm` (not `mind`)
- "Kept my space tidy" -> description: `TidyUp` (not `environment`)

Also update `wr-focus-next` options to carry category keys.

### 2. Rewrite the suggestion engine to use categories, not clusters
**File: `src/components/app/weekly-review/WeekTaskSuggestionsStep.tsx`**

Remove the hardcoded `WINS_CLUSTER_MAP` and `STRUGGLED_CLUSTER_MAP`. Instead:

- Read `wr-selfcare-wins` answers and extract their category from the option's `description` field (which now holds the actual category slug like `sleep`, `calm`, `TidyUp`)
- Read `wr-struggled` answers the same way
- Query `admin_task_bank` matching `category` directly against these slugs
- For wins: suggest tasks from the same category to reinforce ("Keep going with Sleep")
- For struggles: suggest tasks from that category as alternatives ("Help with Calm")
- Keep gap-based (weak clusters from report), replacement, and expansion logic

### 3. Remove old legacy `wr-felt-good` / `wr-focus` tag matching
The old `wr-felt-good:X` and `wr-focus:X` tag-based matching is dead code in the selfcare flow. Remove it from the suggestion logic (or gate it behind a flow check).

### 4. Update `wr-focus-next` to carry category slugs
Each focus option maps to a category so the suggestion engine can use it:
- "Better sleep" -> `sleep`
- "Calm my mind" -> `calm`
- "Tidy my space" -> `TidyUp`

### 5. Fix cluster breakdown to also use the 14 categories
**File: `src/components/app/weekly-review/WeekReportStep.tsx`**

The `CLUSTER_MAP` is missing some admin categories. Add any missing ones (Empowered, MoneyMindset, CeoWellness, etc.) to ensure all admin_task_bank categories map to a cluster. This ensures the report step's cluster breakdown covers all user tasks.

## Files Modified
- `src/data/onboarding-flows/selfcare-weekly-review.ts` — option descriptions become category slugs
- `src/components/app/weekly-review/WeekTaskSuggestionsStep.tsx` — category-based matching replaces cluster-based
- `src/utils/selfcare-scoring.ts` — expand CLUSTER_MAP with missing admin categories

