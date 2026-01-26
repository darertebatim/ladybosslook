

## Fix Plan: iOS Scroll Stuck Bug v1.1.05

### Root Cause Identified

The scrolling gets stuck because of a **perfect storm** of three factors:

1. **Animated Header Spacer** (line 315): The spacer div uses `transition-all duration-300 ease-out` to animate its height. When `isLoading` changes, this animation runs simultaneously with content changes.

2. **Conditional Content Rendering** (line 343): The loading state swaps between `<Skeleton>` and actual content. This DOM swap during the spacer animation confuses WKWebView.

3. **WKWebView Scroll State Corruption**: iOS's WKWebView loses track of its scroll container when layout changes and animations happen simultaneously.

**Why editing tasks fixes it**: Any task mutation invalidates React Query caches, causing `SortableTaskList` to receive new props and trigger a re-render. This re-render "rescues" the scroll container by forcing WKWebView to recalculate.

**Why Player/Chat/Routines work**: These pages use their own internal scroll containers with static layouts - they don't rely on the shared `<main>` container and don't have animated height spacers.

---

### Technical Fix (3 Steps)

#### Step 1: Remove Spacer Height Animation
Remove the `transition-all duration-300 ease-out` from the header spacer div. The calendar expand/collapse animation will still work (it uses CSS Grid animation), but the spacer won't animate during loading state changes.

**File:** `src/pages/app/AppHome.tsx` (line 315)
```tsx
// Before
<div className="transition-all duration-300 ease-out" style={{
  height: showCalendar ? '...' : '...'
}} />

// After  
<div style={{
  height: showCalendar ? '...' : '...'
}} />
```

#### Step 2: Add Touch Action to Calendar Grid Containers
Add `touchAction: 'pan-y'` to the animated grid containers to ensure vertical scroll gestures pass through even when `overflow: hidden` is applied.

**File:** `src/pages/app/AppHome.tsx` (lines 244 and 261)
```tsx
// Add to both grid container styles:
style={{
  gridTemplateRows: showCalendar ? '1fr' : '0fr',
  touchAction: 'pan-y'  // NEW
}}
```

#### Step 3: Force Scroll Container Reset After Loading
Add a `useLayoutEffect` that triggers when loading completes, performing a minimal scroll "nudge" to force WKWebView to recalculate its scroll state.

**File:** `src/pages/app/AppHome.tsx`
```tsx
// Add after isLoading definition (line 185)
const prevLoadingRef = useRef(isLoading);
useLayoutEffect(() => {
  // Only trigger when loading finishes (true → false)
  if (prevLoadingRef.current && !isLoading) {
    // Force WKWebView to recalculate scroll state
    const scrollContainer = document.querySelector('main');
    if (scrollContainer) {
      const currentScroll = scrollContainer.scrollTop;
      scrollContainer.scrollTop = currentScroll + 1;
      requestAnimationFrame(() => {
        scrollContainer.scrollTop = currentScroll;
      });
    }
  }
  prevLoadingRef.current = isLoading;
}, [isLoading]);
```

---

### Why This Works

```
Before (Bug):
┌─────────────────────────────────┐
│ Header + Spacer (animating)    │ ← height transition runs
├─────────────────────────────────┤
│ isLoading? Skeleton : Content  │ ← DOM swap during animation
│                                 │
│ WKWebView loses scroll state   │ ← BUG!
└─────────────────────────────────┘

After (Fixed):
┌─────────────────────────────────┐
│ Header + Spacer (instant)      │ ← no height transition
├─────────────────────────────────┤
│ isLoading? Skeleton : Content  │ ← DOM swap is safe now
│                                 │
│ + scroll nudge on load finish  │ ← forces recalculation
└─────────────────────────────────┘
```

---

### Files to Modify

1. **`src/pages/app/AppHome.tsx`**
   - Line 1: Add `useLayoutEffect` to imports
   - Line 185: Add scroll reset effect
   - Line 244: Add `touchAction: 'pan-y'` to calendar grid
   - Line 261: Add `touchAction: 'pan-y'` to week strip grid  
   - Line 315: Remove `transition-all duration-300 ease-out`

---

### Testing Steps

1. Build: `npm run build && npx cap sync ios`
2. Xcode: Clean Build Folder (Cmd+Shift+K) → Run
3. Test scenarios:
   - Navigate to a day you haven't visited → scrolling should work
   - Expand/collapse calendar → scrolling should work
   - Navigate to other pages → scrolling should work
4. Visual check: Calendar expand/collapse animation still works (via CSS Grid, not spacer)

---

### Version

This fix will be **v1.1.05**.

