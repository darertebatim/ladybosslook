

# Onboarding iOS Bug Fixes

## Issues Identified

1. **"Continue" buttons floating too high** — `ScreenWrapper` uses `min-h-[700px]` fixed height. On real iPhones (especially larger ones), the `mt-auto` pushes the button to the bottom of 700px, not the bottom of the viewport. The wrapper needs to use the actual viewport height instead.

2. **Yes/No screens — image overflows** — The image uses `aspect-ratio: 4/5` with no max-height constraint, so on real devices it pushes out of bounds. Need to cap the image height and let it scale within available space.

3. **Paywall — Close/Restore buttons behind progress bar** — The paywall renders its own close (✕) and Restore buttons inside `ScreenWrapper` at the top, but the `AppOnboarding` page already has a progress bar + back/skip in the same area. These overlap. The paywall's close/restore row needs to be repositioned below the progress bar area, or the progress bar should be hidden on paywall steps.

4. **Skip button color** — Currently `text-muted-foreground`, needs to be black (`text-[#1a1f3d]`).

## Plan

### 1. Fix ScreenWrapper height (buttons too high)
- **File:** `OnboardingStepRenderer.tsx` — `ScreenWrapper` component (line 127-135)
- Change `min-h-[700px]` to `min-h-[100dvh]` (or remove it entirely since the parent is `h-full`) so content fills the real viewport height and `mt-auto` pushes buttons to the actual bottom.

### 2. Fix Yes/No image overflow
- **File:** `OnboardingStepRenderer.tsx` — `YesNoScreen` (line 379-402)
- Constrain the image container: replace fixed `aspect-ratio: 4/5` with a `flex-1 overflow-hidden` approach so the image fills available space without overflowing. Add `max-h-[50vh]` to the image container.

### 3. Fix paywall overlap with progress bar
- **File:** `AppOnboarding.tsx` — Hide the top navigation bar (back + progress + skip) when the current step is a paywall type, since the paywall has its own close/restore controls.
- **File:** `OnboardingStepRenderer.tsx` — Adjust paywall screen to add more top padding to clear the safe area since it manages its own header.

### 4. Skip button → black
- **File:** `AppOnboarding.tsx` (line ~131) — Change skip button class from `text-muted-foreground` to `text-[#1a1f3d]`.

### Technical Details
- `100dvh` is the correct unit for iOS Safari/WebView as it accounts for dynamic viewport changes.
- The `DoYouWantScreen` also uses `ScreenWrapper` so it benefits from fix #1 automatically.
- All screens using `ScreenWrapper` with `mt-auto` buttons will be fixed by the single `min-h` change.

