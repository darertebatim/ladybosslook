

# Profile Page Redesign and Settings Separation

## Overview
Split the current 1500-line monolithic profile page into two distinct pages:
1. **Profile Page** (`/app/profile`) -- A social-network-style profile with photo upload, bio, personal details
2. **Settings Page** (`/app/settings`) -- All settings, notifications, password, calendar, downloads, account actions

## Database Changes

Add new columns to `profiles` table:
- `country` already exists
- `date_of_birth` already exists
- `bio` already exists
- `avatar_url` already exists
- `occupation` already exists
- `relationship_status` already exists
- `preferred_language` already exists
- `goals` already exists
- `social_instagram` already exists
- `social_telegram` already exists
- `gender` already exists

All needed columns already exist. No migration needed.

**Storage**: Create an `avatars` bucket (public) for profile photo uploads, with RLS policies allowing users to upload/update their own avatar.

## New Profile Page (`/app/profile`)

Social-network style layout:

- **Hero section**: Large avatar (tappable to upload photo via camera/gallery), name, bio underneath
- **Stats row**: Programs, This Month, Credits (keep existing)
- **"Edit Profile" button** prominent at top
- **Profile info cards** (always visible, not collapsed):
  - Full name, email, phone
  - Date of birth (date picker)
  - Gender/Pronouns
  - City, country
  - Occupation, relationship status
  - Preferred language
  - Goals (tag-style multi-select)
  - Bio (textarea)
  - Instagram handle, Telegram handle
- **Settings button**: Large prominent button linking to `/app/settings`
- **My Programs section** (keep existing)
- **Wallet and Orders** (keep existing)

Edit mode: Tapping "Edit Profile" reveals inline editors for all fields; Save/Cancel buttons appear.

### Avatar Upload Flow
- Tap avatar to pick image (Capacitor Camera plugin for native, file input for web)
- Upload to `avatars` bucket at path `{user_id}/avatar.{ext}`
- Save public URL to `profiles.avatar_url`
- Show image in Avatar component with fallback to initials

## New Settings Page (`/app/settings`)

New file: `src/pages/app/AppSettings.tsx`

Move these sections from profile:
- Password change
- Push Notifications (native only)
- Notification Preferences
- Calendar Sync (native only)
- Downloaded Audio (native only)
- Support / Contact
- Admin Tools
- Account Actions (sign out, restart tours, delete account)
- Rate Simora (native only)

Layout: Same collapsible accordion style as current profile. Header with back button and "Settings" title.

## Routing

Add new route in `App.tsx`:
```text
/app/settings -> AppSettings (full-screen, outside AppLayout like other tools)
```

## File Changes

1. **New: `supabase/migrations/..._create_avatars_bucket.sql`** -- Create avatars storage bucket + RLS policies
2. **New: `src/pages/app/AppSettings.tsx`** -- Settings page with all settings sections moved from profile
3. **Modified: `src/pages/app/AppProfile.tsx`** -- Complete rewrite as social-profile page with avatar upload, all profile fields, Settings button
4. **Modified: `src/App.tsx`** -- Add `/app/settings` route
5. **Modified: `src/components/app/HomeMenu.tsx`** -- Add Settings nav item

## Technical Details

- Avatar upload uses `@capacitor/camera` on native, `<input type="file">` on web
- Profile fields use `as any` type casting for columns not yet in generated types (same pattern as existing gender field)
- Date of birth uses the Shadcn date picker with popover
- Goals uses a tag/chip input allowing multiple selections
- Language selector: dropdown with common languages
- Relationship status: dropdown (Single, In a relationship, Married, Prefer not to say)
- All profile updates go through a single `handleSaveProfile` function that updates all fields at once

