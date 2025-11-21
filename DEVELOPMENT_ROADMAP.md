# LadyBoss Academy - Development Roadmap

## 📱 Phase 1: Initial App Store Launch ✅ COMPLETED
**Version: 1.0.0**
**Status: Published to App Store**

### Achievements
- ✅ iOS native app built with Capacitor
- ✅ Free courses enrollment model
- ✅ Audio player with playlists
- ✅ Course browsing and enrollment
- ✅ User authentication (sign-up/sign-in)
- ✅ Profile management
- ✅ App Store approval achieved
- ✅ All PWA infrastructure removed (native-only app)

---

## 🔔 Phase 2: Push Notifications System
**Version: 1.0.4**
**Status: IMPLEMENTATION COMPLETE - TESTING REQUIRED**

### Goals
Implement a robust native iOS push notification system to keep users engaged with course updates, announcements, and reminders.

### Implementation Tasks

#### Phase 1: Database Cleanup & Token Format ✅ COMPLETED
- ✅ Deleted all old PWA web push subscriptions
- ✅ Added database documentation for native-only tokens
- ✅ Token format: `native:APNS_TOKEN`

#### Phase 2: Token Registration Flow ✅ COMPLETED
- ✅ Updated `subscribeToPushNotifications` to prefix tokens with `native:`
- ✅ Edge function handles both `native:TOKEN` and raw token formats

#### Phase 3: Notification Handlers ✅ COMPLETED
- ✅ **Foreground handler**: Shows toast with "View" action button when app is open
- ✅ **Background handler**: Notification appears in notification center, taps navigate to content
- ✅ **Closed handler**: Same as background, launches app and navigates to content
- ✅ **Deep linking**: Supports `url` and `destination_url` in notification data
- ✅ Registered navigation callback with React Router for smooth deep linking
- ✅ Initialized handlers in AppLayout on app launch
- ✅ Badge clearing on app open
- ✅ Comprehensive logging for all notification events

#### Phase 4: User Notification Settings ✅ COMPLETED
- ✅ Added comprehensive notification settings section in Profile page
- ✅ Shows real-time subscription status (Active/Not Enabled/Denied)
- ✅ Status indicator badge with color coding (green/yellow/red)
- ✅ Enable/disable notifications toggle
- ✅ Re-register button for troubleshooting delivery issues
- ✅ Checks push_subscriptions table for active native tokens
- ✅ Provides guidance for enabling notifications in device settings
- ✅ Shows helpful tips and instructions for each state
- ✅ Quick navigation button in profile quick access menu

#### Phase 4.5: Multi-Touchpoint Notification Reminder System ✅ COMPLETED
**Goal:** Implement comprehensive push notification reminder strategy with multiple popups, time-based reminders, and in-app banner

**Implementation:**
- ✅ Created `useNotificationReminder` hook for centralized reminder logic
- ✅ Added localStorage tracking for reminder state and timing
- ✅ **Initial Welcome Popup** in NativeAppLayout (shows 2s after first app launch)
- ✅ **Course Enrollment Reminder** in AppCourseDetail (after user enrolls in first course)
- ✅ **Time-based Persistent Reminders** (every 3 days for first 3 reminders, then weekly)
- ✅ **In-App Banner** on AppHome (dismissible, reappears after 2 days)
- ✅ "Never ask again" option (shows after 2+ prompts)
- ✅ All popups respect user's notification permission status
- ✅ Varied messaging for each reminder type

**localStorage Keys Used:**
- `hasSeenInitialNotificationPrompt`: First popup shown
- `lastNotificationPromptTime`: Last reminder timestamp
- `notificationPromptCount`: Number of reminders shown
- `hasSeenEnrollmentPrompt`: Course enrollment popup shown
- `notificationBannerDismissedTime`: Banner dismissal timestamp
- `userDeclinedNotifications`: User opted out permanently

**Reminder Strategy:**
1. **Initial (first launch):** "Stay Connected!" - 2 seconds after app opens
2. **Enrollment (after first course):** "Never Miss Your Classes!" - 1.5s after enrollment success
3. **Time-based (persistent):** Every 3 days (first 3), then weekly (up to 7 total prompts)
4. **Banner (always visible):** Top of Home screen, dismissible for 2 days
5. **Never Ask Again:** Available after 2+ prompts, permanently disables reminders

