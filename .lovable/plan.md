

# AI Coach Fixes: User Control, Accuracy & Response Quality

## Problems Identified

1. **Inaccurate context in responses**: AI says "3 tasks remaining" but then schedules 5 items. It claims "I have added these to your planner" when it only added 1 task (or none). The AI hallucinates actions it didn't actually take.

2. **AI auto-executes actions without asking**: When the user says "suggest time-blocking strategies," the AI directly calls `add_task_to_planner` and creates tasks in the database. The user never approved it. The system prompt explicitly tells the AI to be "proactive" and to "add tasks as soon as the user agrees" — but the user never agreed.

3. **AI crams too many suggestions into one message**: A single response contains a task suggestion + routine adoption offer + follow-up questions + time-blocking plan. It's overwhelming. The follow-up generation also adds 2-3 more chips on top.

---

## Plan

### Step 1: Change System Prompt — Never Auto-Execute, Always Propose

**File**: `supabase/functions/ai-coach/index.ts` (system prompt section, lines ~312-442)

**What changes**:
- Remove all "proactively use" and "immediately use" language from every mode's instructions
- Add a new **golden rule** at the top of the system prompt:

```
## Golden Rule: NEVER Auto-Execute
- NEVER call add_task_to_planner, adopt_routine, log_mood, or create_journal_prompt without explicit user confirmation.
- Instead, PROPOSE the action in your message text (e.g., "Would you like me to add 'Morning stretch' to your planner?")
- Only call the tool AFTER the user says yes, confirms, or explicitly asks you to do it.
- The ONLY tools you can call without asking are get_routine_suggestions and get_task_suggestions (read-only lookups).
```

- Update Coach mode instructions: Remove "use add_task_to_planner frequently" → "Suggest tasks and routines, but always ask before adding"
- Update Assistant mode instructions: Remove "Immediately use add_task_to_planner" → "Propose a plan, then execute only after user confirms"
- Update Companion mode instructions: Remove "Use log_mood proactively when you detect emotions" → "Ask if the user wants to log their mood"

### Step 2: Change System Prompt — One Topic Per Message

**File**: `supabase/functions/ai-coach/index.ts` (system prompt, Important Rules section ~line 428)

Add a new rule:

```
## Response Focus
- Address ONE topic or suggestion per message. Do not pile multiple suggestions together.
- If you have multiple ideas, present the most relevant one first. Let follow-up chips handle the rest.
- Keep responses to 2-4 sentences maximum unless the user explicitly asks for detail.
- Never combine a task suggestion + routine suggestion + breathing suggestion in one response.
```

### Step 3: Fix Task Count Accuracy

**File**: `supabase/functions/ai-coach/index.ts` (system prompt, User Context section ~line 409)

The AI currently gets `todayTasks.length` total and `completedCount` completed, but it fabricates "remaining" counts. Add explicit remaining count:

```
- Today's tasks: ${todayTasks.length} total, ${completedCount} completed, ${todayTasks.length - completedCount} remaining
- Task list: ${todayTasks.map(t => `${t.emoji} ${t.title} [${completedIds.has(t.id) ? 'DONE' : 'PENDING'}]`).join(', ')}
```

Also add a rule:
```
- When discussing task counts, ONLY reference the actual numbers from User Context above. Never invent or estimate task counts.
- When you say "I added X to your planner," it must correspond to actual tool calls you made. Do not claim actions you didn't take.
```

### Step 4: Convert Action Cards to Confirmation Buttons

**File**: `src/components/app/ai/AICoachActionCard.tsx`

Currently, action cards show results of already-executed actions. After Step 1, the AI will propose actions in text instead. But we still need the cards for when the user confirms and the AI executes.

No major change needed to this component — it will continue to render confirmed action results. The key change is that these cards will appear less often (only after user confirmation).

### Step 5: Reduce Follow-Up Overload

**File**: `supabase/functions/ai-coach/index.ts` (follow-up generation, ~line 827)

Change the follow-up prompt from "2-3" to "1-2" suggestions, and add instruction:
```
Return ONLY a JSON array of 1-2 short follow-up actions. Each should be 3-6 words.
Do NOT repeat anything already discussed in the conversation. Make them feel like natural next steps.
```

### Step 6: Redeploy Edge Function

Deploy the updated `ai-coach` edge function.

---

## Summary of Behavior Changes

| Before | After |
|--------|-------|
| AI auto-adds tasks to planner | AI proposes, user confirms, then AI adds |
| AI logs mood without asking | AI asks "want me to log this?", user says yes |
| AI adopts routines proactively | AI suggests routine, user approves |
| 3+ suggestions crammed in one message | 1 focused suggestion per message |
| "You have 3 tasks" then schedules 5 | Accurate counts from real data, explicit task list |
| Claims "I added these" without doing it | Only claims actions it actually executed |
| 2-3 follow-up chips | 1-2 focused follow-ups |

