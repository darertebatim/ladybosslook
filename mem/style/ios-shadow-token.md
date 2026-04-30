---
name: iOS 18 shadow token
description: Use shadow-ios for floating buttons/pills/switchers across the app. No rings/borders for elevation.
type: design
---
**Rule:** All floating UI surfaces (buttons, pills, chips, switcher knobs, FABs, sheet handles, segmented controls) use the `shadow-ios` Tailwind class. Never add hairline rings (`ring-1 ring-black/X`, `border border-black/X`) for elevation — iOS 18 / Liquid Glass style relies on a soft layered drop shadow only.

**Token (defined in `src/index.css`):**
- Light: `--shadow-ios: 0 1px 2px rgba(0,0,0,0.04), 0 4px 14px rgba(0,0,0,0.10);`
- Dark:  `--shadow-ios: 0 1px 2px rgba(0,0,0,0.4), 0 4px 14px rgba(0,0,0,0.5);`

**Tailwind:** `shadow-ios` (mapped in `tailwind.config.ts` boxShadow).

**White circle FABs:** `bg-white text-[hsl(var(--brand-primary))] shadow-ios` — no ring, no border.

**Cards:** keep `shadow-card-warm` (warm-tinted variant of the same layered pattern). Don't replace it with `shadow-ios`.

**Why:** Matches Apple Notes / iOS 18 floating controls. Hairline rings look like Material Design and clash with our warm/Liquid-Glass aesthetic.
