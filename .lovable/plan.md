

# Chat with Coach -- Multi-Inbox System

## Overview
Add a "Coach" chat inbox alongside the existing "Support" inbox. Users see it as a second private chat in their Channels list. Admins/coaches see it as a separate tab/inbox in the admin Support page.

## Database Changes

### 1. Add `inbox_type` column to `chat_conversations`
- Add a new column `inbox_type TEXT NOT NULL DEFAULT 'support'` with a check constraint allowing `'support'` and `'coach'`.
- Existing conversations default to `'support'`.
- The `update_conversation_on_message` trigger works unchanged since it references `conversation_id`.

### 2. Update `chat_messages` trigger
- No changes needed -- it already references conversations by ID.

## User-Facing Changes (Channels List)

### 3. Add "Coach" entry in `AppChannelsList.tsx`
- Duplicate the Support chat entry below it, but with a different icon (e.g., `GraduationCap`), label "Coach", and route to `/app/coach-chat`.
- Create a new hook `useUnreadCoachChat` (or extend `useUnreadChat` with an `inbox_type` parameter) to show unread badge.
- Create `useSupportChatSummary`-like hook for coach chat summary preview.

### 4. Create `AppCoachChat.tsx` page
- Copy `AppChat.tsx` and adjust:
  - Filter conversations by `inbox_type = 'coach'` instead of default.
  - Change branding: title "Coach" instead of "Support", icon `GraduationCap`, different welcome message/starters (e.g., "Ask about your progress", "Get personalized advice").
  - Create conversation with `inbox_type: 'coach'`.
- Register route `/app/coach-chat` in the router.

## Admin-Facing Changes

### 5. Update Admin Support page (`Support.tsx`)
- Add tab selector at the top: "Support" | "Coach" tabs.
- Filter `chat_conversations` by selected `inbox_type`.
- Both tabs share the same `ChatPanel` component.

### 6. Update Mobile Admin Support (`AppAdminSupport.tsx`)
- Same tab selector approach for mobile admin view.

### 7. Notification Edge Function
- The existing `send-chat-notification` function likely works as-is since it references conversation IDs. May want to include inbox type in the notification body for display purposes (e.g., "New coach message" vs "New support message").

## Hook Updates

### 8. Extend `useUnreadChat`
- Accept an optional `inboxType` parameter (default `'support'`).
- Filter query by `inbox_type`.
- Use separate realtime channel names per inbox type to avoid conflicts.

### 9. Extend `useSupportChatSummary`
- Either parameterize it or create `useCoachChatSummary` that filters by `inbox_type = 'coach'`.

## Navigation & Tab Bar
- The bottom tab "Support" (Headset icon) continues to go to `/app/chat` (support).
- Coach chat is accessible from the Channels list only (not a separate tab bar item), keeping navigation clean.

## Technical Details

### New files:
- `src/pages/app/AppCoachChat.tsx` -- cloned from AppChat with coach-specific branding and `inbox_type` filter

### Modified files:
- **Migration SQL**: Add `inbox_type` column to `chat_conversations`
- `src/pages/app/AppChannelsList.tsx` -- add Coach entry
- `src/pages/admin/Support.tsx` -- add inbox type tabs
- `src/pages/app/AppAdminSupport.tsx` -- add inbox type tabs
- `src/hooks/useUnreadChat.tsx` -- parameterize by inbox type
- `src/hooks/useSupportChatSummary.tsx` -- parameterize or duplicate for coach
- `src/App.tsx` (or router file) -- add `/app/coach-chat` route
- `src/integrations/supabase/types.ts` -- auto-updated after migration

### RLS
- Existing RLS policies on `chat_conversations` and `chat_messages` should work unchanged since they filter by `user_id` and conversation ownership. No new policies needed.

