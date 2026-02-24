

# Video Player System: Admin Dashboard + App Page

## Overview
Build a complete video management system mirroring the existing audio player architecture. This includes new database tables, an admin dashboard for managing video playlists/content, and an app-side video browsing page with the `AppVideoPlayer` component already built.

## Audio Features to Replicate for Video

Based on the existing audio system, here are all the features that will be carried over:

1. **Playlists/Albums** -- Create, edit, delete video playlists (collections)
2. **Program Linking** -- Connect video playlists to programs for access control
3. **Free / Premium toggle** -- Mark playlists as free or requiring enrollment
4. **Requires Subscription (Simora+)** -- Gate content behind subscription
5. **Available on Mobile toggle** -- Control iOS app visibility
6. **Language flags** -- US, IR, TR, ES, All multilanguage support
7. **Categories** -- Tutorial, Course, Podcast, Workshop, Motivation, etc.
8. **Cover images** -- Upload or AI-generate covers
9. **AI description improvement** -- Improve descriptions with AI
10. **Sort order** -- Control display order
11. **Hidden/Visible toggle** -- Hide playlists without deleting
12. **Track management** -- Add, reorder, remove videos within playlists
13. **Drip scheduling** -- Delay content availability by days
14. **Progress tracking** -- Track user video watch progress
15. **Video upload** -- Upload MP4 files to Supabase storage
16. **Display mode** -- Tracks only, Modules only, or Both

## Database Schema

### New Tables

**`video_content`** -- Individual video files (mirrors `audio_content`)
- `id` (uuid, PK)
- `title` (text, required)
- `description` (text)
- `file_url` (text, required) -- direct MP4 URL or YouTube/Vimeo link
- `thumbnail_url` (text) -- video thumbnail
- `duration_seconds` (integer, default 0)
- `file_size_mb` (numeric)
- `video_type` (text) -- 'direct', 'youtube', 'vimeo'
- `is_vertical` (boolean, default false)
- `is_free` (boolean, default true)
- `program_slug` (text)
- `sort_order` (integer, default 0)
- `published_at` (timestamptz)
- `created_at`, `updated_at` (timestamptz)

**`video_playlists`** -- Video collections (mirrors `audio_playlists`)
- `id` (uuid, PK)
- `name` (text, required)
- `description` (text)
- `cover_image_url` (text)
- `category` (text) -- 'tutorial', 'course', 'podcast', 'workshop', 'motivation', 'vlog'
- `program_slug` (text)
- `is_free` (boolean, default true)
- `requires_subscription` (boolean, default false)
- `available_on_mobile` (boolean, default true)
- `is_hidden` (boolean, default false)
- `language` (text, default 'american')
- `sort_order` (integer, default 0)
- `display_mode` (text, default 'tracks')
- `created_at` (timestamptz)

**`video_playlist_items`** -- Junction table (mirrors `audio_playlist_items`)
- `id` (uuid, PK)
- `playlist_id` (uuid, FK -> video_playlists)
- `video_id` (uuid, FK -> video_content)
- `sort_order` (integer, default 0)
- `drip_delay_days` (integer, default 0)
- `created_at` (timestamptz)

**`video_progress`** -- User watch progress (mirrors `audio_progress`)
- `id` (uuid, PK)
- `user_id` (uuid, FK -> auth.users, not a direct FK)
- `video_id` (uuid, FK -> video_content)
- `current_position_seconds` (integer, default 0)
- `completed` (boolean, default false)
- `last_watched_at` (timestamptz)
- `created_at`, `updated_at` (timestamptz)
- Unique constraint on (user_id, video_id)

### Storage
- New bucket: `video_files` (public) for direct MP4 uploads
- Reuse `playlist-covers` for video playlist covers

### RLS Policies
- video_content: read for all authenticated users
- video_playlists: read for all authenticated users
- video_playlist_items: read for all authenticated users
- video_progress: users can read/write their own records
- Admin full access via role check

## Admin Dashboard

### New Page: `/admin/video` 
Mirrors `/admin/audio` with:

**VideoPlaylistManager** component:
- Create/Edit/Delete video playlists
- All the same fields as audio playlists (name, description, category, program link, free/premium, subscription, mobile visibility, language, sort order, cover image)
- AI cover generation and description improvement (reuse existing edge functions)
- Toggle hidden/visible
- Manage Videos button (opens VideoTracksManager)
- Table view with cover, name, video count, status badges

**VideoManager** component:
- Upload video files (MP4) or paste YouTube/Vimeo URLs
- Assign to playlist on upload
- Edit title, description, playlist assignment
- Delete videos
- List view with duration, type badge, file size

**VideoTracksManager** dialog:
- Reorder videos within a playlist
- Set drip delay days per video
- Quick schedule templates

### Admin Nav Update
- Add "Video" item after "Audio" in the sidebar navigation

## App Page

### New Page: `/app/watch`
Mirrors `/app/player` (the Listen page) with:

- Header with "Watch" title and search
- Category circles (Tutorial, Course, Podcast, Workshop, Motivation, Vlog)
- Progress filter pills (All, In Progress, Completed)
- Language selector (same flags)
- Continue Watching section
- Video playlist grid (2 columns, same card style as audio)
- Tapping a playlist goes to `/app/watch/playlist/:playlistId`

### New Page: `/app/watch/playlist/:playlistId`
Video playlist detail page:
- List of videos with thumbnails
- Drip lock indicators
- Tapping a video opens AppVideoPlayer (already built)
- Progress tracking per video

### Bottom Navigation Update
- Add a "Watch" tab to the app's bottom navigation bar

## Files to Create
- `src/pages/admin/Video.tsx` -- Admin video page
- `src/components/admin/VideoManager.tsx` -- Video upload & management
- `src/components/admin/VideoPlaylistManager.tsx` -- Video playlist CRUD
- `src/components/admin/VideoTracksManager.tsx` -- Video ordering within playlists
- `src/pages/app/AppWatch.tsx` -- App video browsing page
- `src/pages/app/AppVideoPlaylistDetail.tsx` -- Video playlist detail
- `src/components/video/VideoPlaylistCard.tsx` -- Video playlist card component

## Files to Modify
- `src/App.tsx` -- Add admin and app routes
- `src/components/admin/AdminNav.tsx` -- Add Video nav item
- `src/components/app/BottomNav.tsx` (or equivalent) -- Add Watch tab
- Database migration for new tables, RLS policies, and storage bucket

## Implementation Order
1. Database migration (tables + RLS + storage bucket)
2. Admin: VideoPlaylistManager + VideoManager + VideoTracksManager
3. Admin page + route + nav item
4. App: VideoPlaylistCard + AppWatch + AppVideoPlaylistDetail
5. App routes + bottom nav integration

