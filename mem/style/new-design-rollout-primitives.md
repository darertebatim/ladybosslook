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
- Cards/list rows: `bg-card-warm shadow-card-warm` (light) or `bg-white/10 backdrop-blur-md shadow-ios` (dark/cinematic).
- Active tab/chip: `bg-[hsl(var(--brand-primary))] text-white shadow-ios`.
- Inactive chip: `bg-[hsl(var(--tint-peach))] text-[hsl(var(--fg-warm-muted))]` (light) or `bg-white/10 text-white/70` (dark).
- Page bg: `bg-bg-warm` for light pages. Listen keeps cloud/storm video and uses **dark variant** of all primitives.
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

## Page-level header pattern (CANONICAL)

Until every app page is migrated to `<PageHeader>`, the inline equivalent is:

```tsx
<header
  className="sticky top-0 z-30 bg-[hsl(var(--bg-warm)/0.85)] backdrop-blur-xl shadow-ios"
  style={{ paddingTop: 'env(safe-area-inset-top)' }}
>
  <div className="px-4 pt-3 pb-3 flex items-center justify-between min-h-[52px]">
    <h1 className="text-2xl font-bold text-fg-warm">{title}</h1>
    <div className="flex items-center gap-2">{/* IOSIconButton actions */}</div>
  </div>
</header>
```

Dark variant (Listen and other photo-bg pages) uses `bg-black/25 backdrop-blur-xl` and `text-white`, with `<IOSIconButton variant="dark">` for actions.

## Channel/list rows pattern

Drop `divide-y` lists. Use a vertical stack of cards: `flex flex-col gap-2` containing
`bg-card-warm shadow-card-warm rounded-2xl p-3` rows. No hairline borders/dividers.
Unread count badges use `bg-[hsl(var(--brand-primary))] text-white shadow-ios`.