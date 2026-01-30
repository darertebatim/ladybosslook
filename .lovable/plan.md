
# AI Admin Assistant - Enhanced Plan

## Your Questions Answered

### 1. Access from Any Admin Page
**Yes!** The AI Assistant will be a **floating chat button** visible on every admin page. It will be added to the `AdminLayout` component, so no matter which page you're on (Communications, Routines, Support, etc.), you can open the assistant.

### 2. Can It Write Into Forms?
**Yes!** The assistant will understand which page you're on and can **auto-fill form fields** for you. When you ask it to "write a broadcast about tomorrow's session", it can:
- Detect you're on the Communications page
- Generate the content
- Offer a button to fill the form automatically

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                        Admin Layout                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Admin Nav                              │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Page Content                          │    │
│  │              (Outlet - current page)                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│                                          ┌──────────────────┐   │
│                                          │  AI Chat Panel   │   │
│                                          │  (Floating)      │   │
│                                          └──────────────────┘   │
│                                                  ▲               │
│                                          ┌──────┴──────┐        │
│                                          │  FAB Button  │        │
│                                          └─────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

---

## How Form Integration Works

The assistant uses a **callback pattern** to communicate with page forms:

1. **Context Provider**: A new `AIAssistantContext` wraps the admin layout
2. **Page Registration**: Each page can register form-filling handlers
3. **AI Response**: When AI generates content, it includes structured data
4. **Apply Button**: User clicks "Apply to Form" to auto-fill fields

### Example Flow

```text
User: "Write a session reminder for Ladyboss VIP tomorrow at 8pm"

AI: 
┌────────────────────────────────────────────────┐
│ Here's a session reminder:                      │
│                                                 │
│ Title: Tomorrow's VIP Session at 8pm!          │
│                                                 │
│ Message:                                        │
│ Hey Ladyboss! Don't forget we have our         │
│ exclusive VIP session tomorrow at 8pm PT.      │
│                                                 │
│ Prepare your questions and let's make it       │
│ amazing!                                        │
│                                                 │
│ فردا ساعت ۸ شب منتظرتون هستم! 💜               │
│                                                 │
│ [Apply to Broadcast Form]  [Copy]              │
└────────────────────────────────────────────────┘
```

When you click "Apply to Broadcast Form", the title and message fields on the current Broadcast form are auto-filled.

---

## Capabilities by Page

| Admin Page | What AI Can Help With |
|------------|----------------------|
| **Communications** | Draft broadcasts, push notifications, promo banner copy |
| **Community** | Write feed posts, discussion starters |
| **Routines** | Suggest routine tasks, generate plans |
| **Programs** | Draft session descriptions, course content |
| **Support** | Suggest replies to common questions |
| **Any Page** | Answer questions, explain features, analyze data |

---

## Technical Implementation

### New Files

| File | Purpose |
|------|---------|
| `supabase/functions/admin-assistant/index.ts` | Edge function with streaming AI + database context |
| `src/contexts/AIAssistantContext.tsx` | Global state for AI panel + form callbacks |
| `src/components/admin/AIAssistantPanel.tsx` | Floating chat panel with markdown support |
| `src/components/admin/AIAssistantButton.tsx` | Floating action button to open panel |

### Modified Files

| File | Changes |
|------|---------|
| `src/layouts/AdminLayout.tsx` | Add AIAssistantContext provider and floating components |
| `src/components/admin/AnnouncementCreator.tsx` | Register form-fill callback with AI context |
| `src/components/admin/FeedPostCreator.tsx` | Register form-fill callback with AI context |
| `src/pages/admin/Routines.tsx` | Register routine creation callback |

### Edge Function Details

The backend will:
1. Verify admin role
2. Fetch relevant context based on current page:
   - Active program rounds
   - Feed channels
   - Routine categories
   - User stats (counts, recent activity)
3. Build a system prompt with this context
4. Stream response from Lovable AI Gateway (google/gemini-3-flash-preview)
5. Support tool calling for structured outputs (form data, routine tasks)

### Tool Calling Schema

When the AI generates form-fillable content, it returns structured data:

```json
{
  "type": "broadcast_form",
  "data": {
    "title": "Tomorrow's VIP Session!",
    "message": "Hey Ladyboss! Don't forget...",
    "targetCourse": "ladyboss-vip-club"
  }
}
```

The frontend parses this and shows an "Apply to Form" button.

---

## UI Design

### Floating Button
- Fixed position bottom-right corner
- Purple gradient matching app theme
- Sparkles icon
- Subtle pulse animation when first loaded

### Chat Panel
- Slides in from right side
- 400px width on desktop
- Dark/light mode aware
- Message history with markdown rendering
- Quick action chips for common tasks:
  - "Draft announcement"
  - "Create routine"
  - "Write push notification"

### Message Bubbles
- User messages: Right-aligned, primary color
- AI messages: Left-aligned, muted background
- AI structured outputs: Card with "Apply" button

---

## Cost & Performance

- Uses `google/gemini-3-flash-preview` (fast & economical)
- Only fetches context relevant to current page
- Conversation history stored in browser session (not persisted)
- Streaming responses for immediate feedback
- Included free monthly Lovable AI usage

---

## Security

- Admin role verified via `has_role` function in edge function
- Read-only database queries for context
- Form changes require explicit user action (Apply button)
- No direct database writes from AI - all through existing forms with validation
