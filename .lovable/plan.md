# Add "What is Rilo?" Teach Flow

A new 3-screen explainer flow that tells users exactly what Rilo is **before** any quiz or question. Lives in `/admin/onboarding` so you can preview, iterate, and decide whether to make it the new default first-run experience.

## Goal

Solve the "people don't get the app" problem by leading with a clear promise:
**Rilo = a planner + a self-care core that helps you build a routine you actually follow.**

No questions. No commitment. Just three quick "aha" screens, then a single CTA into the existing flow (Quick Start → Auth → Self-Care Quiz).

## The 3 screens

**Screen 1 — What Rilo is**
- Title: "Meet Rilo"
- Subtitle: "Your self-care planner — built to help you actually show up for yourself."
- Visual: existing `mascot-planner` asset
- Single CTA: "Show me how"

**Screen 2 — The core idea (Planner + Self-Care)**
- Title: "Plan it. Do it. Feel it."
- Subtitle: "Rilo turns self-care into a simple daily routine — one you'll actually keep."
- Visual: 3-row mini illustration (emoji + one-liner each):
  - 📋 Plan your day in seconds
  - ✅ Tick off tiny self-care tasks
  - 🔥 Build a streak that sticks
- CTA: "What's in it for me?"

**Screen 3 — The promise**
- Title: "In 7 days you'll have a routine"
- Subtitle: "No overwhelm. No 50-step morning rituals. Just the few things that move your day."
- Small social proof line: "Join 3,000+ women already using Rilo."
- CTA: "Let's set yours up" → completes the flow

## Where it lives

- New file: `src/data/onboarding-flows/what-is-rilo.ts` — exports `whatIsRiloFlow` with `id: 'what-is-rilo'`
- Registered in two places (same pattern as every other flow):
  - `src/pages/admin/Onboarding.tsx` — add to `flows` array so it appears as a card
  - `src/pages/app/AppOnboarding.tsx` — add to `allFlows` so `/app/onboarding/what-is-rilo` renders
- Uses existing step types only (`welcome` for screen 1, `motivational` for screens 2 & 3) — **no new step renderers needed**
- On completion: navigate to `/auth?mode=signup` (same as Quick Start), so the flow is wired correctly for when you decide to make it the entry point

## What this is NOT (yet)

- Not made the default flow — you'll see it as just another card in the admin list with a "Set Default" button
- No starter-routine generator yet (that was step 2 of the bigger plan; we'll add it after you approve the teach screens)
- No changes to Quick Start, Self-Care Quiz, or the auth flow

## After you preview

Once you like the screens, the next step is to chain them: **What is Rilo? → Auth → Quick Start (3 questions max) → Starter Routine → Home**. That requires touching the first-run routing in `Index.tsx` / `Auth.tsx`, which we'll do as a separate change.

## Technical notes

- Reuses `cheerful-bird.png` and `mascot-planner.png` already imported elsewhere — zero new assets
- `motivational` step type already supports title + subtitle + image + button, so screens 2 & 3 fit cleanly
- The flow card will show in `/admin/onboarding` with a "Preview" button and step-by-step expansion, matching every other flow
