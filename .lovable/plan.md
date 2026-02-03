
# Complete Terminology Update: Task to Action, Routine to Ritual

Based on my comprehensive audit of the codebase, I found **multiple remaining instances** that need to be updated across both the user-facing app and admin panel. The screenshots you shared confirm the issue - the Admin Tools page still shows "Routines", "Routines Bank", "Tasks Bank" and the home screen modal shows "Edit Task".

---

## Summary of Changes

### User-Facing App (High Priority)

| File | Current Text | New Text |
|------|-------------|----------|
| `HomeMenu.tsx` | "Routines" menu item | "Rituals" |
| `TaskDetailModal.tsx` | "Edit Task" button | "Edit Action" |
| `AppTaskCreate.tsx` | "Edit Task" header | "Edit Action" |
| `AppTour.tsx` | "add new tasks", "Track your daily tasks", "Complete tasks" | "add new actions", "Track your daily actions", "Honor actions" |
| `TaskCard.tsx` | "today's routine" toast, "complete this task" | "today's rituals", "honor this action" |
| `EmotionDashboard.tsx` | "Add to My Routine" button | "Add to My Rituals" |
| `useTaskPlanner.tsx` | All toast messages with "Task created", "Failed to create task", etc. | "Action created", "Failed to create action", etc. |

### Admin Panel (Lower Priority - Internal)

| File | Current Text | New Text |
|------|-------------|----------|
| `Tools.tsx` | "Routines", "Routines Bank", "Tasks Bank" tabs | "Rituals", "Rituals Bank", "Actions Bank" |
| `TasksBank.tsx` | "Tasks Bank" title, "Add Task" button, toast messages | "Actions Bank", "Add Action", updated toasts |
| `RoutinesBank.tsx` | "Routines Bank" title, "New Routine", "Create Routine" | "Rituals Bank", "New Ritual", "Create Ritual" |

---

## Detailed File-by-File Changes

### 1. HomeMenu.tsx (User-facing menu)
- Line 32: Change `name: 'Routines'` to `name: 'Rituals'`

### 2. TaskDetailModal.tsx (Action detail popup)
- Line 335: Change `Edit Task` button text to `Edit Action`

### 3. AppTaskCreate.tsx (Edit action sheet)
- Line 1960: Change `Edit Task` header to `Edit Action`

### 4. AppTour.tsx (Onboarding tour)
- Line 8: "Track your daily tasks" to "Track your daily actions"
- Line 14: "see your tasks" to "see your actions"
- Line 19: "completed tasks" to "honored actions"
- Line 24: "add new tasks" to "add new actions"
- Line 34: "ready-made routines" to "ready-made rituals"

### 5. TaskCard.tsx (Future date toast messages)
- Lines 84, 115, 140: "today's routine" to "today's rituals"
- Lines 85, 116, 141: "complete this task" to "honor this action"

### 6. EmotionDashboard.tsx (Emotion check-in page)
- Line 233: "Add to My Routine" to "Add to My Rituals"

### 7. useTaskPlanner.tsx (Hook with toast messages)
- Line 601: "Task created!" to "Action created!"
- Line 605: "Failed to create task" to "Failed to create action"
- Line 659: "Added to your routine!" to "Added to your rituals!"
- Line 663: "Failed to add to routine" to "Failed to add to rituals"
- Line 772: "Failed to update task" to "Failed to update action"
- Line 800: "Task deleted" to "Action deleted"
- Line 804: "Failed to delete task" to "Failed to delete action"
- Line 1094: "Task added from template!" to "Action added from template!"
- Line 1098: "Failed to add task" to "Failed to add action"
- Line 1231: "Failed to reorder tasks" to "Failed to reorder actions"
- Line 1307: "Task skipped for today" to "Action skipped for today"
- Line 1311: "Failed to skip task" to "Failed to skip action"
- Line 1373: "Failed to reschedule task" to "Failed to reschedule action"

### 8. Tools.tsx (Admin panel tabs)
- Line 21: "Routines" to "Rituals"
- Line 25: "Routines Bank" to "Rituals Bank"
- Line 29: "Tasks Bank" to "Actions Bank"

### 9. TasksBank.tsx (Admin actions bank)
- Line 516: "Tasks Bank" title to "Actions Bank"
- Line 519: "task templates" to "action templates"
- Line 540: "Add Task" button to "Add Action"
- Line 601: "No tasks yet" to "No actions yet"
- Line 559: "Create Routine" to "Create Ritual"
- Line 499: Toast "Routine created! Go to Routines Bank" to "Ritual created! Go to Rituals Bank"
- Lines 227, 281, 298: Task toast messages to action messages

### 10. RoutinesBank.tsx (Admin rituals bank)
- Line 592: "Routines Bank" title to "Rituals Bank"
- Line 595: "routine templates" to "ritual templates"
- Line 600: "New Routine" button to "New Ritual"
- Line 627: "No routines yet. Click New Routine" to "No rituals yet. Click New Ritual"
- Line 712-714: Dialog titles "Edit Routine"/"New Routine" to "Edit Ritual"/"New Ritual"
- Line 1172: "Create Routine" button to "Create Ritual"
- Lines 256, 506: Toast messages updated

---

## Files NOT Changed (Internal Code)

The following will remain unchanged as they are internal code, not user-facing:
- Variable names (`task`, `routine`, `useTaskPlanner`, etc.)
- Database table names (`user_tasks`, `routines_bank`)
- TypeScript interfaces and types
- Route paths (`/app/routines`)

---

## Implementation Order

1. **User-facing app files first** (what users see):
   - HomeMenu.tsx
   - TaskDetailModal.tsx
   - AppTaskCreate.tsx
   - TaskCard.tsx
   - EmotionDashboard.tsx
   - AppTour.tsx
   - useTaskPlanner.tsx (toasts)

2. **Admin panel files second** (internal tools):
   - Tools.tsx
   - TasksBank.tsx
   - RoutinesBank.tsx

---

## Result

After these changes:
- Users will see "Actions" and "Rituals" consistently everywhere
- Admin panel will also use the new terminology for consistency
- The Simora philosophy of gentle, intention-based language will be fully reflected in the UI
