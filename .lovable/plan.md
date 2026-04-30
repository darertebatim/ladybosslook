## What went wrong last time

The previous pass only did a global find-and-replace of `shadow-sm` → `shadow-ios`. The actual structural elements you can see broken in your screenshots — the boxed Tools card, the cropped Listen hero, the inconsistent Chats header — were never touched.

This plan goes page by page and rewrites the header + first screen layout to match the Home language: warm full-bleed background, sticky translucent header with `shadow-ios`, white-circle `IOSIconButton`s, `bg-card-warm` rows, `TabPills` switcher, no hairline rings.

## The Home reference (what every page must match)

- Page bg: `bg-bg-warm` full-bleed, no inner rounded card wrapping the content.
- Header: `fixed top-0` translucent `bg-white/35 dark:bg-black/20 backdrop-blur-xl rounded-b-2xl shadow-ios`. Title is `text-xl font-bold`, right-side actions are `IOSIconButton` (white circle, brand-orange icon, no ring).
- Switcher: `TabPills` (pill track + sliding knob, `shadow-ios`).
- Cards / list rows: `bg-card-warm shadow-card-warm rounded-2xl`, no borders/dividers.

---

## Page 1 — Tools (`AppStore.tsx`)

**Issues in screenshot:** whole content sits inside a big rounded card wrapper; header is plain inside that card; "FREE" chips on tool tiles have a heavy old-style shape; section titles use small uppercase muted text instead of warm bold.

