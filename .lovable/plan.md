

## Problem

The ProLinkPicker sheet currently shows all tools as flat 2-column grid cards with no sub-selection capability. Previously, tools like Breathing, Reflection, Audio, Playlist, Video, Routine, etc. had drill-down sub-pickers — but the current UI gives no indication of this. Also, "Explore" should be renamed to match actual pages (Routines Templates, Self-Care Habits).

## Plan

### 1. Reorganize ProLinkPicker into categorized list rows

Replace the 2-column grid with a **single-column list** layout, grouped into logical categories:

**Wellness Tools**
- Journal Writing — direct (no sub)
- Breathing Exercise — has sub-picker (chevron indicator)
- Mood Check-in — direct
- Emotion Naming — direct
- Reflection — has sub-picker (chevron)
- Water Tracking — direct
- Period Tracker — direct
- Fasting Timer — direct
- Weight Logging — direct
- Focus Timer — direct

**Media**
- Audio Track — has sub-picker (chevron)
- Audio Playlist — has sub-picker (chevron)
- Video — has sub-picker (chevron)
- Video Playlist — has sub-picker (chevron)

**Routines & Programs**
- Routine Player — has sub-picker (chevron)
- Self-Care Habits — new link type or rename "inspire" → routes to `/app/tasksbank`
- Routines Templates — rename "inspire" (no value) → routes to `/app/routines`
- Program Page — has sub-picker (chevron)

**Navigation**
- Planner — direct
- Community Channel — has sub-picker (chevron)
- Custom Route — has value input

### 2. Update list item design

Each row:
- Left: colored icon in a small rounded container
- Center: label + subtle description
- Right: chevron `>` for items with sub-pickers, checkmark for selected item

### 3. Fix "Explore" / "inspire" naming

- Rename `inspire` label from "Explore" to "Routines Templates" in `proTaskTypes.ts`
- Update its navigation path (already goes to `/app/routines`)
- Consider whether to keep `requiresValue: false` (just opens the page) — yes, keep it simple

### 4. Add visual cue for sub-picker items

Items whose `requiresValue: true` will show a `ChevronRight` icon on the right, signaling the user will drill into a specific selection sheet.

### Technical Details

**Files to modify:**
- `src/components/app/ProLinkPicker.tsx` — Complete rewrite of layout from 2-col grid to categorized list
- `src/lib/proTaskTypes.ts` — Rename "Explore" label to "Routines Templates"

**List item component** replaces `FeaturedCard`:
```text
┌──────────────────────────────────────┐
│ [🎵]  Audio Track          [>]      │
│        Pick a specific track         │
├──────────────────────────────────────┤
│ [📖]  Journal Writing      [✓]      │
│        Open the journal editor       │
└──────────────────────────────────────┘
```

Categories rendered as section headers (`text-xs font-semibold text-muted-foreground uppercase tracking-wide`).

