

## Redesign: Week Strip Day Items as Rounded Squares

### Current State
Each day in the week strip is a vertical column with the day name above and a circle below. Coins replace the circle content. The selected day gets a pill-shaped lavender background.

### New Design
Each day becomes a **rounded square card** containing both the day name and number stacked inside. Key changes:

1. **Square shape**: Replace the circle+label layout with a single `w-11 h-14 rounded-xl` container per day
2. **Layout inside square**: Day name (e.g., "Tue") on top, date number (e.g., "10") below, both centered vertically
3. **Selected state**: Lavender background (`bg-chip-lavender`) with dark text, slightly scaled up
4. **Today (unselected)**: Subtle violet border or lighter violet background
5. **Default**: Light gray text on transparent background
6. **Coins/badges**: When a day has a badge, the coin image fills the lower portion of the square (replacing the number), day name stays visible on top
7. **Program event stars**: Positioned at top-right corner of the square

### File Changes
- **`src/pages/app/AppHome.tsx`** (lines ~749-789): Restructure the day button markup from circle+label to a single rounded square card with both elements inside. Remove the separate day name span and circle div, replace with one unified container.

### Visual Spec
```text
┌─────┐  ┌─────┐  ┌█████┐  ┌─────┐
│ Sun │  │ Mon │  │ Tue │  │ Wed │
│  8  │  │ 🥇  │  │ 10  │  │ 11  │
└─────┘  └─────┘  └█████┘  └─────┘
 gray    coin+gray  selected   gray
```

Selected = lavender bg, bold text. Coins overlay the number area. The gap between items stays at roughly the same `calc(100%/7)` width distribution.

