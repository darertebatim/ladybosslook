---
name: orange-theme-tokens
description: Orange brand palette tokens, brand primitives, and iOS 18 floating tab bar
type: design
---
# Orange Theme — Step 1 + 2 + Nav

## Tokens (in src/index.css under .app-theme + .app-theme.dark)
Additive — coexist with the existing black/white core tokens. Do NOT flip --primary yet.

- Brand: --brand-primary (#EB5E33), --brand-primary-light (#F5A623), --brand-primary-dark (#A63520), --brand-accent-rose (#C2255C)
- Surfaces: --bg-warm, --surface-warm, --card-warm, --fg-warm, --fg-warm-muted, --border-warm
- Tints (auto light/dark via vars): --tint-{peach,mint,lavender,yellow,pink} + -mid; --tint-{lime,sky}-mid
- Dark jewel deeps: --tint-{peach,mint,lavender,yellow,pink,sky,lime}-dark
- --gradient-orange, --gradient-streak, --shadow-card-warm

## Tailwind utilities (tailwind.config.ts)
- bg-brand / bg-brand-light / bg-brand-dark / bg-brand-rose
- bg-bg-warm, bg-surface-warm, bg-card-warm
- text-fg-warm, text-fg-warm-muted, border-border-warm
- bg-{peach,mint,lavender,yellow,pink}, -mid, -dark; bg-lime-mid, bg-sky-mid
- bg-gradient-orange, bg-gradient-streak, shadow-card-warm

## Primitives (src/components/brand/)
TaskCard, ToolShortcutTile, GlassHeader, WeekStrip, GradientBanner, StreakPill.
All accept `tint: TintKey` ('peach'|'mint'|'lavender'|'yellow'|'pink'). Light/dark resolved automatically by CSS vars. Reference implementation: /admin/brand/mock.

## iOS 18 floating tab bar (src/layouts/NativeAppLayout.tsx)
- Detached pill: fixed bottom 12px + safe-area, left/right 12px, rounded-[28px], heavy glass (bg-card-warm/70 backdrop-blur-2xl).
- Active item: peach pill underlay morphs between tabs via framer-motion `LayoutGroup` + `layoutId="nav-active-pill"` (spring mass 0.6 / stiffness 380 / damping 30). Active icon = text-brand, label = text-fg-warm.
- Inactive: text-fg-warm-muted, stroke 1.75 (active stroke 2.4).
- Player/watch override keeps darker glass (#0F1A33/70) with white pill + white text.
- Badges restyled to bg-brand with ring-2 ring-card-warm cut-out.
- Mini-players (`MiniPlayer.tsx`, `RoutineMiniPlayer.tsx`) bumped from 64px to 88px bottom offset to clear the capsule.
