

## Multi-Select & "Build My Routine" Feature for Tasks Bank

### Overview
Add a multi-select mode to `/app/tasksbank` so users can pick multiple tasks, then tap "Build My Routine" to open the existing Routine Builder pre-loaded with those tasks.

### How It Works
1. **Tapping a task card** toggles its selection (checkbox overlay appears on selected cards)
2. When 1+ tasks are selected, a sticky **"Build My Routine (N)"** button appears at the bottom above the nav bar
3. Tapping the button opens `RoutineBuilderSheet` at **Step 2** with:
   - Default routine name: "My Self-Care Routine"
   - Default emoji: ✨
   - Pre-populated task list converted from `TaskTemplate[]` → `BuilderTask[]`
4. User can edit name/emoji on step 1 (go back), reorder/edit tasks on step 2, then save as usual

### Technical Changes

**1. `src/pages/app/AppTasksBank.tsx`**
- Add `selectedTasks` state (`Set<string>`) to track selected task IDs
- Add `selectionMode` — activated on first task tap (or always on)
- Change `TaskTemplateCard` `onAdd` to toggle selection instead of instant-add
- Add selected visual state (checkmark overlay or border highlight) on cards
- Add sticky bottom button: "Build My Routine (N)" when selections exist
- Import and render `RoutineBuilderSheet` with `initialTasks` mapped from selected templates
- Convert `TaskTemplate` → `BuilderTask` (map fields: id, title, emoji, color, repeat_pattern, description, pro_link_type, pro_link_value, goal fields, time_period, category)
- Wire `onComplete` to the same routine-saving logic used in `AppRoutinePlayer`

**2. `src/components/app/TaskTemplateCard.tsx`**
- Add optional `isSelected` and `selectable` props
- When selectable, show a checkbox/checkmark instead of the CalendarPlus button
- Add selected state styling (e.g., ring/border highlight)

**3. `src/components/app/RoutineBuilderSheet.tsx`**
- No changes needed — already accepts `initialTasks`, `initialTitle`, `initialEmoji` props

### UI Details
- Selected cards get a colored border/ring + checkmark replacing the add button
- Bottom button: rounded, primary color, full-width with padding, shows count badge
- Button positioned with `fixed bottom-20` (above nav bar) with safe area padding
- Clear selection option in header when in selection mode

