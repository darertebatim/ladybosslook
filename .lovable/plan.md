

# Terminology Cleanup: "Ritual" → "Routine" & "Task" → "Action"

## Investigation Summary

Found **remaining "ritual" references in 15 files** across the app, admin panel, and edge functions. Here's every location grouped by area.

---

## App (User-Facing UI) — 10 files

| File | What to change |
|------|---------------|
| `src/components/app/TaskTemplateCard.tsx` | aria-label: "Add to my rituals" → "Add to my routines" |
| `src/components/app/TaskCard.tsx` | 3 toast messages: "today's rituals" → "today's routines" |
| `src/components/app/ProgramEventCard.tsx` | Toast: "today's rituals" → "today's routines" |
| `src/components/app/JournalReminderSettings.tsx` | Button text: "Add Journaling to My Rituals" → "...Routines"; toast: "ritual" → "routine" |
| `src/components/mood/MoodDashboard.tsx` | Variable names (`showRitualPrompt`), toast: "added to your rituals!" → "routines!", comments |
| `src/pages/app/AppWatch.tsx` | Comments + toasts: "rituals" → "routines" |
| `src/components/breathe/BreathingExerciseCard.tsx` | Function name + toasts: "rituals" → "routines" |
| `src/components/app/paywalls/PaywallMascot.tsx` | Feature text: "Unlimited rituals to your planner" → "Unlimited routines..." |
| `src/components/app/tour/PlaylistTour.tsx` | Tour step: "Add to Your Rituals" → "...Routines" |
| `src/components/app/tour/HomeTour.tsx` | Tour step: "Suggested Rituals" → "Suggested Routines", description text |

## Admin Panel — 2 files

| File | What to change |
|------|---------------|
| `src/components/admin/RoutinesBank.tsx` | Title: "Rituals Bank" → "Routines Bank"; button: "New Ritual" → "New Routine"; label: "Ritual Type" → "Routine Type"; dialog description |
| `src/components/admin/LeadsManager.tsx` | Text: "ritual progress" → "routine progress" |

## Hooks — 1 file

| File | What to change |
|------|---------------|
| `src/hooks/useFeatureTour.tsx` | Tour feature type `'rituals'` — this is a code/localStorage key, will rename for consistency |

## Edge Functions — 2 files

| File | What to change |
|------|---------------|
| `supabase/functions/admin-assistant/index.ts` | ~50 occurrences: function names (`resolveRitualId` → `resolveRoutineId`, `createRitualInBank` → `createRoutineInBank`, etc.), tool names in switch cases, AI prompt text, user-facing messages |
| `supabase/functions/generate-routine-cover/index.ts` | Prompt text: "RITUAL:" → "ROUTINE:", comments, default title "Wellness Ritual" → "Wellness Routine" |

## Approach

- Rename all user-facing strings (toasts, labels, aria-labels, tour descriptions, paywall features)
- Rename internal variable/function names where they say "ritual" for code consistency
- Keep database column names and table names unchanged (no schema migration needed)
- Keep `home_rituals` as a display location enum value (internal identifier, label already says "After Routines")

## Not Changed (intentional)
- Database table/column names — these are structural, not user-facing
- The `PromoBanner` `DisplayLocation` type value `home_rituals` — internal enum, admin label already correct

