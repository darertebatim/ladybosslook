

# Onboarding in the Native App -- Via Promo Banners + Default Flow Setting

## Overview

Instead of building a separate banner system, we'll leverage the **existing Promo Banner infrastructure** to trigger onboarding flows. We'll also add a "Set as Default" option in the Onboarding Lab so admins can choose which flow users see.

---

## What Changes

### 1. Add `onboarding` as a Promo Banner Destination Type

**Files:** `src/components/admin/PromoBannerManager.tsx`, `src/components/app/PromoBanner.tsx`

- Add `'onboarding'` to the `DestinationType` union type in both files
- In the admin form, when `onboarding` is selected as destination, show a dropdown to pick which onboarding flow (e.g., "Simora Onboarding", "Dear Me Onboarding") -- the flow ID becomes the `destination_id`
- In the user-facing `PromoBanner`, add an `'onboarding'` case that navigates to `/app/onboarding/{destination_id}`
- This means you can already use the existing audience targeting (exclude Simora Plus users, target new users, etc.) with no extra work

### 2. Create the User-Facing Onboarding Page

**New file:** `src/pages/app/AppOnboarding.tsx`

- A full-screen page at route `/app/onboarding/:flowId`
- Renders the onboarding steps using the existing `OnboardingStepRenderer` -- same screens, animations, and logic as the admin preview
- No phone frame or admin sidebar -- just the clean full-screen experience
- Close/back button at the top to return to `/app/home`
- Saves progress to `localStorage` (`simora_onboarding_progress_{flowId}`) so users can resume
- On completion, sets `simora_onboarding_completed_{flowId}` and navigates back to home
- Preloads all images on mount (same approach already built in the admin preview)

**Route registration:** `src/App.tsx`

- Add `/app/onboarding/:flowId` wrapped in `ProtectedRoute`

### 3. Default Onboarding Flow Setting in Onboarding Lab

**Files:** `src/pages/admin/Onboarding.tsx`, `src/components/admin/onboarding/OnboardingFlowCard.tsx`

**New hook:** `src/hooks/useDefaultOnboarding.ts`

- Follows the exact same pattern as `useDefaultPaywall.ts` -- stores the chosen flow ID in the `app_settings` table under the key `default_onboarding_flow`
- Provides `useDefaultOnboarding()` to read and `useSetDefaultOnboarding()` to write

**Admin UI changes:**

- Each `OnboardingFlowCard` gets a "Set as Default" button (or a star/badge indicator if it's already the default)
- The currently active default flow shows a highlighted badge like "Active Default"
- When creating a promo banner with destination `onboarding`, the `destination_id` defaults to the current default flow (but can be overridden)

---

## How It All Fits Together

1. Admin goes to **Onboarding Lab** and marks "Simora Onboarding" as the default flow
2. Admin goes to **Promo Banners** and creates a banner with:
   - Destination: `Onboarding`
   - Flow: Simora Onboarding (auto-selected from default)
   - Audience: Exclude Simora Plus subscribers (already supported)
   - Frequency: Once
   - Location: Home Top
3. New user signs up, sees the banner on Home, taps it
4. Full-screen onboarding opens, user goes through all steps
5. On completion, banner won't show again (frequency = once)

---

## Technical Details

### New `DestinationType` Value
```
'onboarding' added to the union in both PromoBannerManager.tsx and PromoBanner.tsx
```

### New Hook (follows useDefaultPaywall pattern exactly)
```
Key: 'default_onboarding_flow'
Table: app_settings
Value: flow ID string (e.g., 'me-plus-v1')
```

### New Route
```
/app/onboarding/:flowId -> AppOnboarding.tsx (ProtectedRoute)
```

### localStorage Keys
```
simora_onboarding_progress_{flowId} -> current step index
simora_onboarding_completed_{flowId} -> "true" when finished
```

### Files Created
- `src/pages/app/AppOnboarding.tsx` -- full-screen onboarding page
- `src/hooks/useDefaultOnboarding.ts` -- default flow setting hook

### Files Modified
- `src/components/admin/PromoBannerManager.tsx` -- add 'onboarding' destination type + flow picker
- `src/components/app/PromoBanner.tsx` -- add 'onboarding' navigation case
- `src/pages/admin/Onboarding.tsx` -- add default flow toggle
- `src/components/admin/onboarding/OnboardingFlowCard.tsx` -- add default badge/button
- `src/App.tsx` -- register new route

