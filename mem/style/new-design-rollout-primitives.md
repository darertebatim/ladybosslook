---
name: New Design Rollout Primitives
description: Reusable iOS 18 / Liquid Glass page-level primitives (PageHeader, TabPills, IOSIconButton) and the rollout patterns used across all in-app pages.
type: design
---

# New Design Rollout — App Pages

All in-app pages (`/app/*`) follow the iOS 18 / Liquid Glass language established on Home.

## Reusable primitives — use these, do NOT recreate

`src/components/app/ui/`
- **`PageHeader`** — sticky top bar. Props: `title`, `back?`, `right?`, `subRow?`, `variant: "light" | "dark"`. Uses `shadow-ios`, no rings/borders. `variant="dark"` for cinematic pages (Listen).
- **`TabPills`** — animated 2-3 pill switcher. Knob slides; uses `shadow-ios`. `variant: "light" | "dark"`.
- **`IOSIconButton`** — white-circle floating action button. Brand-orange icon (light) or white-on-glass (dark). Uses `shadow-ios`.

## Rollout rules (apply to every new/edited app page)

- Floating UI: replace `shadow-sm`, `border border-X`, `ring-1 ring-X` with **`shadow-ios`**. No rings/borders for elevation.
- Cards/list rows: white `bg-card` (or `bg-card-warm` if a faint warm tint is needed) with `shadow-card-warm`. No hairline borders/rings.
- Active tab/chip: `bg-[hsl(var(--brand-primary))] text-white shadow-ios`.
- Inactive chip: `bg-[hsl(var(--tint-peach))] text-[hsl(var(--fg-warm-muted))]` (light) or `bg-white/10 text-white/70` (dark).
- Page bg: **`bg-background` (pure white `#FFFFFF` light / near-black dark)** for ALL app pages — matches Home. NEVER use `bg-bg-warm` / peach tints / `#FFF8F3` as a page surface. Peach is reserved for inactive chips / small accent surfaces only.
- Listen page: white `bg-background` like everywhere else. Storm/cloud video and dark `#132240` background are deprecated; if a hero strip is wanted later, place it as a small image at the top — never as the whole page background.
- White-circle FABs: `bg-white text-[hsl(var(--brand-primary))] shadow-ios` (use `IOSIconButton`).
- Search inputs: pill-shaped, `shadow-ios`, `border-0`, no focus ring (`focus-visible:ring-0`).
- Primary CTAs over images: `bg-white/95 text-[hsl(var(--brand-primary))]` pill (e.g. "Tap to enroll").

## Listen page (dark variant reference)

`AppPlayer.tsx` is the canonical dark example: cloud/storm hero stays, but every floating element uses dark-variant tokens with `shadow-ios`. Filter pills, language selector, search input, and PlaylistCard CTA all follow this pattern.

## Out of scope

- Inner tool UIs (timer rings, breath circles, mesh gradients) — only headers/buttons sweep.
- Admin pages, marketing pages, onboarding hero/sheet flows.

## How to verify

`rg "shadow-sm|ring-1 ring-(black|white)" src/pages/app/ src/components/app/` should return no hits for floating-UI elevation.

## Page-level header pattern (CANONICAL — matches Home exactly)

Headers must be **glassy AND rounded at the bottom corners**. Inline pattern:

```tsx
<header
  className="sticky top-0 z-30 bg-white/35 dark:bg-black/20 backdrop-blur-xl rounded-b-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
  style={{ paddingTop: 'env(safe-area-inset-top)' }}
>
  <div className="px-4 pt-3 pb-3 flex items-center justify-between min-h-[52px]">
    <h1 className="text-2xl font-bold text-fg-warm">{title}</h1>
    <div className="flex items-center gap-2">{/* IOSIconButton actions */}</div>
  </div>
</header>
```

Required ingredients (do not omit any):
- `bg-white/35 dark:bg-black/20` — translucent (NOT solid `bg-bg-warm`).
- `backdrop-blur-xl` — glass effect.
- `rounded-b-2xl` — rounded bottom corners (this is the Home look).
- Soft drop shadow `shadow-[0_2px_10px_rgba(0,0,0,0.06)]` (NOT `shadow-ios` — Home uses this softer one for headers).

Dark variant (Listen / cinematic photo-bg pages): `bg-black/20 backdrop-blur-xl rounded-b-2xl shadow-[0_2px_10px_rgba(0,0,0,0.18)]`, white text, `<IOSIconButton variant="dark">`.

## Channel/list rows pattern

Drop `divide-y` lists. Use a vertical stack of cards: `flex flex-col gap-2` containing
`bg-card-warm shadow-card-warm rounded-2xl p-3` rows. No hairline borders/dividers.
Unread count badges use `bg-[hsl(var(--brand-primary))] text-white shadow-ios`.