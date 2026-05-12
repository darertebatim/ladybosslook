---
name: Badge Eligibility Rules
description: Coin badge tiers (bronze/silver/gold) calculated as percentage of planner tasks; routine child tasks and program events excluded
type: feature
---
Daily coin badge tiers in `useWeeklyTaskCompletion` / `useDateRangeTaskCompletion`:
- **None**: 0 completed or 0 applicable tasks
- **Bronze**: ≥1 completed (under 50%)
- **Silver**: ≥50% of applicable tasks completed
- **Gold**: 100% of applicable tasks completed

Denominator excludes:
- Routine child tasks (`source_routine_id != null`) — only the routine launcher (`pro_link_type='routine'`) counts, completing when the routine is fully done.
- Program event tasks — never stored in `user_tasks`, naturally excluded.
- Skipped tasks for that date.
