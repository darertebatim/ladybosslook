
## Goal

Redesign every screen of the **Self-Care Quiz** flow (`selfcareQuizFlow`, 13 steps) in the same visual language as the *What's Rilo* teach flow:

- Soft per-step gradient backgrounds + ambient glow blobs
- Floating 3D Fluent emoji chips, orbiting badges, drifting elements
- Mini illustrated "mock UI" cards (planner-style, diagnosis-card, suggestions-stack, commitment-dial, etc.)
- Sparkle / confetti moments on diagnosis reveal, celebration, and plus-intro
- **No mascot anywhere**

Keep the change isolated — every other onboarding flow (Dear Me, Me Plus, Weekly Review, etc.) renders exactly as today.

## Architecture

Add a single new dispatcher: `SelfCareQuizScreen` (mirroring `RiloTeachScreen`'s pattern), with one bespoke sub-component per quiz step keyed by step `id`.

```text
src/components/app/selfcare-quiz/
├── SelfCareQuizScreen.tsx          ← dispatcher (new)
├── visuals/                         ← new bespoke visuals + shared primitives
│   ├── QuizShell.tsx                (gradient bg + glow + title/cta layout)
│   ├── AmbientGlow.tsx              (per-step glow blob palette)
│   ├── FloatingChip.tsx             (3D emoji chip with drift animation)
│   ├── ConfettiBurst.tsx            (sparkle moment)
│   └── steps/
│       ├── IntroVisual.tsx          (sc-intro)
│       ├── HookVisual.tsx           (sc-hook — orbiting category chips)
│       ├── WeighingVisual.tsx       (sc-weighing — single-select + decorative weight scale)
│       ├── NeglectingVisual.tsx     (sc-neglecting — multi-select w/ tilted card stack)
│       ├── WinVisual.tsx            (sc-win — trophy/sparkle bg)
│       ├── DeeperVisual.tsx         (sc-deeper — cluster-tinted bg)
│       ├── DiagnosisVisual.tsx      (sc-diagnosis — animated diagnosis card reveal)
│       ├── SuggestionsVisual.tsx    (sc-suggestions — fanned habit cards)
│       ├── PushPermissionVisual.tsx (sc-push-permission — phone w/ notification)
│       ├── YourWhyVisual.tsx        (sc-your-why — heart/anchor visual + textarea)
│       ├── CommitmentVisual.tsx     (sc-commitment — frequency dial)
│       ├── CelebrationVisual.tsx    (sc-rilo-celebration — confetti + glow)
│       └── PlusIntroVisual.tsx      (sc-plus-intro — Plus crown + sparkle)
```

The **existing** `SelfCare*Step.tsx` files keep their core logic (state, persistence, answer wiring) but each gets restyled to use the new shell + visual primitives. Generic step types reused by the quiz (`motivational`, `single-select`, `multi-select`, `dynamic-single-select`) are NOT modified globally; instead, the dispatcher renders custom screens for them when invoked from this flow.

## Routing change

In `OnboardingStepRenderer`, detect quiz steps by `step.id` prefix `sc-` and route to `SelfCareQuizScreen` first. If it returns null (unknown id), fall through to the current switch. This keeps isolation perfect with one tiny shim.

```ts
// at top of switch:
if (step.id?.startsWith('sc-')) {
  const el = SelfCareQuizScreen({ step, onNext, onAnswer, answers, onMilestone });
  if (el) return el;
}
```

## Per-step visual concept

| Step | Concept |
|---|---|
| sc-intro | Centered "AI-analyzing" orb with rotating sparkle ring, soft peach→lavender gradient |
| sc-hook | "Productivity isn't the problem" — 13 category chips orbit a faded life-wheel |
| sc-weighing | Tilted card stack (one chosen card lifts on tap), rosé gradient |
| sc-neglecting | 9 mini "neglected" cards in a soft grid; selected = full color, unselected = desaturated |
| sc-win | Sunrise gradient + soft sun-ray sweep behind options |
| sc-deeper | Cluster-tinted bg (body=peach, mind=lavender, env=mint, people=pink) |
| sc-diagnosis | Animated reveal: blurred shapes resolve into a diagnosis "card" with category chips |
| sc-suggestions | Fanned habit cards animate into a tidy stack, tap-to-select with check overlay |
| sc-push-permission | Floating mock notification banner enters from top with subtle glow |
| sc-your-why | Anchor/heart visual; auto-resizing textarea on a paper-grain card |
| sc-commitment | Frequency dial (3/5/7 days) with progress ring; tap-to-set |
| sc-rilo-celebration | Confetti burst + radial sparkle, "you showed up" headline scales in |
| sc-plus-intro | Crown medallion with rotating gold sparkles, dual CTA |

## Shared primitives

- `QuizShell`: full-height column, safe-area, configurable gradient, optional `<AmbientGlow />`, slot for visual + slot for title/sub/CTA. Mirrors `RiloTeachScreen` structure.
- `FloatingChip`: 3D emoji + label, framer-motion drift loop (configurable delay/amplitude).
- `ConfettiBurst`: lightweight CSS-only burst used on diagnosis/celebration/plus-intro.
- All animations via `framer-motion` (already in project).

## Out of scope

- No DB / quiz logic / answer-shape changes.
- No copy changes.
- No changes to other flows or shared question screens.
- Selfcare quiz spec memory (`mem://features/tasks/self-care-quiz-specs`) stays valid; only visuals change.

## Validation

- Walk through the quiz in admin preview (`/admin` → onboarding flow preview) and on `/app` quiz entry, verifying each step renders, animates, and progresses.
- Confirm Dear Me, Me Plus, and Weekly Review flows look unchanged.

## Estimated footprint

~1 dispatcher + 13 visual files (~80–200 LOC each) + 4 primitives + minor edits to the 7 existing `SelfCare*Step.tsx` files and 1 line in `OnboardingStepRenderer.tsx`.
