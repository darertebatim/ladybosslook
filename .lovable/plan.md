
# Timer Goal Feature Implementation Plan

## Overview
This plan adds the timer-based goal functionality for tasks, matching the Me+ app experience. When a task has a "Timer" type goal, tapping the Play button opens a full-screen countdown timer with pause/stop/complete controls.

## Current State Analysis
- **Goal types exist**: Tasks support `goal_type: 'timer' | 'count'` in the database
- **Count goals work**: GoalInputSheet handles count-type goals with number input
- **Timer goals missing**: No Play button, no timer screen, no countdown functionality
- **Input validation missing**: Minutes accepts 100+, seconds accepts 60+

## Features to Implement

### 1. Input Validation with Toasts
**File: `src/components/app/GoalSettingsSheet.tsx`**
- Add validation in NumberKeypad onChange handlers:
  - Minutes: max 99 (show "0-99 only" toast badge like Me+)
  - Seconds: max 59 (show "0-59 only" toast badge)
- Show a pill-shaped badge inside keypad when limit is exceeded
- Prevent invalid values from being entered

### 2. TaskCard Updates - Play Button for Timer Goals
**File: `src/components/app/TaskCard.tsx`**
- Detect timer-type goals: `task.goal_type === 'timer'`
- Show Play icon (▶) button instead of Plus (+) for timer goals
- Display "Goal: 0/20 minutes" format for timer goals
- Handler: `onOpenTimer` instead of `onOpenGoalInput` for timer tasks

### 3. New Timer Screen Component
**File: `src/components/app/TaskTimerScreen.tsx` (NEW)**

Full-screen timer interface with:
- **Header**: Task emoji, title, goal progress (e.g., "Goal: 0/20 minutes")
- **Timer Display**: 
  - Large countdown (MM:SS format)
  - Dashed oval/ellipse border around timer
  - Border fills with white as progress accumulates
- **Controls** (bottom):
  - Pause button (⏸) - left side
  - "Mark as complete" button - center
  - Stop button (⏹) - right side

**Timer Logic**:
- Timer counts DOWN from remaining time (goal_target - progress)
- Pause: stops countdown, saves current elapsed
- Stop: saves elapsed seconds to goal_progress, returns to home
- Mark as complete: sets goal_progress = goal_target, marks done
- Timer hits 0: shows "Done" screen with "I did it!" button

**Progress Storage**:
- Goal progress stored in seconds in `task_completions.goal_progress`
- Progress persists between sessions (can resume later)

### 4. Timer State Management
**File: `src/hooks/useTaskPlanner.tsx`**
- `useAddTimerProgress` mutation: Add seconds to goal_progress
- Similar to `useAddGoalProgress` but for timer (adds seconds directly)

### 5. AppHome Integration
**File: `src/pages/app/AppHome.tsx`**
- Add `timerTask` state for full-screen timer
- Pass `onOpenTimer` handler to SortableTaskList
- Render TaskTimerScreen when timerTask is set

### 6. SortableTaskList Updates
**File: `src/components/app/SortableTaskList.tsx`**
- Add `onOpenTimer` prop for timer-goal tasks
- Distinguish between count goals and timer goals

### 7. TaskDetailModal Updates  
**File: `src/components/app/TaskDetailModal.tsx`**
- For timer goals: Show Play button instead of + button
- Trigger timer screen when Play is tapped

---

## Technical Details

### TaskTimerScreen Component Structure
```text
┌────────────────────────────────────────┐
│                                        │
│           🧘 (emoji, large)            │
│              Yoga                       │
│        Goal: 0/20 minutes              │
│                                        │
│    ╭╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╮           │
│   ╎                        ╎           │
│   ╎        19:53           ╎           │
│   ╎    (countdown timer)   ╎           │
│   ╎                        ╎           │
│    ╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯           │
│     (dashed oval, fills white)         │
│                                        │
│                                        │
│  ⏸      [Mark as complete]      ⏹     │
│                                        │
└────────────────────────────────────────┘
```

### Timer Progress Circle (SVG)
- Use SVG ellipse with dashed stroke
- Calculate stroke-dasharray based on progress percentage
- Animate fill as timer progresses

### NumberKeypad Validation Badge
```text
┌────────────────────────────────────────┐
│  ✕              Minutes                │
│           ┌──────────────┐             │
│           │  0-99 only   │             │
│           └──────────────┘             │
│               100                      │
│              (value)                   │
└────────────────────────────────────────┘
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/app/TaskTimerScreen.tsx` | CREATE | Full-screen countdown timer |
| `src/components/app/GoalSettingsSheet.tsx` | MODIFY | Add validation badges for min/sec limits |
| `src/components/app/NumberKeypad.tsx` | MODIFY | Add validation hint/badge prop |
| `src/components/app/TaskCard.tsx` | MODIFY | Play button for timer goals |
| `src/components/app/TaskDetailModal.tsx` | MODIFY | Play button for timer goals |
| `src/components/app/SortableTaskList.tsx` | MODIFY | Pass onOpenTimer handler |
| `src/pages/app/AppHome.tsx` | MODIFY | Timer screen state + rendering |
| `src/hooks/useTaskPlanner.tsx` | MODIFY | Timer progress mutation |

---

## Implementation Order

1. **NumberKeypad validation** - Add hint badge and input limits
2. **GoalSettingsSheet validation** - Enforce 0-99 min, 0-59 sec with visual feedback
3. **TaskCard updates** - Play button for timer goals
4. **TaskTimerScreen component** - Full timer UI with all controls
5. **AppHome integration** - State management and rendering
6. **Testing** - Verify timer flow, progress saving, resume functionality
