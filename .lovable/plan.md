## Why the page still looks wrong

You're right: I've been editing the old `AppPlayer.tsx` piece by piece (changing colors, swapping tokens) while keeping the legacy structure underneath. That's why details keep slipping — the mock and the live page have *different bones*, not just different paint.

Concretely the live page still has:

- A **fixed header** (`fixed top-0`) with a 190px spacer below it, so the header floats over the clouds instead of scrolling like in the mock
- A **parallax transform** on the cloud strip (`translateY(-scrollY * 0.25)`) that the mock does not have
- A **mask-image** fade at the top of the scroll area that creates a faint dark band
- A **PlaylistCard** that uses 96×96 thumbnails, image covers, badges row, language flags inline — totally different from the mock's compact 64×64 colored emoji tile
- Leftover sections: "Continue Learning" with a clock icon, a "Tell us what you want" CTA, promo banners injected mid-list, language popover with a different layout

The mock instead has: status bar simulated → header in normal flow → pills → status row + globe → "ALL PLAYLISTS" caption → simple cards. No fixed positioning. No parallax. No mask.

## Plan: rebuild, don't patch

### 1. Replace `src/pages/app/AppPlayer.tsx` with a 1:1 port of `ListenPhoneFrame` from `BrandMock.tsx`

Structure (top to bottom, all in normal document flow — no `fixed`, no spacer, no mask):

```text
<div bg-background, scroll container>
  ├─ Cloud hero strip (absolute, top 0, h-300, z-0, no parallax)
  │   └─ video + seamless gradient → background
  │
  └─ Content (relative, z-10, scrolls naturally)
      ├─ Header block (transparent, no glass, no shadow)
      │   ├─ Title "Listen" + Search icon button (orange)
      │   ├─ Category pills row (orange active / peach inactive)
      │   └─ Status filters + Language globe (right-aligned)
      ├─ "ALL PLAYLISTS" caption (warm-muted, 11px, tracked)
      └─ Playlist cards list
```

Wire real data into this shell:
- `availableCategories` → category pills
- `progressFilter` → status pills  
- `preferredLanguage` → globe popover
- `filteredPlaylists` → cards

Keep all existing data hooks (`usePlayerData`, `useSubscription`, `useUserPreferredLanguage`, scroll restore, language popup, paywall, tour). Only the JSX shell is rebuilt.

Drop from the old page:
- `fixed` header + 190px spacer → use normal flow like the mock
- Parallax `translateY` on the cloud strip
- `maskImage` fade on the scroll container
- Mid-list `PromoBanner` / `HomeBanner` (move to bottom or remove — confirm below)
- "Continue Learning" with clock icon (mock has no such section — confirm below)
- "Tell us what you want" CTA at the bottom (confirm below)

### 2. Rewrite `PlaylistCard.tsx` to match mock card exactly

Mock card spec:
- 64×64 rounded-xl tile with **solid pastel color** (per category) + large fluent emoji centered, NOT the cover image
- Locked → small lock badge bottom-left of the tile
- Right side: category · duration (warm-muted 11px) → bold title 14px (2 lines) → small badges row (FREE pill green, flag emoji)
- Locked rows get a full-width `bg-peach text-brand` "Tap to enroll ›" footer with top border

Map category → tile color using the existing `O.lavender / pink / peach / mint` palette from BrandMock so cards visually match the mock immediately.

### 3. Verify nav bar parity

Already fixed in the previous turn (removed `/app/player` from `isOverlayContext`). Confirm post-rebuild that the nav bar renders identical to Home.

## Open questions (need your call before I rebuild)

These exist on the live page but NOT in the mock. Tell me what to do with each:

1. **"Continue Learning" section** at the top when no filter is active — keep it (styled like a card row above "ALL PLAYLISTS"), or remove it entirely?
2. **Promo / Home banners** injected between the heading and the card list — keep, move below cards, or remove?
3. **"Not any playlists you want above? Tell us what you want →"** CTA at the bottom — keep or remove?
4. **Card thumbnails** — mock uses solid color tile + emoji. Cards in the DB do have `cover_image_url`. Should I:
   - (a) Always use mock-style colored tile + category emoji (ignore cover images), or
   - (b) Use cover image when present, fall back to colored tile + emoji?

Once you answer, I'll do a single clean rewrite of both files instead of more patches.
