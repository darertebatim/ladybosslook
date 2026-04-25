## What’s going wrong

I found likely root causes for all 3 issues, and they are deeper than just “add more offline code.”

1. **Reflections not saving offline**
   - The free-form reflection screen queues the reflection row correctly.
   - But after saving, it always calls `autoCompleteJournal()`.
   - `autoCompleteJournal()` still does live Supabase reads/writes only, with no offline fallback.
   - So the reflection row may queue, but the follow-up completion flow can hang/fail and block the “Done” experience.
   - The 4-card celebration sheet is probably **not** the root cause. It opens only after `onSuccess`; the fragile part is the forced pro-task auto-complete call before that flow settles.

2. **Tasks getting hidden offline**
   - The main task list is partly protected, but not fully.
   - `useAllActiveTasks()` and `useCompletionsForDate()` already use cached data offline.
   - However, Home also depends on other task-related queries that still return live-only structures, especially:
     - `useCarryForwardTasks()`
     - `useSkipsForDate()`
   - Those return `Set` objects and do not have offline-safe cached fallbacks.
   - This project memory explicitly warns that persisted data must use plain objects/arrays, not `Map`/`Set`, because app restoration can corrupt behavior.
   - When these queries fail or rehydrate poorly offline, the Home filter pipeline can evaluate as empty and make tasks disappear.

3. **Emoji turning into question marks offline**
   - `FluentEmoji` always tries to load emoji images from a CDN.
   - Offline, image loading fails, so it falls back to native text emoji.
   - But the app font stack is basically `Inter`, without explicit emoji fonts in the CSS runtime stack.
   - On iPhone/native webview, that can render fallback glyphs badly or as question-mark boxes for some emojis.
   - So this is not a data bug; it is a fallback rendering bug.

## Plan

### Phase A — Make offline reflection save truly self-contained
- Update the free-form reflection save flow so the reflection record itself is the success path.
- Decouple offline reflection save from `autoCompleteJournal()` so the note can finish and show success even without internet.
- If a journal-linked task needs completion, queue that as a separate offline-safe follow-up instead of blocking save.
- Ensure Reflection Notes immediately show an optimistic local item after offline save.

### Phase B — Remove unstable offline task filters
- Refactor `useCarryForwardTasks()` and `useSkipsForDate()` to be offline-safe.
- Replace persisted `Set`-shaped query results with plain arrays/objects at the query layer, then convert to `Set` only in-memory where needed.
- Add the same cached-offline fallback pattern already used in `useAllActiveTasks()` and `useCompletionsForDate()`.
- Audit Home task filtering so if secondary queries fail offline, the base task list still renders instead of collapsing to empty.

### Phase C — Fix emoji fallback for offline/native
- Change `FluentEmoji` so offline/native fallback is deterministic.
- Prefer native emoji immediately when offline instead of attempting dead CDN loads first.
- Add an emoji-capable fallback font stack for native emoji rendering.
- Keep CDN 3D emoji when online, but guarantee clean native emoji when offline.

### Phase D — QA the full offline path end-to-end
- Verify this sequence specifically:
  1. open app online
  2. warm data
  3. go offline
  4. complete task
  5. save reflection
  6. background app
  7. reopen offline
  8. confirm tasks still visible, reflection still visible, emoji still intact
- Then reconnect and confirm queued writes sync without changing the visible offline state.

## Technical details

Files most likely to change:
- `src/pages/app/AppFreeFormReflection.tsx`
- `src/hooks/useAutoCompleteProTask.tsx`
- `src/hooks/useTaskPlanner.tsx`
- `src/pages/app/AppHome.tsx`
- `src/components/ui/FluentEmoji.tsx`
- `src/lib/fluentEmoji.ts`
- `src/index.css`
- possibly `src/lib/offline/executors/taskCompletionExecutors.ts`

Key implementation decisions:
- Do not persist `Set` or `Map` in React Query offline cache.
- Reflection save must not depend on a second online-only mutation.
- Emoji fallback should branch on offline state before network image load.

## Expected outcome
- Offline reflection notes save and close reliably.
- Task list no longer disappears after offline use or offline relaunch.
- Emoji no longer degrade into question marks when offline.
- The celebration sheet can remain, but it will no longer be in the critical path for saving.