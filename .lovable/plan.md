## Goal

Implement Step 1 (tokens) + Step 2 (primitives) + restyle the bottom **nav menu** with an iOS 18-inspired look, using the Orange Palette already documented in `/admin/brand`.

Note: There is no separate admin/web theme to worry about — the orange tokens will be scoped to `.app-theme` so admin pages stay untouched.

---

## Step 1 — Wire orange tokens into `.app-theme`

File: `src/index.css` (extend existing `.app-theme` and `.app-theme.dark` blocks).

Add new tokens **alongside** the current black/white ones (do not flip `--primary` yet; we migrate components first):

Light (`.app-theme`):
- Brand: `--brand-primary: 14 82% 56%` (#EB5E33), `--brand-primary-light: 36 91% 55%` (#F5A623), `--brand-primary-dark: 13 70% 39%` (#A63520), `--brand-accent-rose: 336 71% 45%` (#C2255C)
- Warm surfaces: `--bg-warm: 28 100% 97%`, `--surface-warm: 28 100% 96%`, `--card-warm: 30 60% 99%`
- Warm text: `--fg-warm: 22 53% 12%`, `--fg-warm-muted: 23 22% 45%`, `--border-warm: 27 67% 87%`
- Tints (light + mid pairs): `--peach`, `--peach-mid`, `--mint`, `--mint-mid`, `--lavender`, `--lavender-mid`, `--yellow`, `--yellow-mid`, `--pink`, `--pink-mid`, `--lime-mid`, `--sky-mid`
- Gradient + shadow: `--gradient-orange`, `--shadow-card-warm`

Dark (`.app-theme.dark`):
- `--bg-warm: 22 53% 6%` (#1A0F08), `--surface-warm: 22 50% 12%` (#2A1A10), `--card-warm: 22 50% 9%` (#1F140B)
- `--fg-warm: 28 100% 96%`, `--fg-warm-muted: 27 28% 65%`, `--border-warm: 22 38% 17%`
- Jewel-tone tints: `--peach-dark` (#3D2A1A), `--mint-dark` (#1A2E26), `--lavender-dark` (#2A1F3A), `--yellow-dark` (#3A3010), `--pink-dark` (#3A1A2A), `--sky-dark` (#1A2638), `--lime-dark` (#1E3020)
- `--shadow-card-warm` with stronger opacity

File: `tailwind.config.ts` (extend `theme.extend.colors`):
- `peach`, `peach-mid`, `peach-dark` (and same for mint/lavender/yellow/pink/lime/sky)
- `bg-warm`, `surface-warm`, `card-warm`, `fg-warm`, `fg-warm-muted`, `border-warm`
- `brand`, `brand-light`, `brand-dark`, `brand-rose`
- `backgroundImage`: `gradient-orange`, `gradient-streak`
- `boxShadow`: `card-warm`

All values use `hsl(var(--token))` per the design system rule.

---

## Step 2 — Build reusable primitives

New folder: `src/components/brand/`

1. `TaskCard.tsx` — colored emoji circle + subtitle row (time · repeat · goal) + title + SealCheck/empty circle. Auto dark/light via tokens. Props: `task`, `done`, `onToggle`.
2. `ToolShortcutTile.tsx` — for when shortcuts return. Emoji circle, label, completion dot.
3. `GlassHeader.tsx` — translucent backdrop-blur header shell with `left | center | right` slots.
4. `WeekStrip.tsx` — 7-day strip; today filled with `--brand-primary`, past days have green completion dots.
5. `GradientBanner.tsx` — orange→yellow gradient banner with decorative blob (Quiz/Promo/Mood/Weekly).
6. `StreakPill.tsx` — gradient flame chip.

(SealCheck already exists — reuse as-is.)

Each primitive uses ONLY semantic tokens (no inline hex). Light/dark handled by CSS vars automatically.

---

## Step 3 — Restyle the nav menu (iOS 18 inspired)

File: `src/layouts/NativeAppLayout.tsx` (the bottom tab bar at lines 214-288).

iOS 18 design cues to apply:
- **Floating tab bar**: detached from the screen edge — 16px horizontal + 12px bottom margin (above safe area), `rounded-[28px]` pill shape, not full-width.
- **Heavy glass material**: `bg-card-warm/70 backdrop-blur-2xl backdrop-saturate-150`, hairline border `border border-border-warm/40`, soft shadow `shadow-card-warm`.
- **Active tab**: pill-shaped soft fill behind the active item using `bg-peach` (light) / `bg-peach-dark` (dark), the icon switches to `text-brand-primary`, label below in solid `text-fg-warm`.
- **Inactive**: icons + labels in `text-fg-warm-muted`, no fill.
- **Spring animation**: active pill slides between tabs using `framer-motion` `layoutId="nav-active-pill"` with a spring transition (mass 0.6, stiffness 380, damping 30) — that smooth iOS underline-glide feel.
- **Filled icons on active**: switch icon set so active uses the solid/filled variant where lucide offers it (`Home` filled via `fill-current`, otherwise stroke 2.5; inactive stroke 1.75).
- **Badges**: keep functional behavior; restyle to `bg-brand-primary text-white` with a subtle outer ring matching the bar background for the cut-out look.
- **Player/watch override**: keep the existing dark-glass variant but restyle to the same floating pill (just darker glass) so the language is consistent.
- **Touch targets**: minimum 48px per tab (currently 44 — bump up).
- **Haptics**: keep existing light/medium pattern.

Visually: think iOS 18 Apple Music / Photos — a floating capsule that hovers over the content, with a soft pill that morphs between active items.

---

## QA pass (mandatory before declaring done)

1. Light + dark mode at 390x844 — header doesn't clash with glass nav.
2. Active pill animates smoothly between all 4 tabs.
3. Badge (chats unread) renders correctly on top of the glass.
4. Player page (`/app/player`) and Watch pages still get the dark variant.
5. Mini-player + routine mini-player sit cleanly above the floating bar (may need to bump their `bottom` offset).
6. Safe-area inset respected on iOS notched devices.
7. Keyboard-open state still hides the nav (already wired).

---

## Out of scope (next phases)

- Migrating Home, Tools, banners, task cards (Step 3+ in the master plan).
- Flipping global `--primary` to orange (we do that after all surfaces migrate).
- Bringing back hidden shortcuts (still hidden behind `{false && ...}`).

---

## Technical notes

- All new tokens use HSL space-separated triplets, accessed via `hsl(var(--token))`.
- Tokens scoped to `.app-theme` only — admin pages unaffected.
- `framer-motion` already installed; use `LayoutGroup` + `layoutId` for the active pill morph.
- Mini-player offset: check `MiniPlayer.tsx` and `RoutineMiniPlayer.tsx` for hardcoded `bottom` values that may need a small bump (e.g., 76px → 92px) to clear the floating pill.
- Update memory after shipping: add `mem://design/orange-theme-tokens` and update `mem://navigation/app-navigation-specs` with the iOS 18 floating capsule note.
