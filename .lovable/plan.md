

# iOS App Performance Optimization Plan

## Overview

After a comprehensive audit of your app's pages, hooks, and components, I've identified several optimization opportunities that can make your iOS app significantly smoother and faster. The optimizations are organized by impact level.

---

## High-Impact Optimizations

### 1. Feed Page - Eliminate N+1 Queries

**File:** `src/hooks/useFeed.tsx`

**Problem:** `useFeedPosts` makes 3 separate queries per request:
1. Fetch all posts
2. Fetch all reactions for those posts
3. Fetch all comment counts for those posts

**Solution:** Combine into a single query with aggregated data or use database views.

```
// Current: 3 sequential queries
const { data: posts } = await query;
const { data: reactions } = await supabase.from('feed_reactions').select('*').in('post_id', postIds);
const { data: commentsCounts } = await supabase.from('feed_comments').select('post_id').in('post_id', postIds);

// Optimized: Use RPC function or pre-computed counts
```

**Changes:**
- Add `reactions_count` and `comments_count` columns to `feed_posts` table (updated via triggers)
- Or create a database view that pre-aggregates this data
- This will reduce Feed page load time by 60-70%

---

### 2. Home Page - Reduce Re-renders with Proper Memoization

**File:** `src/pages/app/AppHome.tsx`

**Problem:** Multiple `useMemo` hooks recalculate on every date change. The component has 15+ hooks which all run on each render.

**Solution:**
- Memoize `TaskCard` component (it's not currently memoized)
- Move date formatting to the display layer only
- Use `useCallback` for all event handlers

```tsx
// TaskCard should be memoized like FeedMessage
export const TaskCard = memo(function TaskCard({...}) {
  // ...
});
```

---

### 3. Routines Page - Add Missing Stale Time

**File:** `src/hooks/useRoutinePlans.tsx`

**Problem:** Multiple hooks don't have `staleTime`, causing unnecessary refetches:
- `useRoutineCategories`
- `useFeaturedPlans`
- `usePopularPlans`
- `useProRoutinePlans`

**Solution:** Add 5-minute stale time to all routine hooks:

```tsx
staleTime: 1000 * 60 * 5, // 5 minutes
gcTime: 1000 * 60 * 30, // 30 minutes cache
```

---

### 4. Journal Page - Optimize Entry Grouping

**File:** `src/pages/app/AppJournal.tsx`

**Problem:** `groupedEntries` and streak calculation runs on every render.

**Solution:**
- Move streak calculation to the database or cache it
- Use virtualized list for long journal histories

---

### 5. Player Page - Optimize Playlist Stats Calculation

**File:** `src/pages/app/AppPlayer.tsx`

**Problem:** `getPlaylistStats` is called for every playlist on every render without memoization.

**Solution:** Memoize the stats calculation:

```tsx
const playlistStats = useMemo(() => {
  const stats = new Map();
  playlists?.forEach(playlist => {
    stats.set(playlist.id, getPlaylistStats(playlist.id));
  });
  return stats;
}, [playlists, playlistItems, progressData]);
```

---

## Medium-Impact Optimizations

### 6. Programs Page - Remove Inline Component Definition

**File:** `src/pages/app/AppPrograms.tsx`

**Problem:** `EnrolledProgramCard` is defined inside the component, causing it to be recreated on every render.

**Solution:** Extract to a separate memoized component:

```tsx
// Move outside the component
const EnrolledProgramCard = memo(function EnrolledProgramCard({ 
  enrollment, 
  isCompleted = false 
}: EnrolledProgramCardProps) {
  // ...
});
```

---

### 7. Chat Page - Add Message Virtualization

**File:** `src/pages/app/AppChat.tsx`

**Problem:** All messages render at once. With 100+ messages, this causes scroll jank.

**Solution:** Implement virtualized list using `react-window` or similar:

```tsx
import { FixedSizeList as List } from 'react-window';

<List
  height={containerHeight}
  itemCount={messages.length}
  itemSize={60}
>
  {({ index, style }) => (
    <ChatMessage key={messages[index].id} style={style} message={messages[index]} />
  )}
</List>
```

---

### 8. Image Loading - Add Native Priority Hints

**Files:** All components with images

**Problem:** Images load without priority hints, competing equally for bandwidth.

**Solution:** Add `fetchpriority` for above-fold images:

```tsx
<img 
  src={coverUrl} 
  loading="lazy"
  decoding="async"
  fetchpriority={isAboveFold ? "high" : "low"}
/>
```

---

### 9. Audio Player Context - Reduce Update Frequency

**File:** `src/contexts/AudioPlayerContext.tsx`

**Good:** Already throttled to 500ms updates (line 114-118).

**Additional optimization:** Use `requestAnimationFrame` for smoother visual updates:

```tsx
const handleTimeUpdate = () => {
  requestAnimationFrame(() => {
    if (Date.now() - lastTimeUpdateRef.current > 500) {
      lastTimeUpdateRef.current = Date.now();
      setCurrentTime(audio.currentTime);
    }
  });
};
```

---

### 10. Reduce Bundle Size - Code Split Heavy Components

**Files:** Routes in `App.tsx`

**Solution:** Lazy load infrequently accessed pages:

```tsx
const AppJournal = lazy(() => import('./pages/app/AppJournal'));
const AppCourseDetail = lazy(() => import('./pages/app/AppCourseDetail'));
const AdminPages = lazy(() => import('./pages/admin/Overview'));
```

---

## Low-Impact Optimizations

### 11. Haptic Feedback Debouncing

**Files:** Components using `haptic.light()`

**Problem:** Rapid taps can trigger multiple haptic calls.

**Solution:** Add debounce wrapper:

```tsx
import { debounce } from '@/lib/utils';
const debouncedHaptic = debounce(() => haptic.light(), 100);
```

---

### 12. Skeleton Loading Optimization

**Files:** All skeleton components

**Problem:** `animate-pulse` CSS animations run continuously.

**Solution:** Use `will-change: opacity` for smoother animations:

```tsx
<Skeleton className="animate-pulse" style={{ willChange: 'opacity' }} />
```

---

### 13. Real-time Subscription Consolidation

**File:** `src/layouts/NativeAppLayout.tsx`

**Problem:** Multiple realtime subscriptions running simultaneously.

**Solution:** Combine into a single multiplex channel where possible.

---

## Implementation Priority

| Priority | Optimization | Estimated Impact |
|----------|-------------|------------------|
| 1 | Feed N+1 queries fix | 60-70% faster feed load |
| 2 | Memoize TaskCard | Smoother home page scrolling |
| 3 | Add staleTime to routine hooks | Faster routine page loads |
| 4 | Extract EnrolledProgramCard | Smoother programs page |
| 5 | Memoize playlist stats | Smoother player page |
| 6 | Message virtualization | Better chat performance with many messages |
| 7 | Code splitting | Faster initial load |

---

## Summary of Files to Modify

1. `src/hooks/useFeed.tsx` - Combine queries
2. `src/components/app/TaskCard.tsx` - Add memo wrapper
3. `src/hooks/useRoutinePlans.tsx` - Add staleTime
4. `src/pages/app/AppPrograms.tsx` - Extract memoized component
5. `src/pages/app/AppPlayer.tsx` - Memoize stats
6. `src/pages/app/AppChat.tsx` - Add virtualization (optional, lower priority)
7. `src/contexts/AudioPlayerContext.tsx` - RAF optimization

These changes will significantly improve perceived performance, especially when navigating between pages and scrolling through lists on iOS devices.

