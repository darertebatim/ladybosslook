
Goal
- Fix iOS “scroll gets stuck” on the Routines plan detail page (/app/routines/:planId), which was missed.
- Double-check we didn’t miss any other in-app pages that still use the old “min-h-full + ScrollArea”/document scrolling pattern.
- Change the Home header “Today” star from orange back to red.

What I found (code audit)
- /app/routines (list page) already uses the stable pattern: outer `flex flex-col h-full overflow-hidden` + dedicated scroll container. This page should be OK.
- /app/routines/:planId (detail page) is still using:
  - `min-h-full` outer container
  - Radix `ScrollArea` as the main vertical scroller
  - fixed header + fixed bottom bar on top of that
  This combination is a common trigger for iOS WKWebView “stuck scroll”, especially after navigation / state changes.
- Search results show only one remaining “in-app route page” with `min-h-full` that matches the stuck-scroll risk: `AppInspireDetail.tsx`.
  - There are other `min-h-*` occurrences in `AppTaskCreate.tsx` and `AppNewHome.tsx`, but:
    - `AppTaskCreate` is a full-screen route outside the tab layout (different behavior) and already uses a keyboard-stable architecture elsewhere in the file.
    - `AppNewHome` doesn’t appear to be part of the active `/app` tab routes (it’s not routed under `/app` in the current setup).

Plan of changes

1) Fix Routines plan detail scrolling (/app/routines/:planId)
File: `src/pages/app/AppInspireDetail.tsx`

Change summary
- Replace the current main vertical `ScrollArea` with the same dedicated scroll container approach used on Home/Channels/Journal/etc:
  - Outer: `div.flex.flex-col.h-full.overflow-hidden`
  - Inner scroll: `div.flex-1.overflow-y-auto.overscroll-contain`
- Keep the fixed header and fixed bottom “Add” button, but ensure:
  - The page has a single, reliable vertical scroll context (the inner scroll container).
  - Scrollable content has enough bottom padding so it won’t be hidden behind the fixed “Add to my routine” bar and the tab bar.

Concrete edits
- Remove: `import { ScrollArea } from '@/components/ui/scroll-area';`
- Update outer wrapper:
  - From: `className="min-h-full bg-background"`
  - To: `className="flex flex-col h-full overflow-hidden bg-background"`
- Replace:
  - `<ScrollArea className="flex-1"> ... </ScrollArea>`
  - With:
    - `<div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}> ... </div>`
- Adjust scroll content padding:
  - Keep your current “hero at the top” layout.
  - Ensure the content wrapper uses a bottom padding that accounts for the fixed footer:
    - Example approach:
      - `className="px-4"`
      - plus inline `style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 160px)' }}`
    - This prevents the last section (rating) from being blocked by the sticky button/footer.

Why this should fix it
- It eliminates the “Radix ScrollArea as primary vertical scroller inside a fixed header/footer page” pattern, which is frequently unstable on iOS WKWebView.
- It matches the proven “stable scrolling architecture” already working on Home/Channels/Journal/Programs/Browse/Profile.

2) Verify no other in-app pages were missed
No code changes unless we find another offender.

Verification method (already done via code search, will re-check quickly during implementation)
- Re-scan `src/pages/app/**` for:
  - `min-h-full` used as the main page container inside `/app` routes
  - `ScrollArea className="flex-1"` used as the main vertical scroller on a page with a fixed header
- Confirm the only remaining `/app/...` route that needed the fix was `AppInspireDetail.tsx`.

3) Change Home “Today” star to red
File: `src/pages/app/AppHome.tsx`

Change summary
- Update the star icon class back to red.

Concrete edit
- From:
  - `<Star className="h-3 w-3 text-orange-500 fill-orange-500" />`
- To:
  - `<Star className="h-3 w-3 text-red-500 fill-red-500" />`

QA checklist (what you’ll test after I implement)
On an iPhone build (or TestFlight build):
1) Home
- Switch days repeatedly (Today ↔ other days)
- Scroll up/down
- Confirm it never “locks”
- Confirm the “Today” star is red

2) Routines list (/app/routines)
- Scroll the grid
- Open a routine
- Go back and repeat with different routines

3) Routines detail (/app/routines/:planId)
- Scroll the page fully top-to-bottom
- Tap “Add to my routine” to open the RoutinePreviewSheet and scroll inside the sheet
- Close the sheet and keep scrolling the detail page
- Navigate away and back, then scroll again
- (Optional) Switch day on Home, return to this routine detail, scroll again

Expected result
- The Routines plan detail page no longer gets stuck on iOS.
- No other pages remain on the older unstable “document scroll / ScrollArea as main scroller” pattern inside `/app`.
- Home header star is red.

Files that will be edited
- `src/pages/app/AppInspireDetail.tsx` (scroll fix)
- `src/pages/app/AppHome.tsx` (orange → red star)
