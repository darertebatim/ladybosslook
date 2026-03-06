

## Page Transition Animations for Onboarding

Currently, steps swap instantly via React `key` remounting with no enter/exit animations. Here's the plan using **framer-motion** (already installed):

### What we'll add

**1. Page-level slide transition** (in `AppOnboarding.tsx`)
- Wrap `OnboardingStepRenderer` in `<AnimatePresence mode="wait">` + `<motion.div>`
- Track navigation direction (forward/back) to determine slide direction
- **Forward**: slide in from right, exit to left (subtle, ~30px translateX + fade)
- **Back**: slide in from left, exit to right
- Duration: ~250ms with easeOut — fast enough to feel snappy

**2. Staggered content entrance** (in `OnboardingStepRenderer.tsx`)
- Add a reusable `<StaggerContainer>` + `<StaggerItem>` wrapper using `motion.div` with `staggerChildren: 0.08`
- Apply to key content elements within each screen type:
  - **Titles**: fade-up (translateY 15px → 0)
  - **Subtitles**: fade-up with slight delay
  - **Option buttons/cards**: stagger fade-up one by one
  - **CTA button**: fade-in last
- Screens that already have custom animations (loading-testimonials, personalized-plan stagger) keep their existing logic

**3. Exit animations**
- Content fades out quickly (~150ms) when navigating away, handled by `AnimatePresence`'s exit prop

### Technical approach

- `AppOnboarding.tsx`: Add `direction` state (1 or -1), update in `goNext`/`goBack`. Pass as `custom` prop to motion variants.
- Create small `<PageTransition>` wrapper component for clean reuse
- Create `<FadeUp>` utility component for individual element entrances
- Apply `<FadeUp>` to titles, subtitles, options, and buttons across the ~20 screen types using a consistent pattern

### Screens to update
All screen components (`WelcomeScreen`, `MultiSelectScreen`, `SingleSelectScreen`, `YesNoScreen`, `MotivationalScreen`, `InfoStatScreen`, `PersonalizedPlanScreen`, etc.) — wrap their content children in `<FadeUp>` components with stagger delays.

