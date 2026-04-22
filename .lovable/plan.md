

## Rebuild `/rilo` — Self-Care Journey landing page

A complete rewrite of `/rilo` based on the **current** app architecture (Self-Care Journey, Quiz, Weekly Review) and your copywriting direction. Old reference docs deleted.

### Files removed
- `public/SIMORA_PHILOSOPHY.md`
- `public/APP_REFERENCE_DOCUMENT.md`

### Files rewritten
- `src/pages/Rilo.tsx` — full rebuild

### New page structure

**1. Sticky nav** — Rilo wordmark + "Take the Quiz" CTA (anchor to App Store)

**2. Hero (calm, hook-driven)**
- Eyebrow: *Rilo — Self-Care Tracker & Routine Planner*
- Headline: **"Let me guess… you've stopped taking care of yourself."**
- Sub: *"Take the 1-minute quiz and get your personal self-care plan. Take better care of yourself — starting today."*
- Dual CTAs: App Store + Google Play badges
- Hero mockup (existing `rilo-hero-mockup.png`)

**3. The Self-Care Quiz (hero feature, not a footnote)**
- Section title: *"Start with what's missing."*
- 4 questions → diagnosis across **14 self-care categories** (sleep, calm, nutrition, connection, etc.)
- Output: personal goals + a ready-to-launch routine ("Build My Routine")
- Visual: stylized quiz screen mockup

**4. Your Self-Care Journey (the 3 pillars)**
- **Plan** — Self-Care Quiz + Goals + Routine Templates
- **Practice** — Routine Player, Tools, Free Content
- **Reflect** — Weekly Review, Mood Check-in, Streaks

**5. Weekly Self-Care Review (dedicated showcase)**
- *"A gentle check-in every week."*
- Self-Care Balance across **Body · Mind · Environment · People**
- Top 3 habits, returns this week, satisfaction slider
- Smart suggestions for what to drop or add next week

**6. Tools — introduced patiently, one by one**
Each gets its own short paragraph + icon (no rushed grid):
- **Routine Player** — Guided, timer-aware playback of your daily routines with background support.
- **Routine Templates** — Ready-made rituals you can adopt in one tap.
- **Self-Care Goals** — Pick what matters: sleep, calm, connection, nutrition, movement.
- **Breathe** — Immersive breathing exercises.
- **Reflections Journal** — Bilingual (EN/Farsi), guided prompts + free writing.
- **Focus Timer** — Pomodoro with background-safe wall-clock sync.
- **Mood Check-in & Emotions** — Daily mood + drill-down emotion tracking.
- **Listen** — Streaming meditations, soundscapes, and audio classes.
- **Read** — Free library of stories and lessons (no Plus required).
- **Community Chats** — Connect with other women on the journey.
- **Online Classes & Programs** — Live and self-paced courses inside the app.

**7. Free vs Plus (honest, soft)**
- Free: Quiz, Planner, Routines, Read, Community, Mood, Reflections basics
- **Simora Plus**: Unlimited routines/tasks, AI Agents, Fasting, Period, Projects, premium audio

**8. Streaks & Presence**
- "Small wins, every day." Bronze/Silver/Gold daily badges, recovery shields, streak overlays.

**9. FAQ** (with `FAQPage` JSON-LD)
- Is Rilo free? · What's the quiz? · Does it work offline? · Plus pricing · Languages

**10. Final CTA** — *"Take the 1-minute quiz. Get your plan."* + store badges + footer

### SEO (kept and tightened)
- `<title>`: **Rilo — Self-Care Tracker & Routine Planner**
- Meta description, canonical, OG/Twitter cards
- JSON-LD: `SoftwareApplication` + `FAQPage`
- Semantic H1/H2/H3 hierarchy with long-tail phrases ("self-care plan for women", "weekly self-care review", "routine planner app")

### Voice & visuals
- Calm hero → patient feature middle → soft conversion footer
- Existing warm cream/sage/coral palette retained
- Reuses generated mockups; no new image generation needed
- English only

### Out of scope
- No new routes, no new components outside `Rilo.tsx`, no schema changes

