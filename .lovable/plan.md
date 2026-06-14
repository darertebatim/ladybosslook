
# Aperture — Design & Build Plan

Aperture is a separate product from Rilo, but lives in the same repo for now. It gets its own top-level route, its own theme provider, its own layout chrome, and its own design tokens — fully isolated from Rilo's orange app theme so nothing leaks either direction.

The plan is sequenced in three phases. We finish each phase, review, and move on.

---

## Phase 1 — Brand kit (`/aperture/brand`)

Goal: lock the visual language as a real, reusable system, not inline styles in a mock.

What gets built:

- **Logo & wordmark**
  - Generate an Aperture mark: a precision-instrument feel (camera aperture blades + signal/lens nod), monoline, works at 16px and at 512px.
  - Three lockups: mark only, mark + wordmark horizontal, wordmark only.
  - Light-canvas and dark-canvas variants.
- **Design tokens** (in a dedicated `aperture.css`, scoped under `.aperture-root`)
  - Canvas: `#0A0A0A` / `#141414` / `#1C1C1C` / hairline `#262626` (dark); `#F6F6F7` / `#FFFFFF` / `#ECECEE` (light).
  - Ink: `#FAFAFA` / `#A8A8A8` / `#6B6B6B` (dark); `#0A0A0A` / `#3A3A3A` / `#6B6B6B` (light).
  - Accent (Aperture Signal): one warm orange derived from Rilo orange but pulled slightly more amber/precise (e.g. `#FF6B1A` primary, `#EB5E33` pressed, `#FFB089` glow). Used sparingly — status, run-state, single CTA per view.
  - Semantic: success `#7BB661` / `#3F8A4C`, warn `#D4A24C` / `#B8852E`, danger `#D45A4C`, live `#7BB661` pulse.
  - Type: **Inter** (UI/body, 13/14/16/22/32/48), **JetBrains Mono** (labels, step numbers, data, hash IDs).
  - Radii: 6 / 10 / 14 / 18. Shadows: hairline border + soft `0 1px 0 rgba(255,255,255,0.04)` inset for raised cards on dark.
  - Spacing scale 4/8/12/16/24/32/48/64.
- **Primitives** (new components, namespaced `Aperture*`)
  - `ApertureLogo`, `ApertureWordmark`
  - `ApertureLayout` (theme provider + canvas)
  - `ApertureMonoLabel`, `ApertureBadge`, `ApertureCard`, `ApertureButton` (default/ghost/accent), `ApertureIntegrationDot`, `ApertureChip`, `ApertureSwitch` (day/night)
- **Brand showcase page** at `/aperture/brand` — single scroll page demonstrating: logo lockups, color tokens, type scale, primitive components, light/dark side-by-side. Replaces the role of the current `JasperMock`.

---

## Phase 2 — Product app screens (`/aperture/app/*`)

Goal: real navigable product UI using only the Phase 1 primitives. Static data, no backend yet — every screen reads from a typed mock dataset so we can wire real APIs later without touching presentation.

Routes:

- `/aperture/app` — home: today's pulse (revenue, top integration alerts, suggested playbook to run, last run summary).
- `/aperture/app/playbooks` — playbook library: cards grouped by data source, search, "Run" affordance, "+ New playbook".
- `/aperture/app/playbooks/:slug` — playbook detail + run: shows steps, connected sources strip, live-data chip ("LIVE · 2M AGO"), run output (post draft / digest / reconciled list).
- `/aperture/app/chat` — grounded chat: assistant uses Business Memory as context. Built with AI Elements (`Conversation`, `Message`, `MessageContent`, `MessageResponse`, `PromptInput`).
- `/aperture/app/memory` — Business Memory: connected sources panel, key facts (MRR, top SKU, lapsed customers count), uploaded docs.
- `/aperture/app/integrations` — full grid of supported integrations with connect/disconnect (Instagram, Square, Stripe, Salesforce, QuickBooks, Shopify, HubSpot, GA4, Meta Ads).
- `/aperture/app/settings` — workspace, theme toggle, billing placeholder.

