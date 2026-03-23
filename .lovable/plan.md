

# Haptic Feedback Enhancement Plan

## Current State
Haptics are already used in **109 files** — primarily on keypads, celebrations, form inputs, and some buttons. However, many core interactions lack haptic feedback, making the app feel flat on silent iPhones.

## Missing Haptic Areas

### 1. Bottom Navigation Bar (NativeAppLayout.tsx)
- **No haptics on tab taps** — this is the most-tapped area of the app
- Add `haptic.light()` on every tab tap, `haptic.medium()` on home re-tap

### 2. Tab/Segment Switchers
Files with animated switchers (home view toggle, filter tabs) that lack haptics on selection change:
- `AppHome.tsx` — Routine Players / My Tasks switcher
- `AppInspire.tsx` — category tabs
- `AppWatch.tsx` — category/filter tabs  
- `AppPlayer.tsx` — section tabs
- `AppPrograms.tsx` — tab switches
- `AppMoodHistory.tsx`, `AppJournal.tsx` — filter tabs

### 3. Pull-to-Refresh / Scroll Events
- Add `haptic.light()` at pull-to-refresh trigger threshold (if implemented)

### 4. Task Interactions (TaskCard.tsx)
- Task completion checkbox tap — already has haptics via checkbox component, but the card's `onTap` handler may not
- Subtask toggle — verify haptic on toggle

### 5. Routine Cards & Action Cards
- `RoutineBankCard.tsx`, `WelcomeRoutineCard.tsx`, `ChallengeRoutineCard.tsx` — tapping to open
- `ToolCard.tsx` — tool selection
- `ProgramCard.tsx`, `EnrolledProgramCard.tsx` — program cards

### 6. Sheet/Modal Open Triggers
- Many buttons that open sheets (settings, filters, pickers) lack haptics
- `BackButton.tsx` — navigation back

### 7. Destructive Actions
- Delete confirmations should use `haptic.warning()` before confirm
- `haptic.error()` on failed actions (network errors, validation failures)

### 8. Long Press / Context Menus
- Task long-press for reorder already has `haptic.medium()` — good
- Any other long-press triggers should get `haptic.medium()`

### 9. Toast/Notification Feedback
- Success toasts should pair with `haptic.success()`
- Error toasts should pair with `haptic.error()`

## Implementation Approach

### Batch 1: High-Impact Global Components
1. **Bottom nav tabs** — `haptic.light()` in `NativeAppLayout.tsx` Link onClick
2. **BackButton** — `haptic.light()` on tap
3. **UI Switch component** — already has haptics (confirmed)
4. **UI Checkbox** — already has haptics (confirmed)

### Batch 2: View Switchers & Tabs
Add `haptic.selection()` to all tab/segment switchers across ~8 pages

### Batch 3: Card Taps & Navigation
Add `haptic.light()` to all tappable cards that navigate:
- RoutineBankCard, ToolCard, ProgramCard, etc.

### Batch 4: Celebrations & Feedback
- Ensure all celebration screens fire `haptic.success()`
- Add `haptic.warning()` to destructive action confirmations
- Add `haptic.error()` alongside error toasts

### Batch 5: Micro-interactions
- Star ratings (`haptic.selection()` per star)
- Slider value changes
- Countdown timer completion
- Fasting start/stop

## Estimated Files to Touch
~25-30 files, mostly adding 1-2 line `haptic.*()` calls to existing handlers.

## Haptic Type Guide (for consistency)
| Interaction | Haptic |
|---|---|
| Tab/nav tap | `haptic.light()` |
| Segment/filter switch | `haptic.selection()` |
| Card tap (navigate) | `haptic.light()` |
| Button (primary action) | `haptic.light()` |
| Destructive action | `haptic.warning()` |
| Celebration/completion | `haptic.success()` |
| Error/failure | `haptic.error()` |
| Drag start | `haptic.medium()` |
| Picker/wheel change | `haptic.selection()` |

