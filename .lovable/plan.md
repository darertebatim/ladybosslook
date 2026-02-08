
# Admin Channels Overhaul Plan

This plan redesigns the admin community page into a full-featured channel management system with chat-style message viewing and enhanced admin controls.

## Overview

We're making three key changes:
1. Rename route from `/admin/community` to `/admin/channels`
2. Add emoji/picture cover selection for channels
3. Replace the "History" tab with a chat-style view matching the app, with admin controls (delete all messages, pin, edit)

---

## Changes Summary

### 1. Route Change: `/admin/community` to `/admin/channels`

**Files to modify:**
- `src/App.tsx` - Update route path
- `src/components/admin/AdminNav.tsx` - Update nav menu URL and title
- `src/pages/admin/Community.tsx` - Rename file to `Channels.tsx` and update header text

### 2. Channel Cover (Emoji or Image)

**Database:** The `feed_channels` table already has a `cover_image_url` column.

**UI Changes in `FeedChannelManager.tsx`:**
- Add emoji picker button using existing `EmojiPicker` component
- Add image upload option using existing `ImageUploader` component  
- Store emoji as a special value (e.g., `emoji:☀️`) or image URL
- Display cover in channel cards with 3D Fluent Emoji rendering

**Form fields:**
```
Cover Type: [Emoji] [Image] [None]
├─ Emoji selected → Show emoji picker button
└─ Image selected → Show ImageUploader component
```

### 3. Chat-Style Channel View (Replacing "History" Tab)

**New component:** `AdminChannelChat.tsx`

This replaces the current `FeedPostsList` card-based view with a chat interface similar to `AppChannelDetail.tsx`, but with admin controls.

**Features:**
- Channel selector dropdown at top
- Chat messages displayed like the app (using `FeedMessage` component styling)
- Date separators between message groups
- Scroll to bottom behavior

**Admin controls on every message:**
- **Delete** - Remove any message (not just user's own)
- **Pin/Unpin** - Toggle pinned status
- **Edit** - Open edit dialog for admin/announcement posts

**UI Layout:**
```
┌─────────────────────────────────────┐
│ [Channel Dropdown ▼]                │
├─────────────────────────────────────┤
│        ── Today ──                  │
│                                     │
│ [Avatar] Simora              12:30  │
│ ┌─────────────────────────┐         │
│ │ Welcome to the channel! │ [⋮]    │
│ └─────────────────────────┘         │
│                                     │
│ [Avatar] Ali Lotfi           14:22  │
│ ┌─────────────────────────┐         │
│ │ Thanks for the update!  │ [⋮]    │
│ └─────────────────────────┘         │
│                                     │
└─────────────────────────────────────┘
```

**Message actions menu (⋮):**
- Pin / Unpin
- Edit (for admin posts only)
- Delete

---

## Tab Structure (Updated)

```
Channels Admin Page
├── Tab: "New Message" (compose) 
├── Tab: "Messages" (new chat view - replaces "History")
├── Tab: "Journals" (unchanged)
└── Tab: "Settings" (rename from "Channels" - channel management)
```

---

## Technical Details

### File Changes

| File | Action |
|------|--------|
| `src/App.tsx` | Change route `community` → `channels` |
| `src/components/admin/AdminNav.tsx` | Update URL and label to "Channels" |
| `src/pages/admin/Community.tsx` | Rename to `Channels.tsx`, update title |
| `src/components/admin/FeedChannelManager.tsx` | Add emoji/image cover selector |
| `src/components/admin/FeedPostsList.tsx` | Refactor into chat-style `AdminChannelChat.tsx` |
| New: `src/components/admin/AdminChannelChat.tsx` | Chat-style message list with admin controls |

### Cover Storage Format

The `cover_image_url` column will store:
- Image URL: `https://...` (standard URL)
- Emoji: `emoji:☀️` (prefixed to distinguish from URLs)

Helper functions to detect type:
```typescript
const isEmojiCover = (url: string) => url?.startsWith('emoji:');
const getEmojiFromCover = (url: string) => url?.replace('emoji:', '');
```

### Admin Message Controls

Each message will have a dropdown menu with:
```typescript
const adminActions = [
  { label: post.is_pinned ? 'Unpin' : 'Pin', action: togglePin },
  { label: 'Edit', action: openEditDialog, show: !isUserPost },
  { label: 'Delete', action: confirmDelete, destructive: true },
];
```

### Reusing App Components

We'll adapt patterns from:
- `AppChannelDetail.tsx` - Message grouping by date, scroll behavior
- `FeedMessage.tsx` - Message bubble styling (will wrap with admin controls)
- `EmojiPicker.tsx` - For channel emoji selection
- `ImageUploader.tsx` - For channel cover image upload
- `FluentEmoji.tsx` - For rendering 3D emoji covers
