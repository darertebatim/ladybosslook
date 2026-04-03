

## AI Coach Overhaul Plan

The current AI Coach has a solid backend (tool-calling, context-fetching, streaming) but the frontend is basic and the tools don't surface results well. Here's the plan to make it great.

### What's Actually Working (Backend)
- Edge function has 7 tools: add_task, log_mood, adopt_routine, suggest_breathing, journal_prompt, get_routines, get_tasks
- Multi-turn tool chaining (up to 3 rounds)
- User context fetching (profile, tasks, emotions, streaks, routines)
- Conversation memory from previous sessions
- Mode-specific system prompts (coach/assistant/companion)

### What's Broken or Weak

1. **Tool results are invisible** — action results render as tiny cards with no interactivity (can't tap to open breathing, can't navigate to planner)
2. **Modes are cosmetic** — switching modes only changes quick chips and system prompt phrasing, no real behavioral difference in UI
3. **UI is a plain chatbox** — no visual identity, no animations, no personality
4. **No deep links from results** — when AI suggests breathing or a routine, there's no button to actually go do it

---

### Phase 1: Redesign the UI (Visual Identity)

**File: `src/pages/app/AppAICoach.tsx`** — Full rewrite

- **Animated header** with gradient background (purple-to-pink mesh), pulsing AI orb instead of plain Sparkles icon
- **Mode selector** redesigned as pill tabs with colored accents per mode (Coach = purple, Assistant = blue, Companion = pink)
- **Empty state** with large animated AI avatar, greeting that uses the user's name (fetched from profile), and floating quick-action cards instead of flat chips
- **Message bubbles** with glassmorphism for AI responses, subtle fade-in animation
- **Typing indicator** with animated gradient dots instead of plain bouncing circles
- **Input area** with frosted glass effect, expandable textarea instead of single-line input

### Phase 2: Interactive Action Cards

**File: `src/pages/app/AppAICoach.tsx`** — New `ActionResultCard` component

Replace the current tiny action cards with rich, tappable cards:

- **Task added** → Card with task emoji, title, date, and "Open Planner" button (navigates to `/app/planner`)
- **Routine adopted** → Card with routine info and "Start Routine" button (navigates to `/app/myroutines`)
- **Breathing suggested** → Card with exercise name and "Start Breathing" deep link (`/app/breathe?exercise={id}`)
- **Mood logged** → Card with emotion emoji and valence badge
- **Routine/Task suggestions** → Carousel of selectable cards the user can tap to adopt/add directly from chat

### Phase 3: Make Modes Real

Each mode gets distinct UI behavior, not just prompt differences:

- **Coach mode** (purple accent): Shows a "Daily Progress" mini-widget at top (streak, tasks done today). Quick actions surface routine suggestions proactively.
- **Assistant mode** (blue accent): Shows today's task summary as a collapsible card above chat. Quick actions focus on planning.
- **Companion mode** (pink accent): Warmer color palette, larger text, breathing shortcut always visible in input area.

### Phase 4: Smart Suggestion Chips (Context-Aware)

**File: `src/pages/app/AppAICoach.tsx`** + **`supabase/functions/ai-coach/index.ts`**

- After each AI response, show 2-3 contextual follow-up chips based on what was discussed (not static chips)
- Backend: Add a `suggested_followups` field to the streaming response — the AI generates these naturally
- Frontend: Render as floating pills below the last message

### Phase 5: Conversation Persistence Fix

**File: `src/hooks/useAICoachStream.ts`**

- Currently saves only to `ai_coach_conversations` as a single blob — loses action results on reload
- Store action results alongside messages so they render correctly on history load

---

### Technical Summary

| Area | Files Changed |
|------|--------------|
| UI Redesign | `src/pages/app/AppAICoach.tsx` (rewrite) |
| Action Cards | `src/pages/app/AppAICoach.tsx` (new components) |
| Mode Widgets | `src/pages/app/AppAICoach.tsx` + new `src/components/app/ai/` folder |
| Follow-up Chips | `supabase/functions/ai-coach/index.ts` + frontend |
| History Fix | `src/hooks/useAICoachStream.ts` |

### Execution Order
1. UI redesign (header, bubbles, input, empty state)
2. Interactive action cards with navigation
3. Mode-specific UI widgets
4. Context-aware follow-up suggestions
5. History persistence improvements

