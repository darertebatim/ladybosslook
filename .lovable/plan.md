

# Water Tracking Feature Implementation Plan

## Overview
Create a dedicated water tracking screen that opens when tapping on a "Drink Water" task (a regular task with a count-based goal and unit "oz" or "ml"). The screen provides a beautiful themed UI showing today's water intake progress, with a specialized keypad featuring quick-select cup size buttons.

**Note:** The hydration goal calculator (based on body data like weight/activity) will NOT be implemented since I don't have access to verified scientific data for the calculation formula.

## Feature Design

### 1. Detection Logic: "Water Task" Recognition
A task is recognized as a "water task" when it has:
- `goal_enabled: true`
- `goal_type: 'count'`
- `goal_unit` is one of: `'oz'`, `'ml'`, `'cups'`, `'glasses'`

This allows any task with water-related units to open the specialized water tracking screen.

### 2. New Component: `WaterTrackingScreen.tsx`
A full-screen modal/overlay similar to the breathing exercise screen.

**Visual Design (based on Me+ screenshots):**
```
┌─────────────────────────────────────┐
│  [X]          Today                 │  ← Header with close button
│                                     │
│        Sky/clouds illustration      │  ← Light blue sky top section
│                                     │
│                                     │
│           12/73oz                   │  ← Large progress display
│     Water intake & your goal        │
│                                     │
│     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~    │
│     ~~~~~~~~~~ Water waves ~~~~~~~  │  ← Animated water level based on %
│     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~    │
│     🌿      🌊       ⭐             │  ← Decorative underwater elements
│                                     │
│  [⚙️]    [+ Add Water]    [📅]     │  ← Bottom action buttons
└─────────────────────────────────────┘
```

**Water level animation:** The wave illustration rises as progress increases (using CSS gradients or layered divs with wave clip-paths).

### 3. New Component: `WaterInputSheet.tsx`
Extended version of GoalInputSheet with cup size presets.

**Design:**
```
┌─────────────────────────────────────┐
│  Cancel       Add Water             │
│                                     │
│            12|oz                    │  ← Current value with unit
│                                     │
│  [☕12oz] [🥤16oz] [🧊20oz] [🍶24oz] [🫙30oz]  ← Quick presets
│                                     │
│    [7]      [8]      [9]           │
│    [4]      [5]      [6]           │  ← Number keypad
│    [1]      [2]      [3]           │
│    [⌫]      [0]      [✓]           │
└─────────────────────────────────────┘
```

**Cup size presets:** Tapping fills in the value immediately and shows it in the display. User can still manually type a custom amount.

### 4. Flow Integration

**Entry point:** When user taps + button (count goal) or card on a water task:
- Instead of opening `GoalInputSheet`, open `WaterTrackingScreen`
- The screen shows current progress and allows adding water
- Settings button (⚙️) opens the task detail modal for editing

**Files to check for water unit detection:**
- `TaskCard.tsx` - detect water task and route to water screen
- `TaskDetailModal.tsx` - same detection for modal flow

### 5. History Feature (Calendar button)
Simple view showing water intake history (optional, can be Phase 2).

## Technical Implementation

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/app/WaterTrackingScreen.tsx` | Main water tracking fullscreen UI |
| `src/components/app/WaterInputSheet.tsx` | Keypad with cup size presets |
| `src/lib/waterTracking.ts` | Helper functions and constants |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/app/TaskCard.tsx` | Detect water task, open WaterTrackingScreen instead of GoalInputSheet |
| `src/components/app/TaskDetailModal.tsx` | Add "Track Water" button for water tasks |

### Constants (in `waterTracking.ts`)

```typescript
export const WATER_UNITS = ['oz', 'ml', 'cups', 'glasses'] as const;

export const CUP_PRESETS = {
  oz: [
    { label: '12oz', value: 12, icon: 'Coffee' },
    { label: '16oz', value: 16, icon: 'GlassWater' },
    { label: '20oz', value: 20, icon: 'CupSoda' },
    { label: '24oz', value: 24, icon: 'Wine' },
    { label: '30oz', value: 30, icon: 'Bottle' },
  ],
  ml: [
    { label: '250ml', value: 250, icon: 'Coffee' },
    { label: '350ml', value: 350, icon: 'GlassWater' },
    { label: '500ml', value: 500, icon: 'CupSoda' },
    { label: '750ml', value: 750, icon: 'Wine' },
    { label: '1L', value: 1000, icon: 'Bottle' },
  ],
  // similar for cups/glasses
};

export function isWaterTask(task: UserTask): boolean {
  return (
    task.goal_enabled &&
    task.goal_type === 'count' &&
    task.goal_unit &&
    WATER_UNITS.includes(task.goal_unit.toLowerCase())
  );
}
```

### WaterTrackingScreen Component Structure

```typescript
interface WaterTrackingScreenProps {
  task: UserTask;
  date: Date;
  goalProgress: number;
  onClose: () => void;
  onAddWater: (amount: number) => void;
  onOpenSettings: () => void;
}
```

**Key features:**
- Shows task emoji + title in header
- Large progress display: `{goalProgress}/{goal_target}{unit}`
- Visual water level indicator (CSS-based waves)
- Three bottom buttons: Settings (opens task edit), Add Water, History (optional)
- Animated water level that rises based on percentage complete
- Celebration animation when goal is reached

### WaterInputSheet Props

```typescript
interface WaterInputSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: string;
  presets: Array<{ label: string; value: number; icon: string }>;
  onConfirm: (amount: number) => void;
}
```

### Visual Styling

**Color palette (water theme):**
- Sky gradient: `#E3F2FD` to `#BBDEFB` (light blue sky)
- Water color: `#2196F3` to `#1565C0` (blue water)
- Wave layers: Multiple opacity levels of blue
- Decorative elements: Navy blue plants/coral

**CSS for water waves:**
```css
.water-wave {
  position: absolute;
  bottom: 0;
  width: 200%;
  height: var(--water-level);
  background: linear-gradient(to bottom, rgba(33, 150, 243, 0.8), rgba(21, 101, 192, 1));
  border-radius: 100% 100% 0 0;
  animation: wave 3s ease-in-out infinite;
}
```

## Implementation Order

1. Create `waterTracking.ts` with helper functions and constants
2. Create `WaterInputSheet.tsx` (extended keypad with presets)
3. Create `WaterTrackingScreen.tsx` (main UI)
4. Modify `TaskCard.tsx` to detect water tasks and open water screen
5. Modify `TaskDetailModal.tsx` to add water tracking button
6. Test end-to-end with a "Drink Water" task

## What's NOT Included (per user request)

- **Hydration calculator** based on body data (weight, activity, weather) - skipped because reliable scientific formulas are not available
- **History view** - can be added in Phase 2

## User Experience

1. User creates a task "Drink Water 💧" with goal: 8 cups/day
2. On home page, tapping the task opens the water tracking screen
3. User sees beautiful water-themed UI with 0/8 cups progress
4. User taps "+ Add Water" → keypad opens with preset cup sizes
5. User taps "1 cup" preset → value fills in → confirms
6. Screen updates to show 1/8 cups with water level rising
7. Settings button opens task edit modal for changing goal

