

# Rename "Action" back to "Task" — Full Terminology Change

## Scope

This is a user-facing terminology rename only. Internal variable names, component names, file names, database columns, and route paths will NOT change (to avoid breaking changes). Only **displayed text** (labels, toasts, descriptions, tour content, notifications) will be updated.

## Files to Change

### 1. Toast messages — `src/hooks/useTaskPlanner.tsx`
- `'Action created! ✨'` → `'Task created! ✨'`
- `'Failed to create action'` → `'Failed to create task'`
- `'Failed to update action'` → `'Failed to update task'`
- `'Action deleted'` → `'Task deleted'`
- `'Failed to delete action'` → `'Failed to delete task'`
- `'Action added from template! ✨'` → `'Task added from template! ✨'`
- `'Failed to add action'` → `'Failed to add task'`
- `'Failed to reorder actions'` → `'Failed to reorder tasks'`
- `'Action skipped for today'` → `'Task skipped for today'`
- `'Failed to skip action'` → `'Failed to skip task'`
- `'Failed to reschedule action'` → `'Failed to reschedule task'`

### 2. Page titles/headers — `src/pages/app/AppActionStats.tsx`
- `'Action Stats'` → `'Task Stats'`
- `'Actions Done Total'` → `'Tasks Done Total'`
- `'Actions Done This Month'` → `'Tasks Done This Month'`
- SEO title/description update

### 3. Page header — `src/pages/app/AppActions.tsx`
- `title="Actions"` → `title="Tasks"`
- `'Action added to your routines! ✨'` → `'Task added to your routines! ✨'`
- `'Failed to add action'` → `'Failed to add task'`

### 4. Tour content — `src/components/app/AppTour.tsx`
- `'Track your daily actions'` → `'Track your daily tasks'`
- `'see your actions'` / `'honored actions'` → `'see your tasks'` / `'honored tasks'`
- `'Honor actions daily'` → `'Honor tasks daily'`
- `'add new actions'` → `'add new tasks'`

### 5. Tour content — `src/components/app/tour/HomeTour.tsx`
- `'Add Actions'` → `'Add Tasks'`

### 6. Tour content — `src/components/app/tour/ActionSheetTour.tsx`
- `'Quick Actions 💡'` → `'Quick Tasks 💡'`
- `'Browse pre-made actions organized by category. Tap the + to add any action to your day.'` → tasks
- `'surprise action'` → `'surprise task'`

### 7. Tour content — `src/components/app/tour/RoutinesTour.tsx`
- `'Individual Actions'` → `'Individual Tasks'`
- `'Individual actions live here...'` → tasks
- `'add any action to your daily planner'` → `'add any task...'`

### 8. Dashboard — `src/components/dashboard/TodayFocusCard.tsx`
- `"honored all your actions"` → `"honored all your tasks"`
- `action${...} remaining` → `task${...} remaining`
- `"One small action is enough"` → `"One small task is enough"`

### 9. Dashboard — `src/components/dashboard/QuickActionsGrid.tsx` (no change needed — these are navigation shortcuts, not "action" terminology)

### 10. Quick start — `src/components/app/TaskQuickStartSheet.tsx`
- `'Type a new action...'` → `'Type a new task...'`

### 11. Celebration — `src/components/app/ChallengeCompleteSummary.tsx`
- `'actions done'` / `'Actions Done'` → `'tasks done'` / `'Tasks Done'`

### 12. Task card — `src/components/app/TaskCard.tsx`
- `"honor this action when the day comes"` → `"honor this task when the day comes"`

### 13. Notifications — `src/components/app/NotificationPreferencesCard.tsx`
- `"Daily overview of your actions"` → `"Daily overview of your tasks"`
- `"honor 3+ actions"` → `"honor 3+ tasks"`

### 14. Presence page — `src/pages/app/AppPresence.tsx`
- `"Actions Done"` → `"Tasks Done"`

### 15. Promo banner admin — `src/components/admin/PromoBannerManager.tsx`
- `'Home - Above Actions'` → `'Home - Above Tasks'`
- `'Action Template'` / `'Action Planner'` → `'Task Template'` / `'Task Planner'`

### 16. Admin Tasks Bank — `src/pages/admin/TasksBank.tsx`
- `'Action created'` / `'Action deleted'` / `'Add Action'` / `'No actions yet'` / `'Reusable action templates'` → task equivalents
- `'Selected Actions'` / `'Actions to Add'` → task equivalents

### 17. Admin Routines Bank — `src/components/admin/RoutinesBank.tsx`
- `'Add Action'` / `'Action created and added'` / `'Daily actions'` / `'No daily actions'` / `'Edit action'` → task equivalents
- `'Normal' desc: 'Actions with their own repeat settings'` → tasks

### 18. Edge functions (notifications) — `supabase/functions/send-daily-notifications/index.ts`
- `"Your actions for today are ready"` → `"Your tasks for today are ready"`

### 19. Edge functions — `supabase/functions/send-momentum-celebration/index.ts`
- `"Your Actions Miss You"` / `"Your actions miss you"` → tasks

### 20. Edge functions — `supabase/functions/send-streak-challenges/index.ts`
- `"Your first action is waiting"` → `"Your first task is waiting"`
- `"actions today"` → `"tasks today"`

### 21. Alarm — `src/lib/taskAlarm.ts`
- `"Time to take action!"` → `"Time to do this task!"`

### 22. Smart nudges — `src/hooks/useSmartActionNudges.ts`
- Comment text updates (Action Reminders → Task Reminders)

### 23. Admin push notifications — `src/pages/admin/PushNotifications.tsx`
- `'Action Reminders'` / notification body text → task equivalents

### 24. Inspire detail — `src/pages/app/AppInspireDetail.tsx`
- `'actions added!'` → `'tasks added!'`
- `'action/actions'` count label → tasks

### 25. Welcome routine card — `src/components/app/WelcomeRoutineCard.tsx`
- Console error text only (minor)

## Not Changed (intentionally)
- File names (ActionLimitSheet, ActionSheetTour, AppActions, etc.) — internal, no user impact
- Variable/function names — internal code
- Route paths (`/app/actions`, `/app/action-stats`) — would break navigation
- localStorage keys (`simora_first_action_celebrated`) — would break state
- CSS class names (`.tour-action-*`) — internal
- Database column/table names
- `QuickActions` component name and its `action` property keys — these are generic UI patterns
- Admin assistant edge function tool names — API identifiers
- `ActionLimitSheet` UI copy — doesn't mention "action" in user-facing text

