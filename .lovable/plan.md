

## Why `/app/breathe` doesn't scroll on iOS

**Root cause**: The category pills container uses `overflow-x-auto` (line 104 in `AppBreathe.tsx`), which creates a nested horizontal scroll area inside the layout's vertical scroll container (`<main>` in `NativeAppLayout.tsx`). On iOS WebKit, nested scroll containers compete for touch events — when you touch within the horizontal scroll area or its vicinity, iOS can lock onto the horizontal axis and block vertical scrolling entirely.

Additionally, the outer `<div className="min-h-screen">` may contribute by making the content area appear to be exactly one viewport tall before the exercise list renders, giving iOS no initial scroll momentum.

## Fix

**File: `src/pages/app/AppBreathe.tsx`**

1. Change `min-h-screen` to `min-h-0` on the outer div (line 82) — the layout already handles full-height via flexbox, so `min-h-screen` is redundant and can confuse iOS scroll calculations.

2. Add `touch-action: pan-y` to the category pills horizontal scroll container to tell iOS that vertical scrolling should always be allowed to propagate, even within the horizontal scroll area.

```tsx
// Line 82: change min-h-screen
<div className="min-h-0 bg-background">

// Line 104: add touch-action style
<div 
  className="flex gap-2 overflow-x-auto no-scrollbar"
  style={{ touchAction: 'pan-x pan-y' }}
>
```

These two changes ensure iOS doesn't block vertical scroll propagation through the horizontal pill area, and the content sizing cooperates with the layout's flex scroll container.

