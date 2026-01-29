

# Water Tracking Feature Fixes

## Issues Identified

After analyzing the codebase, I found three distinct problems:

### Issue 1: Water header button only opens if a water task exists for today

**Current behavior:** The Droplets button in the header tries to find a water task for today and opens the `WaterTrackingScreen` only if one exists. If no water task exists, it shows a toast message.

**Expected behavior:** Like Breathe and Journal, the water feature should be a standalone page at `/app/water` that the user can always access.

### Issue 2: "Add Water" button may not work due to missing dialog accessibility attributes

**Current behavior:** Console logs show warnings about missing `DialogTitle` and `Description` for sheet components. The `WaterInputSheet` uses a Sheet component which may have accessibility issues that could affect functionality in some scenarios.

### Issue 3: "Add to my routine" button doesn't exist for water tracking

**Current behavior:** The `WaterTrackingScreen` has no "Add to my routine" functionality.

**Expected behavior:** Like Breathe exercises, users should be able to add water tracking as a routine task.

---

## Solution Plan

### Step 1: Create a dedicated Water Tracking page

Create a new page at `src/pages/app/AppWater.tsx` following the Breathe page pattern:

- Shows the `WaterTrackingScreen` component
- If no water task exists for today, show an option to create one or guide to add via routines
- Accessible from `/app/water` route
- Has a back button to return to home

### Step 2: Add the route in App.tsx

Add a new full-screen route:
```
/app/water → AppWater component (outside AppLayout, like /app/breathe)
```

### Step 3: Update the header button navigation

Change the Droplets button in `AppHome.tsx` to navigate to `/app/water` instead of trying to find a task and open the overlay.

### Step 4: Fix WaterInputSheet accessibility

Add proper `DialogTitle` (with `VisuallyHidden` wrapper) and `DialogDescription` to the Sheet component to fix console warnings.

### Step 5: Add "Add to my routine" button to WaterTrackingScreen

Add an "Add to Routine" button in the `WaterTrackingScreen` that:
- Creates a synthetic task for water tracking (similar to Breathe pattern)
- Opens the `RoutinePreviewSheet` for scheduling customization
- Uses `useAddRoutinePlan` hook to save

### Step 6: Handle the case when no water task exists

In the new `AppWater.tsx` page:
- If no water task exists for today, show a prompt: "Start tracking your water intake"
- Provide a button that opens `RoutinePreviewSheet` with a pre-configured water task template

---

## Technical Details

### New File: `src/pages/app/AppWater.tsx`

```typescript
// Structure:
// - Fetch today's water task (if any) using useTasksForDate
// - If task exists: show WaterTrackingScreen with current progress
// - If no task: show onboarding UI with "Add to My Routine" button
// - Always show back button to /app/home
```

### Modifications to `src/components/app/WaterTrackingScreen.tsx`

1. Add RoutinePreviewSheet integration (like BreathingExerciseCard)
2. Add "Add to Routine" button alongside Settings button
3. Create synthetic water task template

### Modifications to `src/components/app/WaterInputSheet.tsx`

Add accessibility attributes to SheetContent:
```tsx
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
// Inside SheetContent:
<SheetHeader>
  <VisuallyHidden>
    <SheetTitle>Add Water</SheetTitle>
  </VisuallyHidden>
</SheetHeader>
```

### Modifications to `src/App.tsx`

Add new route:
```tsx
const AppWater = lazy(() => import("@/pages/app/AppWater"));
// ...
<Route path="/app/water" element={<ProtectedRoute><AppWater /></ProtectedRoute>} />
```

### Modifications to `src/pages/app/AppHome.tsx`

Change the Droplets button:
```tsx
<button onClick={() => navigate('/app/water')} className="p-2 -ml-2 text-sky-500">
  <Droplets className="h-5 w-5" />
</button>
```

### Water Routine Template (in waterTracking.ts)

```typescript
export const createWaterRoutineTask = (): RoutinePlanTask => ({
  id: 'water-routine-template',
  plan_id: 'synthetic-water',
  title: 'Drink Water 💧',
  icon: '💧',
  duration_minutes: 0,
  task_order: 0,
  is_active: true,
  created_at: new Date().toISOString(),
  linked_playlist_id: null,
  pro_link_type: null,
  pro_link_value: null,
  goal_enabled: true,
  goal_type: 'count',
  goal_target: 8,
  goal_unit: 'cups',
});
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/app/AppWater.tsx` | Dedicated water tracking page |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/app/water` route |
| `src/pages/app/AppHome.tsx` | Change Droplets button to navigate to /app/water |
| `src/components/app/WaterInputSheet.tsx` | Add accessibility attributes |
| `src/components/app/WaterTrackingScreen.tsx` | Add "Add to Routine" button with RoutinePreviewSheet |
| `src/lib/waterTracking.ts` | Add `createWaterRoutineTask` helper |

---

## User Experience After Fix

1. **Tapping water icon in header** → Opens `/app/water` page (always works)
2. **On water page with existing task** → Shows beautiful water tracking screen with progress
3. **On water page without task** → Shows "Start tracking" prompt with "Add to My Routine" button
4. **"Add Water" button** → Opens input sheet (works properly with accessibility fixes)
5. **"Add to Routine" button** → Opens RoutinePreviewSheet to customize scheduling

