# Polish the Full Onboarding (`/aperture/app/onboard/full`)

Scope is purely UX/UI on `src/aperture/pages/real/OnboardFull.tsx` (plus a tiny CSS tweak if needed). No schema or business-logic changes.

## Issues to fix

1. **Question vs. answer typography is flat** — prompt and chip options look the same weight/size, so the eye can't find the question.
2. **Cramped vertical rhythm** — `gap: 18px` between questions is too tight when each has 4–6 chip rows.
3. **No scroll-to-top on "Next section"** — `window.scrollTo({ top: 0 })` runs on the window, but the actual scroll container is the inner app shell, so on mobile the page stays scrolled to the bottom.
4. **No progress indicator** — only a tiny "Section 1 / 9" chip. User has no sense of how far through they are.
5. **No "saving" feedback per section** — the button label flips to "Saving…" but there's no confirmation that the previous section was stored.
6. **Weak placeholders** — most text inputs fall back to "Type your answer…" or a bare hint. Same complaint as the closing question last turn.
7. **Mobile**: section chip wraps under the title awkwardly; chip buttons are not min-44px tall; bottom action bar scrolls with content instead of being reachable.

## Fixes

### Typography & spacing
- Prompt label: bump to `15px / weight 600 / ink-1`. Hint: `13px / ink-3 / mt 2px`.
- Chip option buttons: keep 13px but increase padding to `10px 14px`, `min-height: 40px`, `border-radius: 999px` (pill) so they read as answers, not labels.
- Question block gap: `28px` between questions, `10px` between prompt → hint → input.
- Add a subtle hairline divider between questions (`border-top: 1px solid var(--ap-hairline)` on every question after the first, with `padding-top: 28px`). Gives clear visual separation.
- Section header (`ApertureMonoLabel`) gets `margin-bottom: 20px`.

### Progress bar
- Add a thin 2px progress bar directly under `PageHeader`:
  - Track: `var(--ap-hairline)`, fill: `var(--ap-signal)`.
  - Width: `((sectionIdx + 1) / sections.length) * 100%`, animated with `transition: width 300ms ease`.
- Keep the `Section X / Y` chip in the header `action` slot but restyle as `Step X of Y` for clarity.

### Scroll-to-top on next/skip
- Replace `window.scrollTo` with a ref on the outermost scrollable element inside `RealAppShell` *and* fall back to scrolling `document.scrollingElement`, `document.documentElement`, and `document.body` to 0. Also scroll the page header into view via `headerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })` as the primary mechanism — works regardless of which ancestor is the scroll container.
- Trigger on both `next()` and `skipSection()` after `setSectionIdx`.

### Saving feedback
- After a successful `persistSection`, show a small inline toast/pill at the top of the new section: `✓ Section saved` that fades out after 1.5s. Implemented with a local `justSaved` state — no new deps.

### Placeholders with examples
Extend `fullPlaceholderFor()` to cover the common keys with concrete, comma-separated examples (mirrors the closing-question pattern from last turn). Examples:
- `revenue_monthly` → `e.g. $3k–$8k, growing slowly, lumpy month to month…`
- `customer_count` → `e.g. about 40 regulars + 10 new walk-ins a month…`
- `ideal_customer` → `e.g. busy moms 30–45 who want quick healthy meals…`
- `marketing_today` → `e.g. Instagram reels 2x/week, word of mouth, some Google ads…`
- `biggest_obstacle` → `e.g. inconsistent leads, no time for marketing, cash flow tight…`
- `goals_6mo` → `e.g. double monthly revenue, hire 1 part-time, open 2nd location…`
- `tools_used` → `e.g. Square POS, QuickBooks, Canva, Meta Ads Manager…`
- Plus a generic fallback that always prepends `e.g.` to the hint when present, never the bare "Type your answer…".

I'll grep `aperture_onboarding_questions` for the actual `question_key` values currently active in `flow='full'` so the map covers what's really shown. (Read-only DB query.)

### Sticky action bar (mobile)
- Wrap the "Skip section / Next section" buttons in a sticky footer inside the card: `position: sticky; bottom: 0; background: var(--ap-surface-1); padding-top: 16px; margin-top: 24px; border-top: 1px solid var(--ap-hairline)`.
- On screens `≥ 640px` keep current inline layout (sticky still works fine but unobtrusive).
- Ensure tap targets are `min-height: 44px`.

### Header layout on mobile
- Move the `Section X / Y` chip to a row *below* the title on narrow viewports (use flex-wrap on `PageHeader` action area) so it doesn't squeeze the title.

### Closing & brief screens
- Apply the same prompt typography + sticky footer to the closing textarea card for consistency.
- Closing textarea: `min-height: 140px`, autofocus on mount.

## Mobile recheck
After implementation, verify at 390×697 (current viewport):
- Section header doesn't overlap chip.
- Chips wrap cleanly with 8px gap and 40px min-height.
- Sticky footer sits above the home indicator area (add `padding-bottom: env(safe-area-inset-bottom)`).
- Scroll-to-top fires when advancing.

## Files touched
- `src/aperture/pages/real/OnboardFull.tsx` — all visual changes, scroll fix, progress bar, save toast, placeholder map expansion, sticky footer.

No DB migration, no edge function changes, no new dependencies.
