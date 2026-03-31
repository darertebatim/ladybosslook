

# Redesign Task Drafts → "Projects" (Mobile-Native Style)

## What's Changing

1. **Rename & reroute**: "Task Drafts" → "Projects", `/app/tasksbank/drafts` → `/app/projects`
2. **Remove all hover effects** (violates project rules for mobile-first Capacitor app)
3. **Redesign to match app's native card-based style** — larger touch targets, rounded cards, proper spacing

## Technical Changes

### 1. Route & Navigation Updates
- **`src/App.tsx`**: Change route from `tasksbank/drafts` to `projects`
- **`src/pages/app/AppTasksBank.tsx`**: Update navigate path to `/app/projects`

### 2. Full Redesign of `src/pages/app/AppTaskDrafts.tsx`
- **Header**: Rename title to "Projects"
- **Section cards**: Each project section gets a `rounded-2xl bg-muted/30 p-4` card container (like other app cards) instead of bare dividers
- **Section title**: Larger font (`text-xl font-bold`), delete button with larger touch target (`w-10 h-10`), no hover — use `active:scale-95 active:text-destructive`
- **Task items**: Taller rows with `py-2.5` padding, circle button enlarged to `w-6 h-6`, text `text-base` instead of `text-sm`, delete uses `active:text-destructive` instead of `opacity-0 group-hover:opacity-100`
- **Add task input**: Larger, matching sizing
- **Send-to-planner sheet**: Date buttons get `py-4` with larger icons (`w-5 h-5`), use `active:scale-95` instead of `hover:bg-primary/10`
- **Sent items section**: Slightly larger text
- **Empty state**: Keep emoji-centered pattern but larger text

### 3. Remove All Hover Classes
Replace every instance of `hover:` with appropriate `active:` alternatives throughout the file.

### Files Modified
- `src/pages/app/AppTaskDrafts.tsx` — full redesign + rename
- `src/App.tsx` — route path change
- `src/pages/app/AppTasksBank.tsx` — navigation path change