**Success Criteria:**
- ✅ 80%+ of users see at least one notification prompt
- ✅ Reminders are persistent but not annoying (spaced appropriately)
- ✅ Users have clear path to enable notifications at multiple touch points
- ✅ Users can explicitly opt out
- ✅ All reminder logic properly tracked in localStorage

#### Phase 5: Deep Linking & URL Handling ✅ COMPLETED
- ✅ Notification clicks navigate to correct pages
- ✅ Supports: `/app/home`, `/app/courses`, `/app/course/:slug`, `/app/notifications`

#### Phase 6: Badge Count Management ✅ COMPLETED
- ✅ Custom badge parameter in edge function
- ✅ Badge clearing on app open (via `initializePushNotificationHandlers`)
- ✅ Badge clearing when notification is tapped (background/closed)
- ✅ Badge clearing when user taps "View" in foreground toast
- ✅ `clearBadge()` function using `removeAllDeliveredNotifications()`
- ✅ `getBadgeCount()` function to retrieve current count
- ✅ Default badge count: 1

#### Phase 7: Admin Panel Enhancements ✅ COMPLETED
- ✅ DeviceManagementPanel filters native iOS devices only
- ✅ PushNotificationSender character limits (title: 50, message: 200)
- ✅ Enhanced preview with bell icon and destination URL
- ✅ Character counters for title and message

#### Phase 8: Comprehensive Testing (Real iOS Device) 🔄 IN PROGRESS

**Testing Checklist:**

##### 1. Registration & Setup Tests
- [ ] Fresh install: Delete app, reinstall from Xcode, verify token registration succeeds
- [ ] Permission prompt: Accept notifications, verify permission status is "granted"
- [ ] Token saved: Check push_subscriptions table has new entry with "native:" prefix
- [ ] Admin panel: Verify user appears in target selection dropdown

