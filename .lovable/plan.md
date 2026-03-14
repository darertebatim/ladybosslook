

# Quick Onboarding Flow

## Overview
Create a new 4-screen "quick onboarding" flow that gets users into the app fast. This reuses the existing onboarding infrastructure (`OnboardingStepRenderer`, `AppOnboarding`, flow data pattern) so no new plumbing is needed.

## Flow: `quick-start-v1` — 4 Screens

| # | Type | Content |
|---|------|---------|
| 1 | `welcome` | "Simora helps you reset your day and build small routines that make you stronger." — single CTA: "Get Started" |
| 2 | `single-select` | "What do you want most right now?" — 4 options: Reduce stress, Build discipline, Improve focus, Build stronger routines |
| 3 | `confetti-message` | "Here's your first routine" — show 3-4 starter tasks (mood check, breathe, one reflection, one small task). CTA: "Start your first reset" |
| 4 | `welcome-aboard` | Quick welcome with confetti, then auto-navigate to `/app/home` |

## Files to Create / Edit

### 1. New file: `src/data/onboarding-flows/quick-start.ts`
Define the `quickStartFlow` with id `quick-start-v1`, 4 steps using existing step types.

### 2. Edit: `src/pages/app/AppOnboarding.tsx`
Add `quickStartFlow` to the `allFlows` array so it can be rendered at `/app/onboarding/quick-start-v1`.

### 3. Edit: `src/pages/admin/Onboarding.tsx`
Add `quickStartFlow` to the flows list so it appears in the admin Onboarding Lab.

### 4. Edit: `src/components/app/OnboardingBanner.tsx`
Update the banner to point to `quick-start-v1` instead of `me-plus-v1` (since this is now the default entry point for new users).

### 5. Edit: `src/hooks/useDefaultOnboarding.ts` (no change needed — admin can set default via UI)

## Design Decisions
- Reuses all existing step type renderers — no new components needed.
- The intent question (screen 2) answer is saved to Supabase via existing `onboarding_answers` logic, which can be used later for personalization.
- The "starter routine" screen (screen 3) uses `confetti-message` type to show a celebratory moment with the starter tasks listed.
- The old 38-screen flow remains available in admin for future use (subscription-focused onboarding).

