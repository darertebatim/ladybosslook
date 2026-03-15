

# AI Coach — Build Plan for `/app/ai`

## What We're Building

A single, context-aware AI chat page at `/app/ai` that serves three roles — **Routine Coach**, **Planning Assistant**, and **Emotional Companion** — all in one conversation thread. It uses the Lovable AI Gateway (Gemini Flash) via a new edge function, with tool-calling to take real actions in the app.

---

## Architecture

```text
┌──────────────────────────────────────────┐
│  /app/ai  (React page)                   │
│  ┌────────────────────────────────────┐  │
│  │ Chat UI (streaming, markdown)      │  │
│  │ - Voice input (Web Speech API)     │  │
│  │ - Quick-start chips by mode        │  │
│  │ - Action result cards              │  │
│  └──────────┬─────────────────────────┘  │
│             │ fetch (SSE stream)          │
└─────────────┼────────────────────────────┘
              ▼
┌──────────────────────────────────────────┐
│  Edge Function: ai-coach                 │
│  - Auth check (any logged-in user)       │
│  - Fetches user context (profile,        │
│    recent tasks, completions, moods,     │
│    journal entries, adopted routines)    │
│  - System prompt with 3 personas         │
│  - Tool-calling for direct actions       │
│  - Streams response back                 │
└──────────────────────────────────────────┘
```

---

## 1. Edge Function: `ai-coach`

**File:** `supabase/functions/ai-coach/index.ts`

Similar pattern to existing `admin-assistant` but for regular users (no admin check).

**System prompt** instructs the AI to adapt between three modes based on conversation context:
- **Routine Coach** — suggest routines from `routines_bank`, help build habits, troubleshoot adherence
- **Planning Assistant** — help organize the day, create tasks, suggest time blocking
- **Emotional Companion** — supportive listening, mood check-ins, breathing recommendations, journaling prompts

**User context fetched per request:**
- Profile (name, goals from onboarding)
- Today's tasks + completions (from `user_tasks` / `task_completions`)
- Recent emotion logs (last 7 days)
- Recent journal entries (last 5)
- Adopted routines (from `user_adopted_routines`)
- Streak data

**Tool definitions (direct-execution):**

| Tool | What it does |
|------|-------------|
| `add_task_to_planner` | Creates a task in user's planner for a specific date |
| `adopt_routine` | Adopts a routine from `routines_bank` for the user |
| `log_mood` | Logs an emotion entry to `emotion_logs` |
| `suggest_breathing` | Returns a breathing exercise from DB, rendered as a deeplink card |
| `create_journal_prompt` | Pre-fills a journal entry the user can open |
| `get_routine_suggestions` | Queries `routines_bank` by category and returns options |
| `get_task_suggestions` | Queries `admin_task_bank` for relevant tasks |

**Config:** `verify_jwt = false` (validates token in code like admin-assistant)

---

## 2. Database

**New table: `ai_coach_conversations`**
- `id` (uuid, PK)
- `user_id` (uuid, references profiles)
- `messages` (jsonb — array of `{role, content, timestamp}`)
- `created_at`, `updated_at`
- RLS: users can only read/write their own rows

This persists conversation history server-side so it survives app reinstalls. One row per user (upsert pattern).

---

## 3. Frontend Page: `/app/ai`

**File:** `src/pages/app/AppAICoach.tsx`

- Full-screen chat layout (no bottom tab bar, like Journal/Breathe)
- Top bar: back arrow, "AI Coach" title, clear-history button
- Quick-start chips when empty: "Plan my day", "I need a reset", "How am I doing?", "Suggest a routine"
- Streaming message rendering with `react-markdown`
- Action result cards (adopted routine, created task) with deeplinks
- Voice input button using Web Speech API (`SpeechRecognition`)
- Messages stored locally + synced to `ai_coach_conversations`
- Handles 429/402 errors with user-friendly toasts

**Shared streaming logic:** Extracted from existing `AIAssistantPanel.tsx` into a reusable `useAIStream` hook.

---

## 4. Route Registration

Add to `App.tsx` as a full-screen route (outside AppLayout):
```
<Route path="/app/ai" element={<ProtectedRoute><AppAICoach /></ProtectedRoute>} />
```

---

## 5. Voice Input (Web Speech API)

A mic button in the input bar. On press:
- Start `webkitSpeechRecognition` / `SpeechRecognition`
- On result, populate the text input
- User confirms send (not auto-send)
- No TTS on responses for now (can add later)

---

## Build Order

1. Create `ai_coach_conversations` table with RLS
2. Create `ai-coach` edge function with system prompt, context fetching, and tool definitions
3. Build `AppAICoach.tsx` page with streaming chat UI
4. Add route to `App.tsx`
5. Add voice input button
6. Add tool execution handlers in edge function

---

## What's NOT in this phase
- TTS (text-to-speech) for responses — future addition
- Embedding AI Coach into other pages (Planner, Routines, etc.) — planned for later
- AI Coach inbox in the Chats system — separate future step

