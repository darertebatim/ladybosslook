

# Fix: Complete the Category-Based Weekly Review Alignment

## Problem
Three issues remain:

1. **Broken suggestion engine**: `WeekTaskSuggestionsStep` reads flow step options from `(window as any).__selfcareWeeklyReviewSteps` — which is **never set anywhere**. So `resolveCategories()` always returns `[]`, meaning wins/struggles/focus answers produce zero category matches. The entire suggestion logic is dead.

2. **Non-selfcare categories in CLUSTER_MAP**: `Empowered`, `MoneyMindset`, `CeoWellness` are still in the map — they should be removed so only the 14 self-care categories are tracked.

3. **Flow options already correct**: The `selfcare-weekly-review.ts` flow already has category slugs in `description` fields (e.g., `sleep`, `TidyUp`, `calm`). No changes needed there.

## Changes

### 1. Fix suggestion engine — import flow directly
**File: `src/components/app/weekly-review/WeekTaskSuggestionsStep.tsx`**

- Import `selfcareWeeklyReviewFlow` from the flow definition file
- Replace the broken `(window as any).__selfcareWeeklyReviewSteps` with `selfcareWeeklyReviewFlow.steps`
- `resolveCategories` will now correctly look up the `description` (category slug) for each selected label

### 2. Remove non-selfcare categories from CLUSTER_MAP
**File: `src/utils/selfcare-scoring.ts`**

Remove line 67: `Empowered: 'mind', MoneyMindset: 'mind', CeoWellness: 'body'`

Final map: only the 14 self-care categories + `easy-win`.

### Files
- **Modify**: `src/components/app/weekly-review/WeekTaskSuggestionsStep.tsx` — fix the import
- **Modify**: `src/utils/selfcare-scoring.ts` — remove 3 non-selfcare entries

