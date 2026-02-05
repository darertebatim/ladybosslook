
# App Version Tracking & Targeted Update Notifications

## Problem Summary
Currently, no user versions are being tracked because:
1. The `useAppInstallTracking` hook is created but **never used** in the app
2. Push notifications cannot filter by app version
3. The in-app update banner only works for users already on v1.1.07+

## Solution Overview
Create a reliable version tracking system that:
1. Tracks every user's current app version on every login/open
2. Allows admin to send push notifications ONLY to outdated users
3. Shows the update banner ONLY to outdated users
4. Provides admin visibility into version adoption

---

## Implementation Steps

### Step 1: Fix Version Tracking Hook
**File:** `src/hooks/useAppInstallTracking.tsx`
- Use `App.getInfo().version` for reliable native version detection
- Track by `user_id` primarily (not device_id) for consistency
- Update `last_seen_version` column on every app open
- Remove localStorage caching that prevents updates

### Step 2: Add Hook to NativeAppLayout  
**File:** `src/layouts/NativeAppLayout.tsx`
- Call `useAppInstallTracking()` in the layout so it runs for all logged-in users
- This ensures version is tracked on every app open

### Step 3: Add Version Field to Push Subscriptions Table
**Database migration:**
- Add `app_version` column to `push_subscriptions` table
- This links each push token directly to a version

### Step 4: Update Push Registration to Include Version
**File:** `src/lib/pushNotifications.ts`
- When saving push token, also save current app version
- Update version whenever token is refreshed

### Step 5: Create Edge Function for Targeted Version Push
**File:** `supabase/functions/send-update-push-notification/index.ts`
- Accept `targetVersion` parameter (e.g., "< 1.1.08")
- Filter push tokens to only those with outdated versions
- Send push notification to prompt update

### Step 6: Admin UI for Version-Based Push
**File:** `src/pages/admin/Communications.tsx` or new component
- Add "Send Update Notification" feature
- Show current version distribution
- Select target versions (all below X)
- Preview affected user count before sending

### Step 7: Improve Update Banner Logic
**File:** `src/hooks/useAppUpdateChecker.tsx`
- Instead of calling edge function, compare against `app_settings.latest_ios_version`
- Show banner immediately on app open if version < latest
- No need for 24-hour cache on first check

---

## Technical Details

### Database Changes
```sql
-- Add version tracking to push_subscriptions
ALTER TABLE push_subscriptions 
ADD COLUMN app_version text;

-- Index for fast version filtering
CREATE INDEX idx_push_subscriptions_version 
ON push_subscriptions(app_version);
```

### Version Tracking Flow
1. User opens app → `useAppInstallTracking` runs
2. Gets version via `App.getInfo().version`
3. Updates `app_installations.last_seen_version` 
4. Updates `push_subscriptions.app_version`

### Push Notification Flow (for updates)
1. Admin opens Communications → "Update Notification" tab
2. Sees: "45 users on < 1.1.08"
3. Clicks "Send Update Push"
4. Edge function queries `push_subscriptions WHERE app_version < '1.1.08'`
5. Sends push to those users only

### In-App Banner Flow
1. On app open, compare `App.getInfo().version` with `app_settings.latest_ios_version`
2. If outdated → show banner immediately
3. User clicks "Update" → opens App Store
4. User clicks "Later" → dismiss for 24 hours

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/hooks/useAppInstallTracking.tsx` | Modify | Fix version tracking logic |
| `src/layouts/NativeAppLayout.tsx` | Modify | Call tracking hook |
| `src/lib/pushNotifications.ts` | Modify | Save version with push token |
| `supabase/functions/send-update-push-notification/index.ts` | Create | Version-targeted push |
| `src/components/admin/UpdateNotificationSender.tsx` | Create | Admin UI for sending |
| `src/pages/admin/Communications.tsx` | Modify | Add "Updates" tab |
| Database | Migrate | Add `app_version` to `push_subscriptions` |

---

## Result
After implementation:
- Every app open updates the user's version in database
- Admin can send push to "all users on version < X"  
- Banner shows automatically to outdated users
- You can see exactly who has updated in admin dashboard
