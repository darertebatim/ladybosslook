

## Plan: Fix Onboarding Layout Issues

### Problem
The onboarding screens (especially Yes/No and Do-You-Want pages) overflow beyond the viewport, making the page scrollable with empty white space below the buttons. The admin preview also doesn't match the real app experience.

### Root Cause Analysis
1. **`ScreenWrapper`** uses `overflow-y-auto` with `min-h-full` inner div — this allows content to grow beyond viewport instead of constraining to it
2. The **YesNo/DoYouWant** screens use `h-full flex flex-col` but the image `max-h-[45vh]` combined with title + padding can exceed available space
3. Several screens use `min-h-[100dvh]` (e.g., ConfettiMessageScreen, PaywallScreen) which adds height BELOW the nav bar since they're already inside a `h-full` container
4. The admin **OnboardingPreview** component wraps content in a 375x812 phone frame but the internal height constraints don't match the real app

### Changes

#### 1. Fix `ScreenWrapper` to constrain content within viewport
- Change inner div from `min-h-full` to `h-full` with overflow on the inner content only when needed
- Remove `-webkit-fill-available` hack that causes inconsistent sizing

#### 2. Fix YesNoScreen and DoYouWantScreen
- Remove `justify-center` from the scrollable area (this pushes content down and creates overflow)
- Use `flex-1` on the image container so it fills available space naturally instead of `max-h-[45vh]` which can overflow
- Set image to `max-h-full object-contain` inside a `flex-1 min-h-0` container

#### 3. Fix other overflow-prone screens
- **ConfettiMessageScreen**: Remove `min-h-[100dvh]` — it's already inside a full-height container
- **PaywallScreen**: Replace `min-h-[100dvh]` with just using the parent's `h-full`
- **BeforeAfterScreen, DistressGridScreen**: Ensure image `flex-1` containers have `min-h-0` to prevent overflow

#### 4. Remove admin OnboardingPreview component
- Delete `OnboardingPreview.tsx` entirely
- Remove its import/usage from the admin onboarding page
- Direct admins to use the real app route `/app/onboarding/me-plus-v1` for previewing

### Files to Modify
- `src/components/admin/onboarding/OnboardingStepRenderer.tsx` — Fix ScreenWrapper, YesNoScreen, DoYouWantScreen, ConfettiMessageScreen, PaywallScreen, BeforeAfterScreen, DistressGridScreen
- `src/components/admin/onboarding/OnboardingPreview.tsx` — Delete or replace with a link to the real route
- Admin page that imports OnboardingPreview — Remove usage

