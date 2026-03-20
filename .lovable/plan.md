

## Plan: Auto-insert Routine Pro-Task in Edit Routine Sheet

### What
When a user opens the Edit Routine sheet and the routine has **more than 1 task**, automatically insert a "▶️ Play Routine" pro-task as the first item. It's selected by default but users can toggle it off. Single-task routines (like adding individual tools) are excluded.

### How

**File: `src/components/app/RoutinePreviewSheet.tsx`**

1. **Accept new props**: `routineBankId` (the routine's bank ID) passed from parent pages.

2. **Generate a synthetic pro-task**: When `tasks.length > 1`, create a synthetic `RoutinePlanTask` at the top of the list:
   - ID: `__pro_task_routine__` (synthetic, distinguishable)
   - Title: `"▶️ ${routineTitle}"` (or use the routine title with a Play emoji)
   - Icon: `▶️`
   - `pro_link_type`: `'routine'`
   - `pro_link_value`: the routine bank ID
   - `repeat_pattern`: `'daily'`

3. **Merge into task list**: Use `useMemo` to prepend the synthetic task to the real tasks array. It participates in the same selection/toggle logic as other tasks.

4. **Visual distinction**: Render the pro-task card with a subtle "Routine Launcher" label or a distinct style (e.g., a play icon badge) so users understand it opens the routine player.

5. **On save**: The synthetic pro-task flows through the existing `onSave(selectedTaskIds, editedTasks)` pipeline. The parent (`AppInspireDetail`, etc.) already handles `pro_link_type: 'routine'` tasks — no changes needed there.

**File: `src/pages/app/AppInspireDetail.tsx`**
- Pass `routineBankId={routine.id}` to `RoutinePreviewSheet`.

**Files with other RoutinePreviewSheet usages** (AppRoutinePlayer, AppReflections, AppAudioPlayer, AppChannelsList):
- These pass single synthetic tasks, so no `routineBankId` → pro-task won't appear (tasks.length ≤ 1 guard).

### Technical Details

- The synthetic task ID uses a `__pro_task_` prefix to avoid collision with real UUIDs
- The `tasks.length > 1` check on the **original** tasks array (before prepending) ensures single-tool additions are excluded
- The pro-task is included in `selectedTaskIds` by default via the existing `useEffect` sync

