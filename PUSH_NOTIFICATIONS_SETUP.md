# 📲 iOS Push Notifications Setup Guide

This guide covers the complete setup of native iOS push notifications using Capacitor and Apple Push Notification service (APNs).

## ✅ Prerequisites

Before starting, ensure you have:

- **Apple Developer Account** ($99/year)
- **APNs Auth Key (.p8 file)** from Apple Developer Portal
- **Xcode** installed on Mac
- **Capacitor iOS platform** added to project (`npx cap add ios`)

## 🔧 Complete Setup Steps

### Step 1: APNs Auth Key Configuration

1. Generate or locate your APNs Auth Key (.p8 file) from [Apple Developer Portal](https://developer.apple.com/account/resources/authkeys/list)
2. Note the **Key ID** (e.g., `ABC123DEFG`)
3. Note your **Team ID** (found in Apple Developer Portal → Membership)
4. Save these values as Supabase secrets:
   - `APNS_KEY_ID`: Your Key ID
   - `APNS_TEAM_ID`: Your Team ID
   - `APNS_KEY_CONTENT`: Full contents of the .p8 file
   - `APNS_ENVIRONMENT`: `development` (for testing) or `production` (for App Store)

### Step 2: Xcode Capabilities

1. Open your project in Xcode: `npx cap open ios`
2. Select your project target → **Signing & Capabilities**
3. Click **+ Capability** and add:
   - **Push Notifications**
   - **Background Modes** (enable "Remote notifications")

### Step 3: **CRITICAL** - Add APNs Bridge Methods to AppDelegate.swift

⚠️ **This is the most important step and must be done manually every time you rebuild the iOS platform.**

The Capacitor PushNotifications plugin requires two native iOS methods to bridge APNs tokens/errors from native code to JavaScript. These methods are **NOT automatically generated** by `npx cap add ios`.

#### Location
File: `ios/App/App/AppDelegate.swift`

#### Code to Add

Add these two methods inside the `AppDelegate` class:

```swift
// MARK: - Push Notification Registration Handlers
// These methods bridge APNs token/error from native iOS to Capacitor JavaScript layer
// CRITICAL: Required for Capacitor PushNotifications plugin to work
// Without these, PushNotifications.register() will timeout

func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
}

func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
}
```

#### What These Methods Do

1. **`didRegisterForRemoteNotificationsWithDeviceToken`**: 
   - Called by iOS when APNs successfully provides a device token
   - Forwards the token to Capacitor via NotificationCenter
   - Without this, your JavaScript `PushNotifications.addListener('registration')` never fires

2. **`didFailToRegisterForRemoteNotificationsWithError`**:
   - Called by iOS when APNs registration fails
   - Forwards the error to Capacitor via NotificationCenter
   - Without this, your JavaScript `PushNotifications.addListener('registrationError')` never fires

#### Full AppDelegate.swift Template

See [IOS_APPDELEGATE_TEMPLATE.md](./IOS_APPDELEGATE_TEMPLATE.md) for a complete working template.

### Step 4: Sync and Build

```bash
# Build web assets
npm run build

# Sync to iOS
npx cap sync

# Open in Xcode
npx cap open ios
```

### Step 5: Test Registration

Run your app on a **real iOS device** (simulators don't support push notifications):

1. Build and run from Xcode on a physical device
2. Navigate to your app and trigger the notification permission prompt
3. Accept notifications
4. Check logs for `[Push] ✅ Token saved successfully`

### Step 6: Test Notification Delivery

1. Go to Admin Panel → Push Notifications
2. Use "Test Push Notification (Development)" card
3. Select target (All users or specific course)
4. Enter title and message
5. Click "Send Test Push"
6. Notification should arrive on your device

## 🔄 If You Rebuild the iOS Platform

If you ever delete the `ios/` folder and run `npx cap add ios` again, you **MUST re-add the two AppDelegate.swift methods** from Step 3.

**Checklist after rebuilding:**
- [ ] Add the two APNs bridge methods to `AppDelegate.swift`
- [ ] Re-enable Push Notifications capability in Xcode
- [ ] Re-enable Background Modes → Remote notifications in Xcode
- [ ] Verify signing certificates are configured

## 🚨 Troubleshooting

### Registration Times Out
**Symptom**: `[Push] ❌ Timeout after 15s`

**Causes**:
1. Missing AppDelegate.swift methods (most common) → Add the two methods from Step 3
2. Push Notifications capability not enabled in Xcode → Enable in Signing & Capabilities
3. Testing on simulator → Use real device only
4. Wrong APNS_ENVIRONMENT → Use `development` for Xcode builds, `production` for App Store

### Token Registration Fails
**Symptom**: `[Push] ❌ APNs registration error`

**Causes**:
1. Invalid APNs Auth Key → Verify APNS_KEY_CONTENT in Supabase secrets
2. Wrong Team ID or Key ID → Verify in Apple Developer Portal
3. Push Notifications capability missing → Add in Xcode
4. Wrong bundle ID → Verify in Xcode matches Apple Developer Portal

### Notifications Don't Arrive
**Symptom**: Token saved, but no notifications received

**Causes**:
1. Wrong APNS_ENVIRONMENT → Match environment to build type
2. Device token not reaching APNs → Check edge function logs
3. Notifications disabled in iOS Settings → Check Settings → [Your App] → Notifications
4. App in foreground without foreground handler → Notifications only show when app is backgrounded

### ⚠️ Important: Initial Notification Permission Popup

The app includes an **automatic notification permission popup** that appears on first launch (native iOS only):

**When it appears:**
- Shows 1.5 seconds after app loads
- Only appears if notifications are not yet granted
- Only shows once (stored in localStorage)

**User options:**
- "Enable Notifications" → Requests permission and subscribes
- "Not Now" → Dismisses popup (can enable later in Profile)
- "Never Ask Again" → Never shows popup again

**To manually enable later:**
- Go to Profile → Notifications section
- Tap "Enable Notifications"

**If permission is denied:**
- User must go to iOS Settings → LadyBoss Academy → Notifications
- Toggle "Allow Notifications" to ON
- Return to app and tap "Re-register" in Profile

**Location:** Implemented in `src/layouts/AppLayout.tsx`

---

## 📊 Environment Configuration

| Build Type | APNS_ENVIRONMENT | Use Case |
|------------|------------------|----------|
| Xcode Development Build | `development` | Local testing during development |
| TestFlight | `development` | Beta testing before release |
| App Store Release | `production` | Production users after App Store approval |

⚠️ **Remember**: Change `APNS_ENVIRONMENT` from `development` to `production` before App Store submission.

## 🎯 Notification Handlers (Phases 2-3)

The app now handles notifications in all states:

### Foreground (App is open and visible)
- Displays an in-app toast notification
- Shows "View" button if notification has a URL
- Clicking "View" navigates to the specific content
- **How it works**: Uses `pushNotificationReceived` event listener

### Background (App is in background)
- Notification appears in iOS notification center
- Tapping notification opens app and navigates to content
- **How it works**: Uses `pushNotificationActionPerformed` event listener

### Closed (App is completely closed)
- Notification appears in iOS notification center
- Tapping notification launches app and navigates to content
- **How it works**: Same as background, Capacitor handles app launch

### Deep Linking
- Notifications can include a `url` or `destination_url` in their data payload
- App automatically navigates to the specified URL when notification is tapped
- Supports any app route (e.g., `/app/courses`, `/app/profile`, `/app/playlist/abc123`)
- If no URL provided, defaults to `/app/home`

**Example notification payload:**
```json
{
  "title": "New Course Available",
  "body": "Check out Bilingual Power Class",
  "data": {
    "url": "/app/course/bilingual-power-class"
  }
}
```

## 🔔 Multi-Touchpoint Notification Reminder System

The app implements a comprehensive reminder strategy to encourage users to enable push notifications without being annoying.

### Reminder Touchpoints

#### 1. Initial Welcome Popup (NativeAppLayout)
- **When**: 2 seconds after first app launch
- **Title**: "Stay Connected!"
- **Message**: "Get notified about new courses, class reminders, and important updates"
- **Buttons**: "Enable Notifications" / "Maybe Later"
- **Tracking**: `hasSeenInitialNotificationPrompt`

#### 2. Course Enrollment Reminder (AppCourseDetail)
- **When**: 1.5 seconds after user enrolls in their first course
- **Title**: "Never Miss Your Classes!"
- **Message**: "You just enrolled! Enable notifications so you never miss class reminders"
- **Buttons**: "Enable Now" / "Not Now"
- **Tracking**: `hasSeenEnrollmentPrompt`

#### 3. Time-Based Persistent Reminders (NativeAppLayout)
- **When**: 
  - First 3 reminders: Every 3 days
  - Subsequent reminders: Weekly
  - Stops after 7 total prompts (4 weeks)
- **Title**: "Don't Miss Out!"
- **Message**: Varies to avoid repetition
- **Tracking**: `lastNotificationPromptTime`, `notificationPromptCount`

#### 4. In-App Banner (AppHome)
- **When**: Always visible unless:
  - Notifications are enabled
  - User dismissed within last 2 days
  - User clicked "Never ask again"
- **Style**: Alert at top of Home screen
- **Message**: "🔔 Enable notifications to get course reminders"
- **Buttons**: "Enable" / "Dismiss (X)"
- **Tracking**: `notificationBannerDismissedTime`

### localStorage Keys

```typescript
// Tracking keys used by reminder system
'hasSeenInitialNotificationPrompt': 'true'    // Initial popup shown
'lastNotificationPromptTime': timestamp       // Last reminder time
'notificationPromptCount': number             // Total reminders shown
'hasSeenEnrollmentPrompt': 'true'            // Enrollment popup shown
'notificationBannerDismissedTime': timestamp  // Banner dismissed time
'userDeclinedNotifications': 'true'           // User explicitly opted out
```

### User Opt-Out

Users can permanently disable reminders by:
1. Clicking "Don't ask again" button (available after 2+ prompts)
2. This sets `userDeclinedNotifications` to `true`
3. All future reminders will be suppressed
4. User can still enable notifications via Profile settings

### Implementation

The system is implemented in:
- **Hook**: `src/hooks/useNotificationReminder.tsx` - Central logic
- **NativeAppLayout**: Initial and time-based popups
- **AppHome**: In-app banner
- **AppCourseDetail**: Enrollment reminder

## 📝 Database Schema

Push notification tokens are stored in `push_subscriptions` table:

```sql
CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  endpoint text NOT NULL,  -- Format: "native:{apns_token}"
  p256dh_key text NOT NULL, -- Set to "native-ios" for iOS
  auth_key text NOT NULL,   -- Set to "native-ios" for iOS
  created_at timestamptz DEFAULT now()
);
```

## 🎯 Success Criteria

You'll know push notifications are working when:

- ✅ User can enable notifications in app
- ✅ `[Push] ✅ Token saved successfully` appears in logs
- ✅ Token appears in `push_subscriptions` table with `native:` prefix
- ✅ Admin can send test notifications from admin panel
- ✅ **Foreground**: Notifications show toast with "View" button when app is open
- ✅ **Background**: Tapping notification opens app and navigates to content
- ✅ **Closed**: Tapping notification launches app and navigates to content  
- ✅ **Deep Linking**: URLs in notification data correctly navigate to specific content
- ✅ **Badge Management**: Badge clears on app open, notification tap, and user interaction
- ✅ Notification badge updates correctly

## 📚 Additional Resources

- [Capacitor Push Notifications Documentation](https://capacitorjs.com/docs/apis/push-notifications)
- [Apple Push Notification Service Guide](https://developer.apple.com/documentation/usernotifications)
- [APNs Auth Key Setup](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server/establishing_a_token-based_connection_to_apns)

---

**Last Updated**: Post-v1.0.3 after fixing registration timeout issue  
**Critical Discovery**: The two AppDelegate.swift bridge methods are the key to making push notifications work with Capacitor.
