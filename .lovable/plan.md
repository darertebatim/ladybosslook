
# Community Channels Redesign - Telegram/WhatsApp Style

## Current Problem

1. **Twitter-like tab interface**: The horizontal tabs with "All" and hashtags are confusing for users who are familiar with Telegram/WhatsApp
2. **Mixed UX patterns**: Posts have replies (comments) which creates a hybrid between announcement channels and group chats
3. **No clear entry point**: Users land directly into a combined feed view, not a list of channels to choose from

## Proposed Solution

Transform the community feature into a **Telegram-style experience**:

```text
+-----------------------------+
|  Community                  |
+-----------------------------+
| [Channel Card]              |
|   Announcements (General)   |
|   Latest: Hey everyone...   |
|   2 unread                  |
+-----------------------------+
| [Channel Card]              |
|   Premium Members           |
|   Latest: New content...    |
|   5 unread                  |
+-----------------------------+
| [Channel Card]              |
|   Round 12 Group            |
|   Latest: Who's joining...  |
|   Chat enabled              |
+-----------------------------+
```

When a channel is selected, it opens a **full-screen chat view** like Telegram:

- **Broadcast channels** (allow_comments: false): Admin messages only, users can only react
- **Group channels** (allow_comments: true): Real-time chat experience where users can send messages

## Implementation Plan

### Phase 1: Create Channel List Page (New)

**New file: `src/pages/app/AppChannelsList.tsx`**

- Displays all channels the user has access to as a list of cards
- Each card shows:
  - Channel icon (based on type: megaphone for general, graduation cap for program, etc.)
  - Channel name
  - Last message preview (truncated)
  - Unread count badge
  - Timestamp of last message
  - "Chat" indicator if comments are enabled
- Tapping a channel navigates to the channel detail page
- Pull-to-refresh support
- Real-time updates for unread counts

### Phase 2: Refactor Channel Detail Page

**Modify: `src/pages/app/AppFeed.tsx`** (rename to `AppChannelDetail.tsx`)

Transform from a feed with tabs to a **single-channel chat view**:

- Remove the horizontal channel tabs completely
- Full-screen chat experience for the selected channel
- Header shows channel name and back button to channel list
- Messages displayed in Telegram-style bubbles (already done)
- **If allow_comments is true**: Show chat input at bottom for user messages
- **If allow_comments is false**: Only show reactions, no input bar (broadcast mode)

### Phase 3: Update Routing

**Modify: `src/App.tsx`**

```text
/app/channels         -> AppChannelsList (new channel list)
/app/channels/:slug   -> AppChannelDetail (single channel view)
/app/channels/post/:postId -> AppFeedPost (post detail/thread)
```

### Phase 4: Database Changes

**Add column to `feed_posts` table:**

- `user_id` (uuid, nullable) - Allow regular users to post messages in group channels

**New RLS policy:**

- Users can INSERT posts in channels where `allow_comments = true`
- Posts from users are automatically `post_type = 'discussion'`

### Phase 5: Update Admin Composer

**Modify: `src/components/admin/FeedChatComposer.tsx`**

- Add option to enable "Group Chat Mode" for channels
- When group chat is enabled, the channel becomes a two-way conversation

### Phase 6: Component Changes

**New file: `src/components/feed/ChannelCard.tsx`**

- Reusable card component for the channel list
- Shows channel info, last message, unread count

**Modify: `src/components/feed/FeedMessage.tsx`**

- Add support for user-authored messages (not just admin)
- Different bubble styling for user vs admin messages

**Modify: `src/hooks/useFeed.tsx`**

- Add `useChannelUnreadCounts()` hook for channel list badges
- Add `useLatestChannelMessages()` for preview text
- Add `useCreateUserPost()` mutation for group chat mode

**New file: `src/components/feed/ChannelChatInput.tsx`**

- Chat input component for group channels
- Similar to existing `FeedReplyInput` but for top-level posts

### Phase 7: Navigation Updates

**Modify: `src/layouts/NativeAppLayout.tsx`**

- Update tab bar to point to `/app/channels` (channel list)

**Modify: `src/components/app/HomeMenu.tsx`**

- Update menu item to point to channel list

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/app/AppChannelsList.tsx` | Create |
| `src/pages/app/AppChannelDetail.tsx` | Create (from refactored AppFeed) |
| `src/pages/app/AppFeed.tsx` | Delete or redirect |
| `src/components/feed/ChannelCard.tsx` | Create |
| `src/components/feed/ChannelChatInput.tsx` | Create |
| `src/components/feed/FeedChannelTabs.tsx` | Delete (no longer needed) |
| `src/hooks/useFeed.tsx` | Modify (add new hooks) |
| `src/App.tsx` | Modify (update routes) |
| Database migration | Add user_id column, RLS policies |

## UX Flow

```text
1. User taps "Channels" tab
   |
   v
2. AppChannelsList - Shows all accessible channels
   - Announcements (General)     [3 unread]
   - Premium Content             [1 unread]  
   - Round 12 Group              [Chat]
   |
   v
3. User taps "Round 12 Group"
   |
   v
4. AppChannelDetail - Full chat experience
   - Header: "Round 12 Group" + back button
   - Messages in chronological order
   - Chat input at bottom (group mode)
   - OR just reactions (broadcast mode)
```

## Benefits

1. **Familiar UX**: Users understand channel lists from Telegram/WhatsApp
2. **Clear separation**: Each channel is its own space
3. **Flexible modes**: Broadcast channels vs Group chat channels
4. **Better engagement**: Group channels encourage real-time discussion
5. **Cleaner navigation**: No confusing tabs or hashtags

## Technical Notes

- Real-time subscriptions already exist (`useFeedRealtime`)
- Chat UI patterns already implemented in `AppChat.tsx`
- Message grouping by date/author already works
- Can reuse existing components for the chat experience
