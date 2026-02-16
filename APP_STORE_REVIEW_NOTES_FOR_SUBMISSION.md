# App Review Notes - Copy & Paste into App Store Connect

---

## For Reviewers:

**App Overview:**
LadyBoss Academy is a free educational platform offering personal and professional development courses and audio content for women. All courses are available for free enrollment.

**Test Account:**
- Email: reviewer@ladybosslook.com
- Password: ReviewAccess2025!
- Purpose: This account has courses already enrolled. Use it to explore course content, audio playlists, push notifications, and all features. You can also test free enrollment by browsing and enrolling in additional courses.

**Key Features to Test:**

1. **Sign in** → Access dashboard with enrolled courses displayed
2. **Sign in with Apple/Google** → Quick authentication options on the login screen
3. **Browse tab** → View all available free courses and test enrolling in additional courses
4. **Courses tab** → View enrolled courses with materials and playlists
5. **Audio Player tab** → Browse and play audio playlists (supports background playback)
6. **Community Feed** → Share updates, react to posts, and engage with other students
7. **Daily Journal** → Create journal entries with mood tracking and writing prompts
8. **Push Notifications** → 
   - On first launch, you'll see a prompt to enable notifications
   - Grant permission to receive course updates and announcements
   - Navigate to Profile tab → Push Notifications section to manage settings
9. **Chat Support** → Send text and voice messages to support team
10. **Course Details** → Tap any enrolled course to view:
    - Course materials (downloadable PDFs)
    - Audio playlists (if available)
    - Course announcements
    - Support contact options
11. **Enroll Free** → From Browse tab, tap any course and use "Enroll Free" button (instant enrollment, no payment)
12. **Profile tab** → View user information, manage settings, and account options
13. **Delete Account** → Profile tab → Actions section → "Delete Account" button with confirmation
14. **Forgot Password** → On login screen, tap "Forgot password?" to reset your password via email

**Content & Materials:**
All courses include:
- **Audio Playlists:** Background playback supported for continued learning
- **Downloadable Materials:** PDF workbooks, exercises, class materials, and guides
- **Course Updates:** Announcements and important information
- **Support Access:** Direct contact options for student support

**Available Content (Free Access):**
1. **Ready to Empowered (English)** - Personal empowerment audiobook with exercises and reflection materials
2. **LBPodcast (English)** - Educational podcast series on personal and professional development topics

**External Services (User-Initiated Only):**
- **Telegram (@ladybosslook):** Optional student support communication channel (users must choose to contact)

**Permissions Requested (v1.0.6):**
- **Push Notifications:** Users receive important course updates, announcements, and educational reminders. On first app launch, users see a prompt to enable notifications. Users can manage notification preferences anytime in Profile → Push Notifications settings.
- **Microphone (optional):** Used only for voice messages in Chat support. Requires explicit user action.
- **Calendar (optional):** Used to add course sessions to the user's calendar. Requires user to tap "Add to Calendar" in course details. Write-only access - we never read existing calendar events.

**Account Deletion (Guideline 5.1.1(v)):**
Users can delete their account at any time:
1. Go to **Profile tab**
2. Scroll down to **Actions section**  
3. Tap **"Delete Account"** button
4. Read the warning about permanent data deletion
5. Type **DELETE** to confirm
6. Account and all associated data are immediately and permanently removed

**Privacy & Data:**
- User data stored securely via Supabase backend
- No third-party data sharing except essential services (Supabase for authentication and database)
- Privacy Policy: https://ladybosslook.lovable.app/privacy
- Refund Policy: https://ladybosslook.lovable.app/refund

**Authentication:**
- Users can create accounts using email/password
- Full sign-up and sign-in functionality built into the app
- No social login required

**Content Language:**
All program content is delivered in English.

**Support Contacts:**
- Email: support@ladybosslook.com
- Telegram: @ladybosslook (optional, user-initiated)

**Notes for Review:**
- This is version 1.1.1 — all app features have been previously reviewed and approved in prior submissions
- The only addition in this version is the Simora+ subscription plan (monthly & annual auto-renewable subscriptions)
- No new permissions, no new background modes, no functionality changes — only the subscription paywall has been added
- Push notifications are used exclusively for educational purposes: course updates, announcements, and learning reminders
- Users must explicitly opt-in to receive notifications via the initial prompt or Profile settings
- All free features remain fully accessible without subscribing
- No payment processing or subscription systems were present before — this version introduces In-App Purchase subscriptions managed entirely by Apple
- The test account already has courses enrolled, but reviewers can also test the enrollment flow by enrolling in additional courses from the Browse tab

**Background Audio Feature (Guideline 2.5.4 - UIBackgroundModes audio):**
The app includes persistent audio playback for educational content. This is the core learning feature. To locate and test:

1. **Log in** with the test account (reviewer@ladybosslook.com)
2. **Tap "Audio" tab** in the bottom navigation bar
3. **Select any playlist** (e.g., "Financial Confidence", "Courageous Character", or "LBPodcast")
4. **Tap any audio track** to start playback
5. **Test background audio:**
   - Lock the device → Audio continues playing
   - Switch to another app → Audio continues playing
   - Use lock screen controls to pause/play, skip forward/back
6. **MiniPlayer:** While audio is playing, navigate within the app - the MiniPlayer appears at the top of the screen for persistent playback control

This background audio capability is essential for users to listen to educational audio courses and podcasts while multitasking, driving, or exercising - a core use case for our learning platform.

**What's New in Version 1.1.05:**
- NEW: Mood Check-in tool — a daily wellness feature accessible from the Home screen
- NEW: Urgent task reminders using Time-Sensitive notifications

**Mood Check-in Feature (Home → Mood emoji button):**
1. **Log in** with the test account
2. **Tap the mood emoji button** (🙂) in the top-right area of the Home screen header
3. **Select a mood level** — choose from 5 options: Great, Good, Okay, Not Great, or Bad
4. **Submit your mood** — a celebration sheet appears with an option to write a journal entry
5. **View mood history** — tap "History" to see a monthly calendar with daily mood emojis
6. The mood button on Home shows a red "+" badge when no mood is logged today, and a green "✓" after logging

**Time-Sensitive Notifications / Urgent Reminders (Guideline 2.5.4 - UIBackgroundModes):**
This app uses Time-Sensitive notifications (interruption-level: time-sensitive) for user-created task reminders marked as "Urgent." These notifications can bypass Focus and Do Not Disturb modes to ensure critical personal reminders are delivered on time.

To test:
1. **Log in** with the test account
2. **Go to Home → tap "+" to create a new task** (or tap any existing task to edit)
3. **Enable a reminder** and toggle **"Urgent"** ON — a confirmation dialog explains the alarm behavior
4. **Set a reminder time** a few minutes in the future
5. **Enable Focus/Do Not Disturb** on the device
6. **Wait for the reminder** — the notification should appear even in Focus mode

This feature is entirely user-initiated: users must explicitly create a task, enable a reminder, and toggle Urgent mode. It is never used for marketing or promotional content — only for personal task reminders the user has specifically configured to be time-sensitive.

Thank you for reviewing Simora - ladybosslook Academy!

---
