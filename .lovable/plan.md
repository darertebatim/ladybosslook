

# Plan: 3 New Pages After "Suggested Goals"

## Page 1: "Your Why" (sc-your-why)
Type: `selfcare-your-why` — single-select with 6 emotionally resonant options:

| Emoji | Label |
|-------|-------|
| 💪 | For my health |
| 👨‍👩‍👧 | For my family |
| ✨ | To feel like myself again |
| 😌 | To finally feel calm |
| 🌅 | To take back my mornings |
| 💕 | To love myself more |

Title: "Why are you starting this?" — Bottom sheet layout, answer saved to `answers['sc-your-why']`.

## Page 2: "Set Your Commitment" (sc-commitment)
Type: `selfcare-commitment` — two sections:
- **Days/week**: pills for 3, 5, 6, 7 (default: 5)
- **Start date**: Today, Tomorrow, Monday

Button: "I'm Ready →"

## Page 3: "Recommended Reflection" (sc-reflection)
Type: `selfcare-reflection` — fetches reflections from DB, maps user's top gap cluster to reflection categories (body→energize, mind→calm, environment→reset, people→morning). Shows 2-3 selectable reflection cards. Selected reflection ID stored for routine builder.

## Files to Change

1. **`src/types/onboarding.ts`** — Add 3 new step types
2. **`src/data/onboarding-flows/selfcare-quiz.ts`** — Add 3 steps after `sc-suggestions`
3. **`src/components/admin/onboarding/OnboardingStepRenderer.tsx`** — Route new types to components
4. **Create** `src/components/app/selfcare-quiz/SelfCareYourWhyStep.tsx`
5. **Create** `src/components/app/selfcare-quiz/SelfCareCommitmentStep.tsx`
6. **Create** `src/components/app/selfcare-quiz/SelfCareReflectionStep.tsx`

