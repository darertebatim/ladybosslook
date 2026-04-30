## Goal

Apply the new Home design language (warm tints, soft `shadow-ios`, white-circle FABs, no rings/borders, peach/orange chips, `bg-card-warm` cards) consistently across the rest of the app. Listen page keeps its cloud background and is restyled as the **dark-mode** variant of the same system.

## What "the new design" means (from Home rollout)

- Floating buttons / chips / pills / switcher knobs → `shadow-ios`, no rings, no borders.
- White-circle action buttons → `bg-white text-[hsl(var(--brand-primary))] shadow-ios`.
- Cards (tasks, list items) → `bg-card-warm shadow-card-warm`, completed state uses tint color (no `opacity-60`).
- Active tab/chip → `bg-[hsl(var(--brand-primary))] text-white` with `shadow-ios`.
- Inactive chip → `bg-[hsl(var(--tint-peach))] text-[hsl(var(--fg-warm-muted))]`.
- Page background → `bg-bg-warm` (light) — except Listen which keeps cloud bg as dark variant.
- Headers → semi-transparent warm background w/ `backdrop-blur-xl`, `shadow-ios`.

## Step 1 — Reusable primitives (do first; everything else uses them)

Create three small components so future pages don't drift:

```text
src/components/app/ui/
  PageHeader.tsx       — standard top bar (title + back/close + optional right slot)
  TabPills.tsx         — animated 2-3 pill switcher (extracted from AppHome)
  IOSIconButton.tsx    — white circle button, shadow-ios, brand-orange icon
```

Also add a `--bg-warm-glass` utility / shared header className so blur/shadow stays consistent.

## Step 2 — Apply per page

For every page below: replace existing header with `PageHeader`, swap chip rows for `TabPills`, replace any `bg-white shadow-sm border …` floating buttons with `IOSIconButton`, recolor cards to `bg-card-warm shadow-card-warm`, remove hairline rings/borders used for elevation.

| Page | File | Notes |
|---|---|---|
| Tools | `AppStore.tsx` | Warm bg, `bg-card-warm` tool tiles w/ tinted emoji circle (mirrors task card). Search bar = pill w/ `shadow-ios`. Goal section keeps current layout. |
| Chats | `AppChat.tsx` | Warm bg, channel rows = `bg-card-warm shadow-card-warm`, unread badge = brand orange chip. Compose FAB = orange circle (this one stays orange — primary action). |
| Presence | `AppPresence.tsx` | Warm bg + warm calendar. Streak/badge cards already match — just sweep shadows/borders. |
| Profile | `AppProfile.tsx` | Warm bg, settings rows in `bg-card-warm` grouped cards (iOS-style). Avatar header chip uses `shadow-ios`. |
| Settings | `AppSettings.tsx` | Same pattern as Profile — grouped warm cards, no hairline dividers. |
| Browse Programs / Read / Inspire | `AppBrowsePrograms.tsx`, `AppRead.tsx`, `AppInspire.tsx` | Card grids → `bg-card-warm shadow-card-warm`, category chips → TabPills. |
| Reflections / Journal / Mood / Emotion / Fasting / Period / Water / Breathe | tool detail pages | Sweep headers + buttons + cards only. Inner tool UI (timers, gradients) stays. |

## Step 3 — Listen page (dark variant)

`AppPlayer.tsx` keeps the cloud background image but is reskinned as the **dark theme** of the new design:

- Header: same `PageHeader` shape, but with `bg-black/30 backdrop-blur-xl` and `text-white`.
- TabPills: use dark-mode tokens — track `bg-white/10`, knob `bg-white/90 text-fg-warm shadow-ios`.
- Playlist cards: `bg-white/8 backdrop-blur-md` (glass over clouds) + `shadow-ios`, white text, `text-white/70` meta. Lock badge becomes a subtle white circle.
- "Tap to enroll" CTA: pill `bg-white text-[hsl(var(--brand-primary))] shadow-ios`.
- Search icon (top-right) → `IOSIconButton` dark variant (white-on-glass, no ring).
- "ALL PLAYLISTS" label → `text-white/60 uppercase tracking-wider` (kept).
- The `AppAudioPlayer` and `AppPlaylistDetail` inherit the same dark/glass treatment.

This way Listen stays cinematic but feels like the same system as Home — just inverted.

## Step 4 — Shared sheets / dialogs

Quick sweep of bottom sheets used across pages so the language is consistent:
- `RoutineBuilderSheet`, `GoalSettingsSheet`, `MoodCelebrationSheet`, `FastingStatsSheet`, `FastingProtocolSheet`, `ReflectionCelebrationSheet`, `EmotionDashboard`.
- Replace `ring-1 ring-black/X` and `border border-black/X` used for elevation with `shadow-ios`.
- Sheet handle = `bg-fg-warm/15` pill, no border.

## Step 5 — Memory updates

Append a "New Design Rollout" memory describing the patterns + the 3 primitives so all future page work picks them up automatically. Update Core line if needed (already covers `shadow-ios`).

## Out of scope (won't touch this round)

- Admin panel pages.
- Onboarding flows (already use their own hero/sheet system).
- Marketing pages (`/`, `/programs`, `/auth`, etc.).
- Inner tool UIs (timer rings, breath circles, mesh gradients) — only their headers/buttons.

## Order of execution

1. Build the 3 primitives + dark variants.
2. Tools, Chats, Presence, Profile, Settings (light pages, biggest impact).
3. Listen (dark variant) + audio player + playlist detail.
4. Tool detail pages headers/buttons sweep.
5. Sheets/dialogs sweep.
6. Save "New Design Rollout" memory.

I'll show you each major page after I finish it so you can course-correct before I move on.