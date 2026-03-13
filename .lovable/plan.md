

# Redesign Journal Page to Match Timer Layout

## Current State
The journal page has an old design: purple header with inline stats, a card with "Write Today's Entry" and "Add to Routine" buttons in the scroll area, and search/plus icons in the header.

## Target State
Match the timer's layout pattern:
- **Top bar**: X/close button (left), "My Journal" title (center-ish), stats icon (right) + search icon
- **Middle**: Scrollable entries list (no quick actions card)
- **Bottom bar**: Add to routine button (left circle), "Write Today's Entry" (center, full-width dark button), Settings/search (right circle — we'll use search here since journal doesn't have settings)

## Changes

### `src/pages/app/AppJournal.tsx` — Full redesign

1. **Remove** the purple header (`bg-[#F4ECFE]`) with rounded bottom and inline stats grid
2. **New top bar** (plain `bg-background`, matching timer):
   - Left: X button → navigates back to `/app/home`
   - Center: "My Journal" title
   - Right: Stats icon (links to profile journal stats section) + Search icon
3. **Remove** the Quick Actions Card from the scroll area
4. **New bottom bar** (matching timer's 3-column layout):
   - Left: Routine button (orange `CalendarPlus` circle, or green check if already added) — uses existing `JournalReminderSettings` logic
   - Center: "Write Today's Entry" dark rounded-full button
   - Right: Search toggle (circle button)
5. **Search bar**: When toggled, appears below the top bar (same as current behavior)
6. **Loading state**: Updated to match new header style

### `src/components/app/JournalReminderSettings.tsx` — Extract logic

Expose the routine state (isAdded, handleClick, showSheet) so the parent can render the circle button in the bottom bar instead of the inline button.

### Files to modify:
- `src/pages/app/AppJournal.tsx` — Main layout restructure
- `src/components/app/JournalReminderSettings.tsx` — Adapt for bottom-bar usage