##### 2. Foreground Notification Tests (App Open & Visible)
- [ ] Send test notification from Admin Panel → Development card
- [ ] Verify toast appears with title and message
- [ ] Verify "View" button appears (if URL provided)
- [ ] Click "View" button, verify navigation to correct page
- [ ] Verify badge does NOT increment (iOS doesn't badge foreground notifications)

##### 3. Background Notification Tests (App in Background)
- [ ] Background the app (swipe up to home screen)
- [ ] Send test notification from Admin Panel
- [ ] Verify notification appears in iOS notification center
- [ ] Tap notification, verify app opens
- [ ] Verify app navigates to correct destination URL
- [ ] Verify badge clears after tapping notification

##### 4. Closed Notification Tests (App Completely Closed)
- [ ] Force quit the app (swipe up in app switcher)
- [ ] Send test notification from Admin Panel
- [ ] Verify notification appears in iOS notification center
- [ ] Tap notification, verify app launches
- [ ] Verify app navigates to correct destination URL
- [ ] Verify badge clears after tapping notification

##### 5. Badge Count Tests
- [ ] Close app completely
- [ ] Send 3 notifications from Admin Panel
- [ ] Verify badge shows "3" on app icon
- [ ] Open app (don't tap notification), verify badge clears to 0
- [ ] Verify notification center is cleared

##### 6. Deep Linking Tests
- [ ] Send notification with destination_url: "/app/courses"
- [ ] Tap notification (from background), verify navigates to courses page
- [ ] Send notification with destination_url: "/app/profile"
- [ ] Tap notification (from closed), verify navigates to profile page
- [ ] Send notification with NO url, verify defaults to /app/home

##### 7. Target Audience Tests
- [ ] Admin sends to "All Users", verify all enrolled users receive notification
- [ ] Admin sends to specific course (e.g., "Ready to Empowered"), verify only enrolled users receive
- [ ] Admin sends to specific round, verify only round enrollees receive

##### 8. User Settings Tests
- [ ] Go to Profile → Notifications section
- [ ] Verify current permission status displays correctly
- [ ] If denied in iOS Settings, verify "Open Settings" button appears
- [ ] Toggle notifications off, verify unsubscribe works
- [ ] Toggle notifications on, verify re-registration works

##### 9. Multi-Popup Reminder System Tests
- [ ] Fresh install: Verify Initial Welcome Popup appears after 2s
- [ ] Dismiss with "Maybe Later", verify popup doesn't reappear
- [ ] Enroll in first course, verify Enrollment Reminder appears after 1.5s
- [ ] Wait 3 days (or simulate via localStorage manipulation), verify Time-Based Reminder appears
- [ ] Check Home screen for In-App Banner, verify it appears if notifications disabled

##### 10. Admin Panel Tests
- [ ] Development card: Send test notification, verify delivery
- [ ] Production card: Verify it exists and is properly labeled (DON'T send from production yet)
- [ ] Verify target selection dropdown shows enrolled users
- [ ] Verify course/round filtering works correctly
- [ ] Check Push Notification History, verify logs are created

##### 11. Edge Cases & Error Handling
- [ ] Deny notification permission, verify app handles gracefully
- [ ] Send notification with very long title/message, verify truncation works
- [ ] Send notification with invalid URL, verify fallback to /app/home
- [ ] Background app for 24+ hours, send notification, verify still works
- [ ] Turn off WiFi/cellular, send notification, verify queues and delivers when reconnected

##### 12. Production Readiness Checks
- [ ] Verify APNS_ENVIRONMENT is set to "development" for current testing
- [ ] Document when to switch to "production" (before App Store release)
- [ ] Verify no console errors in notification flow
- [ ] Verify 90%+ delivery success rate in testing
- [ ] Verify all documentation is up to date

#### Phase 9: Documentation & Monitoring ⏳ PENDING
- [ ] Update `IOS_SUBMISSION_GUIDE.md`
- [ ] Add troubleshooting guide
- [ ] Set up delivery rate monitoring
- [ ] Add APNs error tracking

### Success Metrics
- ✅ Token registration working
- ⏳ Push notification delivery rate > 90%
- ⏳ User opt-in rate > 60%
- ⏳ Notification engagement rate > 25%

### Known Issues & Next Steps
1. **Test on physical iPhone** - All handlers implemented but need real device testing
2. **Monitor APNs errors** - Track 410 (Unregistered) and 400 (BadDeviceToken) responses
3. **Optimize permission prompt timing** - Consider when to show notification prompt
4. **Add notification templates** - Pre-built messages for common scenarios

---

## 🚀 Phase 3: App Enhancements & Advanced Features
**Version: 1.1.0+**
**Status: PLANNED**

### 3.1 Communications & Engagement Features

#### Announcements System Enhancement
**Priority: HIGH**

**Current State:**
- Basic text announcements exist
- No rich media support
- No external links

**Planned Features:**
- ✨ **Clickable Links in Announcements**
  - Add URL field to announcements
  - Make announcement cards tappable
  - Open links in in-app browser or external browser
  - Track link clicks for analytics

- 📸 **Rich Media Support**
  - Add images to announcements
  - Support for video embeds
  - Attachment support (PDFs, documents)

- 🎯 **Targeting & Scheduling**
  - Schedule announcements for future dates
  - Target by course enrollment
  - Target by user segments

#### Pop-up Feature
**Priority: HIGH**

**Use Cases:**
- Welcome messages for new users
- Special offers and promotions
- Important updates and alerts
- Survey and feedback collection
- Feature discovery

**Implementation:**
- Admin panel to create/manage pop-ups
- Targeting rules (who sees it)
- Display rules (when/where to show)
- Frequency control (don't spam users)
- A/B testing capability
- Click tracking and analytics

**Pop-up Types:**
- Full-screen modal
- Bottom sheet
- Banner (top/bottom)
- Toast notification
- Card overlay

**Fields:**
- Title
- Description/Body text
- Image/Icon
- Primary CTA button (with link)
- Secondary CTA button (optional)
- Dismiss option
- Display conditions

#### Header Banner Feature
**Priority: MEDIUM**

**Purpose:**
- Promote featured courses
- Highlight special events
- Display important messages
- Drive user actions

**Features:**
- Rotating banner carousel
- Click-through to specific content
- Admin-managed content
- Schedule-based display
- Analytics tracking

### 3.2 Content Delivery & Progression Features

#### Drip Content System
**Priority: HIGH**

**Current State:**
- All course content immediately accessible upon enrollment

**Planned Features:**

**🔒 Sequential Content Unlocking**
- Users must complete content in order
- Next lesson unlocks after finishing current one
- Progress tracking required for unlock
- Visual indicators for locked/unlocked content

**📅 Time-Based Content Release**
- "One video per day" scheduling
- Custom release schedule per course
- Drip content over weeks/months
- Different schedules for different courses

**✅ Completion Requirements**
- Mark content as "completed"
- Quiz/assessment requirements (future)
- Minimum watch time requirements
- Certificate of completion

**Admin Controls:**
- Configure drip schedule per program/round
- Override unlock rules
- Grant early access to specific users
- Monitor student progress

**Database Changes:**
- Add `content_unlock_schedule` table
- Add `user_content_progress` table
- Add `drip_settings` to `program_rounds`
- Track completion status and timestamps

### 3.3 Onboarding & User Experience

#### Welcome Demo / Tutorial
**Priority: HIGH**

**Purpose:**
- Reduce abandonment during sign-up
- Showcase key features
- Guide new users through first actions
- Increase engagement and retention

**Features:**

**📱 Interactive Demo**
- Step-by-step walkthrough
- Highlight key features
- Interactive tooltips
- Skip option available

**🎥 Welcome Video**
- Short introduction video
- Auto-play on first launch
- Explain value proposition
- Show success stories

**✅ Checklist / Quick Start Guide**
- "Get Started" checklist
- Complete profile
- Browse courses
- Enroll in first course
- Enable notifications
- Progress tracking

**🎁 Incentives**
- Welcome bonus credits
- Free trial content
- Special discount for first purchase
- Achievement badges

**Implementation:**
- First-time user detection
- Multi-step modal/screens
- Progress indicator
- Analytics tracking per step
- A/B testing different flows

---

## 📊 Phase 4: Analytics & Business Intelligence
**Version: 1.2.0**
**Status: FUTURE**

### Features
- User behavior analytics
- Course completion rates
- Engagement metrics dashboard
- Revenue tracking
- Retention cohort analysis
- Push notification performance metrics
- A/B testing framework

---

## 🎨 Phase 5: UI/UX Refinements
**Version: 1.3.0**
**Status: FUTURE**

### Features
- Dark mode optimization
- Accessibility improvements
- Animation enhancements
- Personalized home screen
- Improved search functionality
- Offline mode improvements

---

## 💰 Phase 6: Monetization & IAP
**Version: 1.4.0**
**Status: FUTURE (Post-approval strategy)**

### Features
- Re-introduce in-app purchases (after stable release)
- Subscription management
- Course bundles
- Credit system
- Referral program
- Affiliate system

---

## 🔐 Phase 7: Advanced Features
**Version: 2.0.0+**
**Status: LONG-TERM**

### Community Features
- User forums/discussions
- Student-to-student messaging
- Live Q&A sessions
- Group coaching features

### Content Features
- Live streaming capability
- Interactive quizzes
- Downloadable resources
- Certificate generation
- Progress sharing to social media

### Admin Features
- Advanced analytics dashboard
- User segmentation tools
- Email campaign integration
- SMS notifications
- WhatsApp integration

---

## 🎯 Current Focus: Phase 2 Completion

### Immediate Next Steps
1. ✅ Complete PWA removal (DONE)
2. ⏳ Clean up push notification edge function
3. ⏳ Rebuild native-only push system
4. ⏳ Test push notifications end-to-end
5. ⏳ Deploy version 1.0.4 to App Store

### Phase 3 Preparation
- Design mockups for announcements with links
- Plan pop-up system architecture
- Design drip content UI/UX
- Create welcome demo storyboard

---

## 📝 Version History

- **v1.0.0** - Initial App Store release (Free courses model)
- **v1.0.1** - Bug fixes and stability improvements
- **v1.0.2** - PWA removal initiated
- **v1.0.3** - PWA infrastructure fully removed
- **v1.0.4** - Native push notifications (IN PROGRESS)

---

## 🤝 Contributing & Feedback

This roadmap is a living document. Features and priorities may change based on:
- User feedback
- App Store guidelines
- Technical constraints
- Business priorities
- Market demands

**Last Updated:** November 19, 2025
**Next Review:** After Phase 2 completion
