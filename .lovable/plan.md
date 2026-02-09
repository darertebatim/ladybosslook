
# Push Notifications Hub

## Overview
Create a unified admin page at `/admin/pn` that consolidates all push notification functionality into one place. This will bring together the existing **PushNotificationCenter** (server-side scheduled jobs) and **NotificationAnalytics** (local notification tracking), plus add a comprehensive documentation section mapping all push notification systems.

## Current State
- **PushNotificationCenter** is in Communications tab (PN Center)
- **NotificationAnalytics** is in Tools tab (Notifications)
- No single place documenting all push notification types

## Implementation

### 1. Create New Page: `/admin/pn`

Create `src/pages/admin/PushNotifications.tsx` with tabs:

| Tab | Content |
|-----|---------|
| **Scheduled Jobs** | Current PushNotificationCenter component (server-side cron jobs) |
| **Local Analytics** | Current NotificationAnalytics component (client-side local notifications) |
| **PN Map** | New comprehensive documentation of all push notification types |

### 2. PN Map Content

A reference table documenting all notification systems:

**A. Server-Side Scheduled (Cron Jobs)**

| Function | Schedule | Description | User Preference |
|----------|----------|-------------|-----------------|
| `send-daily-notifications` | Hourly | Morning summary, evening check-in, time period reminders, goal nudges - timezone-aware | Per-type toggles |
| `send-drip-notifications` | Hourly | New course content unlocks based on round start date | `content_drip` |
| `send-session-reminders` | Every 15 min | Live session reminders (24h and 1h before) | `session_reminders` |
| `send-task-reminders` | Every 5 min | Fallback server-side task reminders for older app versions | `reminder_enabled` per task |
| `send-weekly-summary` | Hourly | Monday 9 AM local time - weekly progress summary | Default enabled |
| `send-feed-post-notifications` | Every 15 min | New feed posts to channel members | Channel membership |
| `send-momentum-celebration` | Daily | Milestone celebrations (3, 7, 14, 21, 30 days) | `momentum_celebration` |

**B. Triggered (On-Demand)**

| Function | Trigger | Description |
|----------|---------|-------------|
| `send-push-notification` | Admin action | Manual push to specific users/courses/rounds |
| `send-broadcast-message` | Admin action | Broadcast with optional email + push |
| `send-chat-notification` | New chat message | Real-time support chat notifications |
| `send-update-push-notification` | Admin action | Targeted updates to users on old app versions |

**C. Client-Side (Local Notifications)**

| Type | Trigger | Tracked Events |
|------|---------|----------------|
| Task Reminder | Capacitor LocalNotifications | scheduled, delivered, tapped, cancelled |
| Urgent Alarm | Multiple triggers with vibration | scheduled, delivered, tapped, cancelled |

### 3. Navigation Updates

- Add new nav item: "Push" with Bell icon at `/admin/pn`
- Keep Communications tab but remove "PN Center" subtab (redirect to new page)
- Keep Tools tab but remove "Notifications" subtab (redirect to new page)

### 4. Route Registration

Add to App.tsx admin routes:
```
/admin/pn → PushNotifications page
```

---

## Technical Details

### Files to Create
- `src/pages/admin/PushNotifications.tsx` - Main page with three tabs

### Files to Modify
- `src/components/admin/AdminNav.tsx` - Add "Push" nav item
- `src/App.tsx` - Add route for `/admin/pn`
- `src/pages/admin/Communications.tsx` - Remove PN Center tab, add link to new page
- `src/pages/admin/Tools.tsx` - Remove Notifications tab, add link to new page

### Component Structure

```
PushNotifications.tsx
├── Tabs
│   ├── "Scheduled" → <PushNotificationCenter />
│   ├── "Local" → <NotificationAnalytics />
│   └── "PN Map" → <PNDocumentation /> (new inline component)
```

### PN Map Visual Design

Cards organized by category with:
- Function name and icon
- Schedule/trigger description
- User preference key
- Deep link to Supabase logs
- Status indicator (if connected to schedule table)

