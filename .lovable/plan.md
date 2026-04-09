

# Phase 1 Revised: Weekly Review aligned with Self-Care + Expansion + Cleanup

## Overview
Transform Weekly Review from a generic task counter into a self-care coach that:
1. Shows performance by cluster (Body/Mind/Environment/People)
2. Detects weak areas from skipped/missed tasks
3. Suggests better alternatives for struggled tasks
4. Introduces one "expansion" task from an untouched cluster
5. **New**: Offers to remove tasks the user consistently skips

## Flow (updated from 6 to 8 steps)

```text
1. wr-report        — Stats + cluster breakdown (Body 80%, Mind 40%...)
2. wr-satisfaction   — Satisfaction slider (unchanged)
3. wr-felt-good      — Multi-select reflections (unchanged)
4. wr-focus-next     — Multi-select focus picks (unchanged)
5. wr-cleanup        — NEW: "These goals didn't stick" — offer to remove/replace skipped tasks
6. wr-task-suggestions — Smart suggestions (gap-based + 1 expansion task)
7. wr-celebration    — Done screen (unchanged)
```

Step 5 (old task-suggestions) becomes step 6, and the new cleanup step slots in at 5.

---

## Technical Changes

### 1. Export cluster mapping utility
**File: `src/utils/selfcare-scoring.ts`**

- Export `CLUSTER_MAP` (currently private)
- Add `mapTaskToCluster(tag: string): ClusterType | null` — maps user_tasks.tag values to body/mind/environment/people
- Add `CLUSTER_LABELS` and `CLUSTER_EMOJIS` constants for display

### 2. Enrich WeekReportStep with cluster breakdown
**File: `src/components/app/weekly-review/WeekReportStep.tsx`**

- Fetch `task_completions` joined with `user_tasks` (id, tag) for past 7 days
- Fetch `task_skips` joined with `user_tasks` (id, tag) for past 7 days
- Group by cluster using `mapTaskToCluster`
- Calculate completion rate per cluster: `completed / (completed + skipped)`
- Display 4 cluster pills below stat cards showing percentage
- Highlight weakest cluster with a callout like "Your Mind goals need a little love"
- Store `wr-weak-clusters` and `wr-skipped-tasks` in answers via `onAnswer` prop

### 3. New "Cleanup" step — remove struggling tasks
**New file: `src/components/app/weekly-review/WeekCleanupStep.tsx`**

- Reads `wr-skipped-tasks` from answers (task IDs + titles of tasks skipped 3+ times in the past week)
- Shows a list of these tasks with toggles: "Remove" / "Replace" / "Keep"
- "Remove" marks the task as `is_active: false` in user_tasks
- "Replace" flags the task for the suggestion step to find an alternative in the same cluster
- "Keep" does nothing
- If no tasks were skipped frequently, show a congratulatory message and auto-advance
- Sticky bottom button: "Continue"

### 4. Smarter suggestion engine with expansion
**File: `src/components/app/weekly-review/WeekTaskSuggestionsStep.tsx`**

Current logic kept (wr-felt-good/wr-focus tag matching) but enhanced:

**Gap-based suggestions:**
- Read `wr-weak-clusters` from answers
- Query `admin_task_bank` where category matches weak cluster categories
- Prioritize these in the suggestion list with reason: "Recommended — your [cluster] needs attention"

**Replacement suggestions:**
- Read tasks flagged for replacement from cleanup step
- Find alternatives in `admin_task_bank` with the same category/cluster but different task
- Label: "Try this instead of [old task]"

**Expansion (1 task max):**
- Query user's active `user_tasks` and map all tags to clusters
- Find clusters with zero active tasks
- Pick one easy task from `admin_task_bank` in the untouched cluster
- Label: "Explore something new" with a distinct visual badge
- Growth cap: only add 1 expansion task, and only if user's total active tasks are under a threshold (e.g., 12)

**Final list:** up to 5 suggestions total (2-3 gap/replacement + 1 expansion + existing answer-based)

### 5. Update flow definition
**File: `src/data/onboarding-flows/weekly-review.ts`**

- Add new step at position 5:
  ```
  { id: 'wr-cleanup', type: 'week-cleanup', title: "These goals didn't stick this week", subtitle: "It's okay — let's make room for what works better", buttonLabel: 'Continue' }
  ```
- Update wr-task-suggestions subtitle to "Based on your self-care balance"

### 6. Register new step type
**File: `src/types/onboarding.ts`** — add `'week-cleanup'` to `OnboardingStepType`
**File: Step renderer** — add case for `week-cleanup` rendering `WeekCleanupStep`

### 7. Wire onAnswer through WeekReportStep
Currently `WeekReportStep` doesn't accept `onAnswer`. Add it so cluster data flows to subsequent steps via the existing answers mechanism.

---

## Data Flow

```text
WeekReportStep
  ├─ completions + skips → cluster scores
  ├─ answers['wr-weak-clusters'] = ['mind', 'people']
  └─ answers['wr-skipped-tasks'] = [{id, title, tag, skipCount}]
       │
       ▼
WeekCleanupStep (NEW)
  ├─ shows frequently skipped tasks
  ├─ user picks: remove / replace / keep
  └─ answers['wr-replace-tasks'] = [{id, cluster}]
       │
       ▼
WeekTaskSuggestionsStep
  ├─ existing: wr-felt-good / wr-focus matches
  ├─ gap-based: tasks from weak clusters
  ├─ replacements: alternatives for removed tasks
  └─ expansion: 1 easy task from untouched cluster
```

## Files Summary
- **Modify**: `src/utils/selfcare-scoring.ts` — export CLUSTER_MAP, add helpers
- **Modify**: `src/components/app/weekly-review/WeekReportStep.tsx` — cluster breakdown + onAnswer
- **Create**: `src/components/app/weekly-review/WeekCleanupStep.tsx` — skip cleanup page
- **Modify**: `src/components/app/weekly-review/WeekTaskSuggestionsStep.tsx` — gap + expansion logic
- **Modify**: `src/data/onboarding-flows/weekly-review.ts` — add cleanup step
- **Modify**: `src/types/onboarding.ts` — add step type
- **Modify**: Step renderer — register new component

