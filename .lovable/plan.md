

# Onboarding Lab - Dear Me Flow Preview

## What we're building

A phone-frame previewer inside the Onboarding Lab admin page that lets you step through all ~47 screens of the Dear Me onboarding flow, page by page, exactly as they appear in the app. This is admin-only -- nothing touches the live app.

## Screen types identified from the PDF

The Dear Me onboarding has these distinct screen patterns:

1. **Welcome** -- hero illustration area, stats ("25 million+"), CTA button
2. **Greeting** -- mascot/illustration with short text + Continue
3. **Multi-select question** -- title + emoji-labeled option cards (e.g. "What should we focus on?")
4. **Single-select question** -- title + option list (age, gender, sleep, stress, etc.)
5. **Single-select with descriptions** -- option + subtitle explanation (support, procrastination, productivity)
6. **Yes/No with illustration** -- "Does this sound like you?" + image card + two buttons
7. **Do-you-want-to** -- "Do you want to..." + illustration card + No / "Sure, let's go"
8. **Info/Stat screen** -- bold statistic ("Over 57% of users...") + description + Continue
9. **Motivational screen** -- empathetic message + Continue
10. **Notification permission** -- permission prompt screen
11. **Results/Chart** -- growth graph visual + 37x messaging
12. **Habit Loop education** -- diagram + explanation
13. **Loading with testimonials** -- progress ring + scrolling review cards
14. **Personal summary** -- Fitness/Wellness/Productivity status bars
15. **First habit** -- calendar + habit card + "Let's do it"
16. **Breathing exercise** -- animation screen
17. **Streak motivation** -- streak counter + encouragement
18. **Paywall** -- pricing tiers + CTA
19. **Before/After** -- side-by-side comparison cards
20. **Science-backed** -- institution logos + CBT explanation

## Architecture

All client-side, no database needed. The flow is defined as a TypeScript data structure.

### New files

- `src/data/onboarding-flows/dear-me.ts` -- Full flow definition with all ~47 steps as typed objects
- `src/components/admin/onboarding/OnboardingFlowCard.tsx` -- Card shown on the lab listing page for each flow
- `src/components/admin/onboarding/OnboardingPreview.tsx` -- Phone-frame previewer with step navigation
- `src/components/admin/onboarding/OnboardingStepRenderer.tsx` -- Renders each step type inside the phone frame
- `src/types/onboarding.ts` -- TypeScript types for onboarding steps

### Modified files

- `src/pages/admin/Onboarding.tsx` -- Show the Dear Me flow card, open preview on click

## Step data model

```typescript
type OnboardingStepType =
  | 'welcome'
  | 'greeting'
  | 'multi-select'
  | 'single-select'
  | 'yes-no'
  | 'do-you-want'
  | 'info-stat'
  | 'motivational'
  | 'notification-permission'
  | 'results-chart'
  | 'habit-loop'
  | 'loading-testimonials'
  | 'personal-summary'
  | 'first-habit'
  | 'breathing'
  | 'streak'
  | 'paywall'
  | 'before-after'
  | 'science-backed';

interface OnboardingStep {
  id: string;
  type: OnboardingStepType;
  title?: string;
  subtitle?: string;
  description?: string;
  options?: { label: string; emoji?: string; description?: string }[];
  buttonLabel?: string;
  secondaryButtonLabel?: string;
  statHighlight?: string;
  // Additional type-specific fields
}

interface OnboardingFlow {
  id: string;
  name: string;
  description: string;
  steps: OnboardingStep[];
  createdAt: string;
}
```

## Phone frame previewer

- Rendered as a centered phone mockup (375x812 aspect ratio) with rounded corners and notch
- Navigation controls below: Back / step counter / Next
- Step list sidebar on the left showing all steps as small thumbnails or numbered labels
- Current step highlighted
- Each step renders inside the phone frame with appropriate layout matching Dear Me's design (dark navy buttons, light backgrounds, emoji icons, etc.)

## Implementation sequence

1. Create the types file
2. Create the Dear Me flow data (all 47 steps)
3. Build the step renderer component with all screen types
4. Build the phone frame previewer with navigation
5. Build the flow card component
6. Update the Onboarding Lab page to show the flow and open the previewer

## Visual fidelity

Each screen type will be rendered with:
- Navy blue buttons (matching Dear Me's dark navy CTA style)
- Warm cream/beige backgrounds for certain screens
- Emoji icons in option cards
- Progress bar where applicable
- Back chevron in top-left
- Placeholder illustration areas (colored gradient boxes with descriptive labels since we don't have the actual illustrations)

