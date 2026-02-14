
# Plan: Program Page Overhaul - Route Rename and IAP Purchase Buttons

## Overview
Two changes: (1) rename `/app/course/` routes to `/app/programs/`, and (2) when a program has iOS/annual product IDs, show proper subscription purchase buttons (monthly vs annual plan selector) instead of "Enroll Free."

## 1. Route Rename: `/app/course` to `/app/programs`

Update all references from `/app/course/:slug` to `/app/programs/:slug`:

**Files to update:**
- `src/App.tsx` - Route definitions (add redirect from old `/app/course/*` for backward compat)
- `src/pages/app/AppStore.tsx` - Navigation on program card click
- `src/pages/app/AppPrograms.tsx` - Links to program detail
- `src/pages/app/AppProfile.tsx` - Enrollment links
- `src/pages/app/AppPlaylistDetail.tsx` - "View Course Details" link
- `src/pages/app/AppCourseDetail.tsx` - BackButton destination, getCoursePageUrl helper
- `src/components/app/EnrolledProgramCard.tsx` - Link to program
- `src/components/dashboard/CompactRoundCard.tsx` - Link
- `src/components/dashboard/ActiveRound.tsx` - Link
- `src/components/feed/FeedActionButton.tsx` - Navigation
- `src/components/admin/SessionsManager.tsx` - Notification URL
- `src/components/admin/AnnouncementCreator.tsx` - SelectItem values
- `src/lib/proTaskTypes.ts` - Program link builder
- `src/hooks/useProgramEventNotificationScheduler.ts` - Notification URL

Add backward-compatibility redirect in `App.tsx`:
```
<Route path="course/:slug" element={<Navigate to="/app/programs/:slug" replace />} />
```

## 2. Purchase Buttons for IAP Programs

In `AppCourseDetail.tsx`, the "Purchase Landing Page" section (lines 983-1126) currently always shows "Enroll Free." This needs to be enhanced:

**Logic:**
- If program has `ios_product_id` AND we're on native: show subscription plan picker
- If program has `annual_ios_product_id` too: show both monthly and annual options
- If neither (free program): keep current "Enroll Free" button

**UI Design (in the Purchase Card, replacing the current free enrollment section):**

```
+------------------------------------------+
|  Choose Your Plan                        |
|                                          |
|  [Monthly]          [Annual - Save 40%]  |
|  $13.99/mo          $99.99/yr            |
|                                          |
|  [ Subscribe Now ]                       |
|                                          |
|  Cancel anytime. Managed by Apple.       |
+------------------------------------------+
```

- Two selectable plan cards (monthly highlighted by default, annual shows savings badge)
- Single "Subscribe Now" button below
- On click: triggers RevenueCat purchase flow (placeholder for now -- logs selected product ID)
- On web (non-native): show "Available in the App" message or link to web payment if Stripe price exists

**Implementation details:**
- Add state: `selectedPlan: 'monthly' | 'annual'`
- Calculate savings percentage: `Math.round((1 - annualPrice / (monthlyPrice * 12)) * 100)`
- The button calls a `handlePurchase()` function that will later integrate with RevenueCat
- For now, `handlePurchase` shows a toast: "Purchase flow coming soon" (or initiates RevenueCat if SDK is available)

## Technical Details

### Files Modified
1. **`src/App.tsx`** -- Route paths + backward compat redirects
2. **`src/pages/app/AppCourseDetail.tsx`** -- Purchase UI with plan selector when `ios_product_id` exists
3. **`src/pages/app/AppStore.tsx`** -- Link update
4. **`src/pages/app/AppPrograms.tsx`** -- Link update
5. **`src/pages/app/AppProfile.tsx`** -- Link update
6. **`src/pages/app/AppPlaylistDetail.tsx`** -- Link update
7. **`src/components/app/EnrolledProgramCard.tsx`** -- Link update
8. **`src/components/dashboard/CompactRoundCard.tsx`** -- Link update
9. **`src/components/dashboard/ActiveRound.tsx`** -- Link update
10. **`src/components/feed/FeedActionButton.tsx`** -- Link update
11. **`src/components/admin/SessionsManager.tsx`** -- Link update
12. **`src/components/admin/AnnouncementCreator.tsx`** -- Link update
13. **`src/lib/proTaskTypes.ts`** -- Link update
14. **`src/hooks/useProgramEventNotificationScheduler.ts`** -- Link update
15. **`src/data/programs.ts`** -- Add `annual_ios_product_id` and `annual_price_amount` to Program interface

### Data Flow for Purchase
The program query in `AppCourseDetail.tsx` already uses `SELECT *` from `program_catalog`, so `ios_product_id`, `annual_ios_product_id`, `price_amount`, and `annual_price_amount` are already available in the `program` object.
