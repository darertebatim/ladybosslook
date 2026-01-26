
# Fix iOS Scrolling - Adopt Player/Routines Architecture

## Problem

The Home page uses a fundamentally different scrolling architecture than the Player and Routines pages. The current AppHome has:

1. **Animated header spacer** - The spacer div changes height with `showCalendar` state, which confuses iOS WKWebView
2. **CSS grid animations** on the calendar (`gridTemplateRows` transitions)
3. A `useLayoutEffect` scroll "nudge" hack that isn't reliable
4. Uses `min-h-full` instead of `h-full overflow-hidden`
5. Content uses fixed `pb-[280px]` instead of `pb-safe`

Meanwhile, the **Player and Routines pages work reliably** because they use:
- `h-full overflow-hidden` on the outer container
- Static header spacer with `shrink-0` (never animates)
- `flex-1 overflow-y-auto overscroll-contain` for the scroll container
- `pb-safe` for proper bottom padding

## Solution

Refactor AppHome to match the Player/Routines architecture:

### Changes to AppHome.tsx

1. **Outer container**: Change from `min-h-full` to `h-full overflow-hidden`

2. **Remove the scroll nudge hack**: Delete the `useLayoutEffect` and `prevLoadingRef` that tries to force scroll recalculation

3. **Header spacer**: 
   - Remove the dynamic height calculation that changes with `showCalendar`
   - Use a fixed height with `shrink-0`
   - The calendar expansion will push content naturally rather than using spacer tricks

4. **Scroll container**: 
   - Wrap content in `flex-1 overflow-y-auto overscroll-contain` div
   - Change bottom padding from `pb-[280px]` to `pb-safe`

5. **Calendar animations**: 
   - Remove `transition-all duration-300 ease-out` from calendar grid containers
   - Remove `touchAction: 'pan-y'` CSS (not needed with proper scroll container)
   - Keep the grid open/close logic but without the problematic transitions

## Technical Details

```text
BEFORE (problematic):
┌──────────────────────────────┐
│ <div min-h-full>             │  ← No overflow control
│   <header fixed />           │
│   <div style={height:X}>     │  ← Height CHANGES (breaks iOS)
│   <content pb-[280px]>       │  ← Fixed padding, wrong approach
│     ... tasks ...            │
│   </content>                 │
│ </div>                       │
└──────────────────────────────┘

AFTER (stable - matches Player):
┌──────────────────────────────┐
│ <div h-full overflow-hidden> │  ← Contained
│   <header fixed />           │
│   <div shrink-0 />           │  ← Fixed spacer
│   <div flex-1 overflow-y-auto│  ← SCROLL CONTAINER
│        overscroll-contain>   │
│     <content pb-safe>        │  ← Safe area padding
│       ... tasks ...          │
│     </content>               │
│   </div>                     │
│ </div>                       │
└──────────────────────────────┘
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/app/AppHome.tsx` | Refactor layout architecture to match Player/Routines pattern |

## Expected Result

- Scrolling will be stable when changing days
- No more WKWebView scroll freezes
- Calendar expand/collapse will still work but without animations that break scroll
- Consistent behavior with other pages in the app
