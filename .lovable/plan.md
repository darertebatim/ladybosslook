

## UI Overhaul: Align Self-Care Quiz with Weekly Review Design

Bring the Weekly Review's polished "Hero + Bottom Sheet" layout, mascot backgrounds, and consistent button styling into the Self-Care Quiz.

---

### What Changes

**1. Hook and Intro screens (motivational steps)**
- Add `illustrationLabel: 'selfcare-quiz'` to both steps in `selfcare-quiz.ts` so the MotivationalScreen renders with the `BottomSheetWrapper` (mascot background + rounded white bottom sheet)
- The existing MotivationalScreen code already supports `illustrationLabel` triggering the bottom-sheet layout, but it actually checks for `step.image`. We need to either add `image` pointing to `meplusMascotBg` or update the motivational renderer to handle this case. Simplest: add `image: meplusMascotBg` import path to the step data. Since step data is static, we'll use the `illustrationLabel` field and update the MotivationalScreen to use `meplusMascotBg` as fallback when `illustrationLabel` is set but no `image`.

Actually, looking at the code more carefully: `MotivationalScreen` checks `step.image && !step.description` for full-screen mode, and `step.image && step.description?.includes('—')` for testimonial mode. The default fallback (line 822) uses `ScreenWrapper`. There is no `BottomSheetWrapper` path in MotivationalScreen.

**Better approach**: Create a dedicated hook/intro layout directly in the selfcare quiz data by switching to a custom step type, OR simply make the motivational screen use `BottomSheetWrapper` when `illustrationLabel` is present (matching how SingleSelect/MultiSelect already work).

**2. Question screens (single-select, multi-select)**
- Add `illustrationLabel: 'selfcare-quiz'` to all 4 question steps in `selfcare-quiz.ts`
- This automatically triggers the `BottomSheetWrapper` layout in the existing `SingleSelectScreen` and `MultiSelectScreen` renderers (they check `hasBg = !!step.illustrationLabel`)
- The mascot background will default to `meplusMascotBg`

**3. Diagnosis screen**
- Refactor `SelfCareDiagnosisStep.tsx` to use hero + bottom sheet layout (like `WeekReportStep`)
- Add mascot image at top (~180px), white rounded bottom sheet below
- Move loading spinner and results into the bottom sheet area
- Fix button to bottom with consistent navy styling

**4. Suggestions screen**
- Refactor `SelfCareSuggestionsStep.tsx` to use hero + bottom sheet layout
- Mascot header at top, white bottom sheet with task cards
- Fixed bottom button with gradient fade (already has this, just needs hero header)

**5. Consistent buttons**
- All screens use the navy `bg-[#1a1f3d]` rounded-2xl button style (already the case for diagnosis/suggestions, and `NavyButton` handles question screens)
- Ensure buttons are pinned to bottom with `mt-auto` pattern

---

### Files to Modify

1. **`src/data/onboarding-flows/selfcare-quiz.ts`**
   - Add `illustrationLabel: 'selfcare-quiz'` to all question steps (sc-drain, sc-morning, sc-skipping, sc-proud)
   - This triggers the BottomSheetWrapper in the existing renderers

2. **`src/components/admin/onboarding/OnboardingStepRenderer.tsx`**
   - Update `MotivationalScreen` to support `BottomSheetWrapper` when `step.illustrationLabel` is set (no image needed). Use `meplusMascotBg` as default background. This gives hook + intro the same mascot + bottom sheet look.

3. **`src/components/app/selfcare-quiz/SelfCareDiagnosisStep.tsx`**
   - Wrap in hero + bottom sheet layout: mascot image header (180px) with `meplusMascotBg`, white rounded bottom sheet below
   - Loading state centered in bottom sheet
   - Results (title, AI insight card, gap chips) in bottom sheet
   - Button pinned at bottom with `mt-auto`

4. **`src/components/app/selfcare-quiz/SelfCareSuggestionsStep.tsx`**
   - Add mascot header area (smaller, ~140px since this page scrolls with task cards)
   - White rounded bottom sheet with scrollable task list
   - Keep existing fixed bottom button pattern

---

### Technical Notes
- Reuses `meplusMascotBg` asset (already imported in OnboardingStepRenderer)
- `BottomSheetWrapper` already exists in OnboardingStepRenderer and handles the hero+sheet pattern
- Question screens already have the `hasBg` code path — just need the `illustrationLabel` flag
- No new components needed, purely layout/styling alignment

