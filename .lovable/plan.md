
# Rename "Ritual" back to "Routine" — Full Project Rename

## Summary
Replace all user-facing "Ritual/Rituals" text with "Routine/Routines" across the entire app and admin, including URL routes (`/app/rituals` -> `/app/routines`), component names, file names, and display labels.

## Scope

**~63 files** with ~900+ occurrences need updating. Changes fall into 4 categories:

---

## 1. Route Changes

**`src/App.tsx`**
- Change route `path="rituals"` to `path="routines"`
- Change route `path="rituals/:planId"` to `path="routines/:planId"`
- Add backward-compat redirect: `/app/rituals` -> `/app/routines` (reverse the current redirect)
- Update the `RoutineRedirect` component to point to `/app/routines/:planId`

**All navigation references** (~13 files):
- `src/lib/toolsConfig.ts`: route `/app/rituals` -> `/app/routines`, description `'Daily rituals'` -> `'Daily routines'`
- `src/lib/proTaskTypes.ts`: `/app/rituals` -> `/app/routines`
- `src/lib/localNotifications.ts`: `/app/rituals` -> `/app/routines`
- `src/components/app/HomeMenu.tsx`: name `'Rituals'` -> `'Routines'`, route -> `/app/routines`
- `src/components/app/PromoBanner.tsx`: all `/app/rituals` -> `/app/routines`
- `src/components/app/InspireBanner.tsx`: navigate to `/app/routines/...`
- `src/components/app/TaskQuickStartSheet.tsx`: navigate to `/app/routines`
- `src/components/dashboard/SuggestedRoutineCard.tsx`: link to `/app/routines/...`
- `src/components/dashboard/QuickActionsGrid.tsx`: label `'Rituals'` -> `'Routines'`, route -> `/app/routines`
- `src/pages/app/AppActions.tsx`: `backTo="/app/routines"`
- `src/pages/app/AppInspire.tsx`: navigate to `/app/routines/...`
- `src/pages/app/AppInspireDetail.tsx`: navigate/link to `/app/routines`

---

## 2. UI Text (Headings, Buttons, Toasts, Tooltips)

Every user-visible string containing "ritual/rituals/Ritual/Rituals" becomes "routine/routines/Routine/Routines". Key files:

- **Toast messages** (~10 files): e.g. `'Added to your rituals!'` -> `'Added to your routines!'`
- **Button text**: `'Add to My Rituals'` -> `'Add to My Routines'`
- **Page titles**: `'Edit Ritual'` -> `'Edit Routine'` in `RoutinePreviewSheet.tsx`
- **Tour descriptions** (~5 tour files): `'Your Rituals'` -> `'Your Routines'`, etc.
- **Admin labels** (`Tools.tsx`, `RoutinesBank.tsx`, `PromoBannerManager.tsx`, `AIAssistantPanel.tsx`): `'Rituals Bank'` -> `'Routines Bank'`, `'Ritual Plan'` -> `'Routine Plan'`, etc.
- **Paywall text** (`PaywallGradient.tsx`): `'Premium daily rituals'` -> `'Premium daily routines'`
- **Breathe/Journal/Emotion/Mood reminder settings**: toast and button text
- **AppTaskCreate.tsx**: hint text `'daily ritual'` -> `'daily routine'`
- **SpecialBannersArchive.tsx**: reference text (admin)

---

## 3. Component & File Renames

These files have "Ritual" in their name and should be renamed for consistency:

| Current File | New File |
|---|---|
| `src/components/app/AddToRitualHandHint.tsx` | `AddToRoutineHandHint.tsx` |
| `src/components/app/WelcomeRitualCard.tsx` | `WelcomeRoutineCard.tsx` |
| `src/components/app/ChallengeRitualCard.tsx` | `ChallengeRoutineCard.tsx` |
| `src/components/app/tour/RitualsTour.tsx` | `RoutinesTour.tsx` |

Exported component/interface names inside these files will also be renamed (e.g. `WelcomeRitualCard` -> `WelcomeRoutineCard`), and all import paths updated in consuming files.

---

## 4. Internal Code (Variables, Comments, Hooks)

- `useWelcomePopupRitual` -> `useWelcomePopupRoutine` (in `useRoutinesBank.tsx`)
- `useSaveRitualHint`, `SaveRitualHandHint`, `AddToRitualHandHint` -> `useSaveRoutineHint`, `SaveRoutineHandHint`, `AddToRoutineHandHint`
- `dismissedRitualIds` state variable in `AppHome.tsx` -> `dismissedRoutineIds`
- `hasSuggestedRituals` prop in `HomeTour.tsx` -> `hasSuggestedRoutines`
- Query keys like `'welcome-popup-ritual'` -> `'welcome-popup-routine'`
- localStorage keys like `'simora_dismissed_ritual_ids'` -> `'simora_dismissed_routine_ids'`
- All code comments referencing "ritual" updated to "routine"
- `'rituals'` tour feature key in `useFeatureTour.tsx` -> `'routines'`

---

## Backward Compatibility

- Add redirect: `/app/rituals` -> `/app/routines` and `/app/rituals/:planId` -> `/app/routines/:planId` (keeps old links/bookmarks working)
- localStorage migration: read old key `simora_dismissed_ritual_ids` and migrate to new key on first load

---

## What does NOT change

- Database table/column names (e.g. `routines_bank`, `routine_plan_tasks`) -- these already say "routine"
- Hook file names like `useRoutinesBank.tsx`, `useRoutinePlans.tsx` -- already correct
- The `RoutinePreviewSheet.tsx` and `RoutineBankCard.tsx` file names -- already say "Routine"
- Any Supabase edge functions or database schema
