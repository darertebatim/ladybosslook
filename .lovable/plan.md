

## AI Coach: Mode Separation + Conversation Reset on Switch

### Problem
1. Switching between Coach/Assistant/Companion doesn't reset the conversation — old messages stay, making it feel like the same AI
2. All three modes behave identically — same tone, same tool usage, same follow-ups
3. No visual indication that a mode switch happened

### Changes

#### 1. Mode Switch = End Conversation Section (Frontend)

**`src/pages/app/AppAICoach.tsx`** and **`src/hooks/useAICoachStream.ts`**

When the user switches modes:
- Insert a visual **divider message** (a separator line with the mode name, e.g. "— Switched to Companion —") into the messages array
- Show the **empty state greeting + quick chips** for the new mode below the divider (inline, not replacing the whole view)
- Only send messages **after the divider** as conversation history to the AI — previous mode's messages are "sealed"
- Clear follow-up chips on switch

New message type added to `CoachMessage`: `role: 'divider'` with a `mode` field. The hook tracks `activeMode` and filters messages sent to the backend.

#### 2. Make Each Mode Genuinely Different (Backend)

**`supabase/functions/ai-coach/index.ts`** — Rewrite `buildSystemPrompt` mode sections:

**Coach Mode:**
- Personality: Direct, motivating, structured. Like a personal trainer for life habits
- Proactive tool usage: Always suggests routines and tasks. Uses `get_routine_suggestions` and `add_task_to_planner` frequently
- Tone: "Let's do this!" energy. Uses accountability language
- Restricted from: lengthy emotional exploration (redirects to Companion)
- Follow-ups biased toward action: "Want me to add that?", "Ready for your routine?"

**Assistant Mode:**
- Personality: Efficient, organized, no-nonsense. Like a smart secretary
- Proactive tool usage: Immediately uses `get_task_suggestions`, `add_task_to_planner`. Opens with today's task summary
- Tone: Brief, bullet-pointed, structured. Minimal small talk
- Focus: Planning, scheduling, prioritizing, reviewing progress
- Restricted from: emotional coaching (redirects to Companion)
- Follow-ups biased toward planning: "What else for today?", "Prioritize your list?"

**Companion Mode:**
- Personality: Warm, empathetic, gentle. Like a caring close friend
- Proactive tool usage: `log_mood` when emotions are detected, `suggest_breathing` for stress, `create_journal_prompt` for reflection
- Tone: Soft, validating, uses more emojis. Asks "how does that make you feel?"
- Restricted from: task management (redirects to Assistant). Does NOT add tasks or adopt routines
- Available tools limited to: `log_mood`, `suggest_breathing`, `create_journal_prompt` only
- Follow-ups biased toward feelings: "Want to talk more?", "How about journaling?"

#### 3. Tool Availability Per Mode (Backend)

**`supabase/functions/ai-coach/index.ts`**

Filter the `tools` array based on mode before sending to the AI:
- **Coach**: All tools
- **Assistant**: `add_task_to_planner`, `get_task_suggestions`, `get_routine_suggestions`, `adopt_routine`
- **Companion**: `log_mood`, `suggest_breathing`, `create_journal_prompt`

This physically prevents the wrong mode from using wrong tools.

#### 4. Divider UI Component

**New: `src/components/app/ai/AICoachDivider.tsx`**

A styled horizontal line with the mode name and icon centered, using the mode's accent color. Renders between conversation sections.

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/useAICoachStream.ts` | Add `divider` message type, track active mode, filter history on send |
| `src/pages/app/AppAICoach.tsx` | Handle mode switch: insert divider, show inline empty state for new mode |
| `src/components/app/ai/AICoachDivider.tsx` | New divider component |
| `src/components/app/ai/AICoachEmptyState.tsx` | Support inline variant (smaller, no avatar) |
| `supabase/functions/ai-coach/index.ts` | Rewrite mode personas, filter tools per mode |

