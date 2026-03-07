

# Performance Optimization Plan for v1.2.02

## Current State

AppHome.tsx is **1,294 lines** with 25+ `useState` hooks, 50+ imports, and multiple heavy sub-components. The home page fires 4-5 parallel Supabase queries on top of the consolidated RPC. NativeAppLayout runs 10+ hooks on every mount (notification schedulers, trackers, etc.). The app already has good foundations (lazy loading, RPC consolidation, query caching), but there are clear wins remaining.

## Proposed Optimizations

### 1. Split AppHome into smaller components
The 1,294-line monolith causes large re-renders on any state change. Extract into:
- `HomeHeader` — calendar strip, month selector, streak badge
- `HomeTaskList` — task filtering, sortable list, coach marks
- `HomeCelebrations` — all celebration/modal state (streak, badge, gold, goal)
- `HomeBottomDashboard` — FAB, active rounds carousel

This isolates re-renders. When a celebration modal opens, only `HomeCelebrations` re-renders — not the entire task list.

### 2. Reduce unnecessary re-renders with memo boundaries
- Wrap `TaskCard`, `ProgramEventCard`, `RoutineBankCard` renders in `React.memo` (if not already)
- Memoize the week strip day buttons (currently re-created on every render — 21 buttons)
- Move `weekDays` computation out of component or use `useMemo` with stable deps (already done, but the inline `.map()` in JSX re-creates elements)

### 3. Defer non-critical layout hooks in NativeAppLayout
Currently all 10+ hooks run immediately on mount. Defer non-essential ones:
- `useSmartActionNudges` — delay 10s
- `usePeriodNotifications` — delay 8s
- `useAppInstallTracking` — delay 5s
- `useAppsFlyerTracking` — delay 5s

This frees the main thread during initial render for smoother perceived load.

### 4. Reduce home page query waterfall
`useNewHomeData` makes the RPC call, then fires 3 more parallel queries, then conditionally fires a `program_sessions` query. The sessions query can be folded into the RPC function to eliminate this waterfall step.

### 5. Preload critical route chunks
AppHome is lazy-loaded. For the native app, preload it immediately since it's always the first screen:
```ts
// In main.tsx or App.tsx for native
if (isNativeApp()) {
  import('@/pages/app/AppHome');
}
```

### 6. Optimize the week strip scroll handler
The scroll handler uses a 100ms debounce but recalculates on every scroll event. Add `passive: true` to the scroll listener and use `requestAnimationFrame` for the debounced handler.

### 7. Reduce localStorage reads on every render
Multiple `useState` initializers read `localStorage` synchronously (welcome card, dismissed routines, celebration flags). Consolidate into a single read on mount.

### 8. Version bump
Update `__APP_VERSION__` in `vite.config.ts` from `1.1.04` to `1.2.02`.

## Impact Summary

| Optimization | Impact | Effort |
|---|---|---|
| Split AppHome | High — fewer re-renders | Medium |
| Defer layout hooks | High — faster initial paint | Low |
| Preload home chunk | Medium — eliminates lazy load delay | Low |
| Fold sessions into RPC | Medium — removes waterfall | Low |
| Memo boundaries | Medium — smoother interactions | Low |
| Consolidate localStorage | Low — cleaner code | Low |
| Version bump | Required | Trivial |

## Files to Modify
- `src/pages/app/AppHome.tsx` — split into sub-components
- `src/layouts/NativeAppLayout.tsx` — defer hooks
- `src/App.tsx` or `src/main.tsx` — preload home chunk
- `supabase/functions/` or RPC — fold sessions query
- `vite.config.ts` — version bump
- New files: `src/components/app/HomeHeader.tsx`, `HomeCelebrations.tsx`, `HomeTaskList.tsx`

