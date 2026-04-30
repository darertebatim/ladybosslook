## Full Home Page Mock Alignment

The current Home has the right layout but the wrong visual style. The mock uses a **white/cream card with a colored emoji circle**, while current renders the entire card in the bright color. This plan migrates every remaining mismatch.

### 1. Task Card visual language (`src/components/app/TaskCard.tsx`)

Switch from "fully tinted card" → "white card with colored emoji circle":

| Element | Current | Mock target |
|---|---|---|
| Card background (incomplete) | Full color (`bg-[#FFF492]` etc.) | `bg-card-warm` / `#FFFDFB` (off-white) with warm shadow |
| Card background (completed) | Same color, strikethrough only | Mid-tone color (`#FFEA4E`, `#FFD2A1` etc.) — softer fill |
| Emoji wrapper | Bare 32px emoji | 40px rounded-full **colored** circle (light tint) holding 26px emoji |
| Padding | `pl-3 pr-4 py-3` | `pl-3 pr-4 py-5` (taller, more breathing room) |
| Title size | `text-[15px] font-semibold` | unchanged ✓ |
| Subtitle | `text-[11px] text-black/80` | `text-[11px] text-black/60` (softer) |
| Shadow | none | `shadow-card-warm` (soft warm drop shadow) |

Add two color maps to `TASK_COLOR_CLASSES`:
- `TASK_TINT_CLASSES` — light tint for the emoji circle (current bg colors)
- `TASK_MID_CLASSES` — mid-tone color for completed card fill (`#FFEA4E`, `#FFD2A1`, `#FFC2EA`, etc., matching `O.peachMid`/`O.yellowMid` from the mock)

Apply both code paths (regular + Pro Task branches at lines ~404 and ~510).

### 2. Switcher track shade (`src/pages/app/AppHome.tsx` ~1152)

Already changed to `bg-foreground/[0.06]`, but mock uses **`rgba(0,0,0,0.05)`** which is a hair lighter. Tighten to `bg-black/[0.05] dark:bg-white/[0.08]` for exact match. Also reduce active pill to `text-[11px]` (mock) from `text-xs`.

### 3. Week strip — already updated. Verify selected day is brand-orange filled circle ✓

### 4. Quick-add task input + footer buttons (currently bordered)

The "Quick add task..." pill at the bottom of the task list and any other bordered cards: replace with mock-style **soft warm card** (white bg, no border, warm shadow):

- Remove `border-2 border-urgency/30` style
- Use: `bg-card-warm shadow-card-warm border-[0.5px] border-border-warm/40` (same recipe as Manage/Browse buttons we already migrated)

### 5. Counter chip color polish

Currently `bg-[hsl(var(--tint-peach))]` — keep, but ensure it reads correctly on warm background (mock uses solid `#FFE6C9` peach with `#EB5E33` text). ✓

### Technical notes

- Add new color maps in `src/hooks/useTaskPlanner.tsx` next to `TASK_COLOR_CLASSES`:
  - `TASK_TINT_CLASSES[color]` → light tint (existing values)
  - `TASK_MID_CLASSES[color]` → mid-tone for completed state
- In `TaskCard.tsx`, change card class from `colorClass` to:
  - `isCompleted ? TASK_MID_CLASSES[color] : 'bg-card-warm shadow-card-warm'`
- Wrap the emoji in a `w-10 h-10 rounded-full ${TASK_TINT_CLASSES[color]} flex items-center justify-center` div
- Reduce `FluentEmoji size={32}` → `size={26}`
- Apply changes to BOTH the regular branch (~line 540) AND the Pro Task branch (~line 410) for consistency
- Find the "Quick add task" input in `SortableTaskList.tsx` and apply the same warm-card recipe

### Files to edit

- `src/hooks/useTaskPlanner.tsx` — add `TASK_TINT_CLASSES`, `TASK_MID_CLASSES`
- `src/components/app/TaskCard.tsx` — restructure card layout (both branches)
- `src/components/app/SortableTaskList.tsx` — restyle Quick-add pill
- `src/pages/app/AppHome.tsx` — switcher shade tighten, font size

Approve to ship the full migration.