App chrome:

- Desktop: left rail (logo, primary nav, workspace switcher), main column, optional right "Business Memory" rail on home and playbook-run views.
- Mobile: bottom tab bar (Home · Playbooks · Chat · Memory · More) with pinned composer on Chat.

Quality bar: every screen renders correctly in both day and night modes, at desktop and mobile widths, and uses only Aperture tokens.

---

## Phase 3 — Marketing site (`/aperture` root + `/aperture/pricing`, etc.)

Goal: a public landing surface that sells the connected-business-memory positioning.

Sections:

1. **Hero** — wordmark + line: *"Your business has a memory. Aperture is how you use it."* One primary CTA (Join waitlist), one secondary (See a playbook).
2. **Live demo strip** — animated "Weekly Revenue Digest" running with live source chips (Stripe + QuickBooks).
3. **How it works** — three steps: Connect your tools → Pick a playbook → Get finished work. Each step uses an `ApertureCard` with a mono step label.
4. **Playbook gallery** — 6 marquee playbooks with the integrations that power each.
5. **Integrations grid** — all supported platforms with status (Live / Beta / Coming soon).
6. **Why Aperture** — three contrast cards (vs generic AI / vs dashboards / vs another tool).
7. **Pricing** — Starter (free, 1 connection) / Operator ($X, all connections, unlimited playbooks) / Team (multi-seat).
8. **FAQ + footer** — security/privacy posture, integrations, contact, waitlist form.

Pages: `/aperture` (landing), `/aperture/pricing`, `/aperture/playbooks` (public gallery), `/aperture/integrations` (public list), `/aperture/manifesto` (long-form positioning).

SEO: title under 60 chars, meta description under 160, single H1 per page, OG image using the Aperture mark on dark canvas.

---

## Architecture & isolation rules

- All Aperture code lives under `src/aperture/` (pages, components, hooks, tokens). No cross-imports from `src/components/app/*` or Rilo's design tokens.
- `aperture.css` is imported only by `ApertureLayout`. Tokens are scoped with `.aperture-root { … }` so Rilo's `--primary` etc. are untouched.
- `App.tsx` mounts a single `/aperture/*` route group that lazy-loads `ApertureLayout` + its child routers.
- No Capacitor, RevenueCat, or mobile-app code paths in Aperture — it is web-only for now.
- No Supabase tables or edge functions in Phase 1–3. Mock data lives in `src/aperture/data/*.ts` with typed shapes ready for future API wiring.

---

## Technical detail (for the build pass)

```text
src/aperture/
  tokens/aperture.css
  brand/
    ApertureLogo.tsx
    ApertureWordmark.tsx
  components/
    ApertureLayout.tsx        // theme provider, canvas, day/night
    ApertureMonoLabel.tsx
    ApertureCard.tsx
    ApertureButton.tsx
    ApertureChip.tsx
    ApertureIntegrationDot.tsx
    ApertureSwitch.tsx
    nav/AppSidebar.tsx
    nav/MobileTabBar.tsx
    marketing/MarketingHeader.tsx
    marketing/MarketingFooter.tsx
  data/
    integrations.ts
    playbooks.ts
    memory.ts
  pages/
    brand/BrandShowcase.tsx
    app/Home.tsx
    app/Playbooks.tsx
    app/PlaybookDetail.tsx
    app/Chat.tsx               // AI Elements composition
    app/Memory.tsx
    app/Integrations.tsx
    app/Settings.tsx
    marketing/Landing.tsx
    marketing/Pricing.tsx
    marketing/PlaybooksPublic.tsx
    marketing/IntegrationsPublic.tsx
    marketing/Manifesto.tsx
  router.tsx                   // /aperture/* route tree
```

Phase 1 ships first as an isolated, reviewable visual system. We hold before Phase 2 so you can sign off on tokens and the logo.