**Changes:**
1. Remove the outer rounded-card visual. Page becomes `bg-bg-warm` full-bleed like Home.
2. Replace header (lines 274–316) with `<PageHeader title="Self-Care Tools" right={<IOSIconButton onClick={...}><Search/></IOSIconButton>} />`. Search-mode keeps the same pattern but inline.
3. Section titles: bump from `text-sm font-semibold` → `text-base font-bold text-fg-warm` to match Home's "Today's Tasks" style. "All →" links use `IOSIconButton size="sm"` only when it's an icon, otherwise plain text.
4. Tool tiles (`ToolCard size="compact"`): swap container to `bg-card-warm shadow-card-warm rounded-2xl`, remove any `border`/`ring`. The "FREE 🔥" chip becomes a small `bg-[hsl(var(--tint-peach))] text-fg-warm` pill with `shadow-ios`.
5. Routine template horizontal cards already use `bg-card-warm`-ish surfaces — sweep their border/ring usage.
6. Promo + emotion banner stay (they're already on-brand).

**File:** `src/pages/app/AppStore.tsx` + `src/components/app/ToolCard.tsx`.

---

## Page 2 — Listen (`AppPlayer.tsx`)

**Issues in screenshot:** the cloud hero is clipped inside a rounded rectangle (because it lives inside the same outer card wrapper from the layout); header looks flat; only ~half the page feels "dark mode" — bottom is just navy.

**Changes:**
1. Make hero truly full-bleed. Today the wrapper is `flex flex-col h-full overflow-hidden` with a fixed video at `top-0`. The visible "rounded box" around the page is coming from `NativeAppLayout` / `AppProvidersLayout` adding a card frame — verify and remove the rounded container around the `<Outlet/>` for the Listen route only (or via a `bleed` prop).
2. Header (lines 293–415): replace with `<PageHeader variant="dark" title="Listen" right={<IOSIconButton variant="dark"><Search/></IOSIconButton>} subRow={<>category pills + filters</>} />`. Drop the bespoke `h-12` row.
3. Category pills row: replace the `WatchCategoryPill`-on-track approach with `<TabPills variant="dark" />` for the `availableCategories` (All/Podcast/Course/Audiobooks). The locked Soundscape Crown overlay stays as a small badge attached to the pill.
4. Progress filter row (`all / in_progress / completed`): also `<TabPills variant="dark" />`. Already has dark tokens — just standardize.
5. Language selector → `IOSIconButton variant="dark"` containing the flag emoji.
6. "ALL PLAYLISTS" label keeps `text-white/60 uppercase tracking-wider`.
7. PlaylistCard already uses `bg-white/10 backdrop-blur-md shadow-ios` — leave it.
8. Bottom dark fade: extend the storm gradient further down so the page doesn't visually "end" at the hero — keep the dark navy as the canonical Listen background and sweep storm/cloud opacity down to ~70vh instead of 420px.

**Files:** `src/pages/app/AppPlayer.tsx`, possibly `src/layouts/NativeAppLayout.tsx` (for the bleed container fix).

---

## Page 3 — Chats list (`AppChannelsList.tsx`)

**Issues in screenshot:** old-style "Channels / Your community spaces" card header with mixed orange + white circle buttons (calendar is filled orange, headphones + megaphone are plain white). List rows have hairline dividers, no card style. Support row uses a flat orange icon next to plain text.

**Changes:**
1. Replace the header card with `<PageHeader title="Channels" right={<><IOSIconButton><CalendarPlus/></IOSIconButton><IOSIconButton><Headset/></IOSIconButton><IOSIconButton><Megaphone/></IOSIconButton></>} />`. All three become identical white-circle `IOSIconButton`s for visual consistency. (You can keep the calendar action distinct via a small dot badge if needed, but don't paint the button orange — the orange compose FAB is already the primary action.)
2. Drop "Your community spaces" subtitle, or move it to `text-fg-warm-muted text-xs` under the title.
3. Channel rows: wrap each in `bg-card-warm shadow-card-warm rounded-2xl p-3` with `gap-3` between rows. Remove the hairline divider line. Unread count badge becomes `bg-[hsl(var(--brand-primary))] text-white rounded-full text-xs px-2 py-0.5 shadow-ios`.
4. Avatar container: keep emoji circles but standardize size to 44px and use `bg-tint-peach` instead of plain `bg-muted`.
5. "Support PRIVATE" row: same card treatment; PRIVATE chip becomes `bg-[hsl(var(--brand-primary))] text-white shadow-ios` pill.
6. Empty state ("We'd love to hear from you") stays.

**File:** `src/pages/app/AppChannelsList.tsx`.

---

## Page 4 — Chat thread (`AppChat.tsx`)

**Changes:**
1. Header (lines 509–538): replace with `<PageHeader back title={<div><div>Support</div><div className="text-xs text-fg-warm-muted">Private conversation</div></div>} right={<presence dot>} />`. Remove `border-b border-border/30` (rings/borders rule).
2. Conversation-starter buttons (lines 588–600): swap `bg-muted/50 border border-border/30` → `bg-card-warm shadow-card-warm` (no border).
3. Date separator pill: keep, but use `bg-card-warm shadow-ios`.
4. Input area footer (line 671): drop `border-t border-border/30`, replace with `shadow-ios` (top-shadow effect).
5. Loading-state header (lines 461–484): same `PageHeader` swap.

**File:** `src/pages/app/AppChat.tsx`.

---

## Page 5 — Profile (`AppProfile.tsx`)

**Changes (sweep + restructure):**
1. Header → `<PageHeader title="You" right={<IOSIconButton onClick={settings}><Settings/></IOSIconButton>} />`.
2. Avatar/name hero block: `bg-card-warm shadow-card-warm rounded-3xl p-5` instead of any current ring/border framing.
3. Settings groups: render as iOS-style grouped cards — wrap each section in `bg-card-warm rounded-2xl shadow-card-warm divide-y divide-fg-warm/5` (the only allowed hairline is intra-group dividers; no external border).
4. Streak / badge / stats tiles inside profile keep their current emoji art, just swap `shadow-sm` → `shadow-ios` and remove rings.

**File:** `src/pages/app/AppProfile.tsx`.

---

## Page 6 — Settings (`AppSettings.tsx`)

Same pattern as Profile: `PageHeader back title="Settings"`, grouped `bg-card-warm` cards, no hairlines for elevation, destructive "Delete account" sits in its own red-tinted card.

**File:** `src/pages/app/AppSettings.tsx`.

---

## Page 7 — Presence (`AppPresence.tsx`)

**Changes:**
1. Header → `PageHeader title="Presence" subRow={<TabPills options=[Streak/Calendar/Badges] />}`.
2. Calendar grid: warm tints (`bg-card-warm` for completed days, `bg-tint-peach` for partial). Already mostly on-brand — sweep shadows.
3. Badge cards (Bronze/Silver/Gold): wrap in `bg-card-warm shadow-card-warm`, no ring.

**File:** `src/pages/app/AppPresence.tsx`.

---

## Layout-level fix (root cause of the "boxed" look)

In your Tools and Listen screenshots there is a visible **rounded outer card** around the whole page. Home doesn't have it because Home uses a fixed translucent header that floats over a full-bleed bg. I'll inspect `NativeAppLayout.tsx` / `AppProvidersLayout.tsx` to find the shared wrapper that adds `rounded-2xl bg-card` around the route outlet and either:
- remove it globally now that every page brings its own bg, or
- add a `bleed` prop the page can opt into (Home, Listen, Tools all opt in).

Without this fix, no amount of per-page edits will make Tools/Listen look full-bleed like Home.

---

## Order of execution

1. **Layout bleed fix** (so subsequent pages actually go edge-to-edge).
2. **Tools** — biggest visual delta, validates the pattern.
3. **Listen** — dark variant + true full-bleed hero.
4. **Chats list** + **Chat thread**.
5. **Profile** + **Settings**.
6. **Presence**.
7. Sweep tool detail pages (Reflections, Breathe, Fasting, Period, Mood, Emotion) — header + buttons only, inner UIs untouched.
8. Update memory `mem://style/new-design-rollout-primitives` with the layout-bleed rule and the "FREE chip = peach pill" rule.

I'll show a screenshot after each major page (Tools → Listen → Chats) so you can course-correct before the next one.

## Out of scope

Inner tool UIs (timer rings, breath circle, mesh gradients), admin pages, marketing pages, onboarding hero/sheet flows.
