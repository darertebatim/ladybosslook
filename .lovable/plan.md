

## Add "Project" as Third Routine Type

**Concept**: A "Project" routine has ordered/sequential tasks that lead toward a specific goal — like a challenge but without the daily drip mechanic. Tasks have a fixed order (Step 1, Step 2, Step 3...) and users complete them sequentially at their own pace.

### Key Difference from Existing Types

| Type | Tasks | Pace | End |
|------|-------|------|-----|
| **Normal** | Independent, each has own repeat | Flexible | Ongoing |
| **Challenge** | Sequential by day (Day 1, 2...) | 1/day drip | After N days |
| **Project** | Sequential steps (Step 1, 2...) | Own pace | When all steps done |

### Changes

#### 1. Database: `routines_bank.schedule_type`
No schema migration needed — `schedule_type` is already a `TEXT` column. We just start storing `'project'` as a new value.

#### 2. Admin Builder (`RoutinesBank.tsx`)
- Add `'project'` to the `schedule_type` union type (`'daily' | 'challenge' | 'project'`)
- Add third button in the "Routine Type" grid: `{ value: 'project', label: 'Project', desc: 'Ordered steps toward a goal', icon: '🎯' }` — change grid to `grid-cols-3`
- For project type tasks: show "Step N" label (similar to challenge's "Day N" but labeled "Step") and enforce ordering
- New tasks auto-get `step_number` (reuse `drip_day` field or `task_order`)
- Hide challenge-specific fields (badge, start mode options) for project type; optionally show a "Goal" text field

#### 3. Task Schedule Config (`renderTaskScheduleConfig`)
- When `schedule_type === 'project'`, render a "Step N" indicator (similar to challenge's "Day N")
- Tasks don't have repeat settings — each is a one-time step

#### 4. Routine Card Badge (`RoutinesBank.tsx` list)
- Show `🎯 Project` badge alongside existing `🔥 Challenge` badge when `schedule_type === 'project'`

#### 5. User-Facing Discovery (`AppInspire.tsx`, `AppRoutineCategory.tsx`)
- Add project routines to the discovery feed (they already show since they're in `routines_bank`)
- Optionally add a "🎯 Projects" filter tab alongside "🔥 Challenges"

#### 6. Adoption Logic (`useAddRoutinePlan.tsx` / routine adoption hooks)
- When `schedule_type === 'project'`: create tasks with `repeat_pattern: 'none'` (one-time), ordered by `task_order`
- Tasks get sequential `order_index` so they appear in order in the planner

#### 7. Form Data Defaults
- When switching to project type: set `end_mode` to `'never'` (user completes at own pace), clear challenge-specific fields
- Default new project tasks to `is_once: true`

### Files to Edit
1. **`src/components/admin/RoutinesBank.tsx`** — add project type option, task step config, card badge
2. **`src/pages/app/AppInspire.tsx`** — add project filter option
3. **`src/pages/app/AppRoutineCategory.tsx`** — handle project type in display
4. **`src/hooks/useRoutinePlans.tsx`** — handle project schedule_type in adoption
5. **`src/hooks/useUserChallenges.tsx`** — exclude project type (it's not a challenge)

