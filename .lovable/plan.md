

# Rename "Routine" to "Ritual" and "Task" to "Action" -- Full Project

## Scope

This covers **all user-facing text** across the entire project (app pages, admin pages, comments, labels, placeholders, toasts, tooltips). Internal code (variable names, database tables/columns, hook names) stays unchanged per the existing branding standard.

## Summary of Changes

### A. URL Path Changes (with redirects)

| Old Path | New Path |
|----------|----------|
| `/app/routines` | `/app/rituals` |
| `/app/routines/:planId` | `/app/rituals/:planId` |

Old paths get `<Navigate to="..." replace />` redirects for backward compatibility with older app versions.

### B. User-Facing Text: "Routine" to "Ritual"

Changes across ~25 files. Key examples:

| File | What Changes |
|------|-------------|
| `src/pages/app/AppInspireDetail.tsx` | "Routine not found" -> "Ritual not found", "Back to Routines" -> "Back to Rituals", BackButtonCircle link |
| `src/pages/app/AppInspire.tsx` | Navigation links |
| `src/pages/app/AppHome.tsx` | Navigation links |
| `src/pages/app/AppWater.tsx` | "Add to routine to track daily" -> "Add to ritual...", comments |
| `src/pages/app/AppAudioPlayer.tsx` | "Add to Routine Button" comment, button label |
| `src/pages/app/AppJournal.tsx` | "Add to Routine Button" comment |
| `src/components/app/HomeMenu.tsx` | Route path update |
| `src/components/app/PromoBanner.tsx` | Navigation links (3 occurrences) |
| `src/components/app/TaskQuickStartSheet.tsx` | Navigation link |
| `src/components/app/InspireBanner.tsx` | Navigation links |
| `src/components/app/WaterTrackingScreen.tsx` | "Add to Routine button" comment |
| `src/components/app/JournalReminderSettings.tsx` | Comment updates |
| `src/components/breathe/BreathingExerciseCard.tsx` | "Add to routine button" comment |
| `src/components/breathe/BreathingReminderSettings.tsx` | Comment updates |
| `src/components/mood/MoodDashboard.tsx` | Comment updates |
| `src/components/dashboard/SuggestedRoutineCard.tsx` | Link path |
| `src/components/dashboard/QuickActionsGrid.tsx` | Link path |
| `src/lib/toolsConfig.ts` | Route path |
| `src/lib/proTaskTypes.ts` | Return URL |
| `src/lib/localNotifications.ts` | Deep link return |
| `src/hooks/useAudioRoutine.tsx` | Toast "Failed to add to routine" -> "Failed to add to ritual" |
| `src/App.tsx` | Route definitions + redirect routes, comment update |

**Admin pages:**

| File | What Changes |
|------|-------------|
| `src/components/admin/PromoBannerManager.tsx` | "Routine Plan (specific)" -> "Ritual Plan", "Routine Bank" -> "Ritual Bank", "Unknown Routine" -> "Unknown Ritual", "Select Routine Plan" -> "Select Ritual Plan", "Select Routine from Bank" -> "Select Ritual from Bank", "Tasks Bank Page" -> "Actions Bank Page", "Task Template" -> "Action Template", "Task Planner" -> "Action Planner", "Unknown Task" -> "Unknown Action", "Select Task Template" -> "Select Action Template" |
| `src/components/admin/RoutineManagement.tsx` | "Organize routines into categories" -> "Organize rituals into categories" |
| `src/components/admin/RoutineStatisticsManager.tsx` | "Routines added by users" -> "Rituals added by users", "Published routine templates" -> "Published ritual templates" |
| `src/components/admin/RoutinesBank.tsx` | "Delete this routine?" -> "Delete this ritual?", "Search tasks..." -> "Search actions...", other labels |
| `src/components/admin/AIAssistantPanel.tsx` | "Create routine" -> "Create ritual", "5 tasks" -> "5 actions" |
| `src/components/admin/LeadsManager.tsx` | "Tasks, subtasks, and completions" -> "Actions, subtasks, and completions", "routine progress" -> "ritual progress" |
| `src/pages/admin/System.tsx` | "clears tasks" -> "clears actions", "delete all your user data including tasks" -> "...including actions" |
| `src/pages/admin/TasksBank.tsx` | "Create Routine from Selection" -> "Create Ritual from Selection" (already says "Create Ritual" in buttons) |
| `src/pages/admin/NotificationAnalytics.tsx` | "Task Reminder" -> "Action Reminder" |
| `src/pages/admin/PushNotifications.tsx` | "Task Reminders" -> "Action Reminders" |
| `src/pages/admin/AppTest.tsx` | "Task completed!" -> "Action completed!", "completing this task" -> "completing this action" |

### C. User-Facing Text: "Task" to "Action"

| File | What Changes |
|------|-------------|
| `src/pages/app/AppTaskCreate.tsx` | placeholder "Task name" -> "Action name" |
| `src/pages/admin/System.tsx` | User-facing descriptions mentioning "tasks" |
| `src/pages/admin/NotificationAnalytics.tsx` | Filter label "Task Reminder" |
| `src/pages/admin/PushNotifications.tsx` | "Task Reminders" label |
| `src/pages/admin/AppTest.tsx` | Toast text |
| `src/components/admin/PromoBannerManager.tsx` | Multiple select labels |
| `src/components/admin/LeadsManager.tsx` | Reset data description |

### D. What Does NOT Change

- Database table/column names (e.g., `user_tasks`, `routines_bank`, `task_completions`)
- Hook names (e.g., `useTaskPlanner`, `useRoutinesBank`)
- Component file names (e.g., `RoutinePreviewSheet.tsx`, `TaskQuickStartSheet.tsx`)
- Variable names in code
- Edge function names (e.g., `send-task-reminders`)
- Internal query keys
- CSS class names (e.g., `.tour-tool-routines`)

## Technical Details

### Route Changes in `src/App.tsx`

```text
// Change active routes
path="routines"       -> path="rituals"
path="routines/:planId" -> path="rituals/:planId"

// Add redirect routes inside <Route path="/app">
<Route path="routines" element={<Navigate to="/app/rituals" replace />} />
<Route path="routines/:planId" element={<Navigate to="/app/rituals/:planId" replace />} />
```

Note: The `routines/:planId` redirect needs a small wrapper component to extract the `planId` param and redirect properly, since `<Navigate>` can't interpolate route params directly.

### Estimated File Count

Approximately 30 files need text/URL changes. No database migrations. No new components. All changes are string replacements in user-facing text and URL paths.

