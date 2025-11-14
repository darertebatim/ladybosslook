# App Store Review Notes - LadyBoss Academy

## App Overview
LadyBoss Academy is an educational platform offering courses, audio content, and coaching programs for women's empowerment, business development, and personal growth.

## Test Account Credentials
**Email:** reviewer@ladybossacademy.com  
**Password:** ReviewTest2025!

*Note: This test account has full access to all courses and features for review purposes.*

## Key Features to Test

### 1. Authentication & User Management
- Sign up / Sign in with email
- Password reset functionality
- Profile management
- User logout

### 2. Course Access
- Browse available courses
- View course details (video, supplements, schedules)
- Access enrolled courses
- Download course materials (PDFs, workbooks)
- Calendar integration for live sessions

### 3. Audio Player
- Browse audio playlists
- Play/pause audio tracks
- Background audio playback
- Mini player controls
- Progress tracking

### 4. Live Sessions
- View upcoming webinar schedules
- Add events to calendar (ICS file download)
- Join live sessions via Google Meet links
- Telegram support activation

### 5. In-App Purchases (iOS)
- Course enrollment via RevenueCat
- Restore purchases functionality
- Receipt validation
- Price display in user's local currency

### 6. Notifications
- Push notifications for announcements
- Course updates and reminders
- Support messages

## Testing Flow

1. **Launch app** → You'll see the home screen with featured courses
2. **Sign in** using test credentials above
3. **Navigate to Courses tab** → View "Bilingual Power Class" or "Courageous Character Course"
4. **Tap a course** → View course details, video content, and quick actions
5. **Test audio player** → Go to Player tab, select any playlist
6. **Check supplements** → Tap "Listen to Supplements" to view PDFs
7. **Test calendar** → Tap "Add to Calendar" to download ICS file
8. **Profile section** → View user profile, enrolled courses, logout

## Important Notes for Reviewers

**Content Language:** Most content is in English and Farsi (Persian) as the app serves bilingual audiences.

**External Links:** 
- Telegram support (@ladybosslook) - Used for student support communication
- Google Meet links - For live webinar sessions
- Calendar downloads - ICS files for event scheduling

**Permissions Required:**
- Notifications - For course updates and announcements
- Calendar access - To add course events (user-initiated only)

**Paid Features:**
All courses can be purchased via In-App Purchase. The test account has access to all content without payment for review purposes.

**No Sign-up Required Features:**
- Browse course catalog
- View course descriptions
- Access to marketing/landing pages

## RevenueCat Integration
We use RevenueCat for IAP management. All purchases are validated server-side through our Supabase backend.

## Privacy & Data
- User data is stored securely in Supabase
- No data is shared with third parties except:
  - RevenueCat (purchase validation only)
  - Telegram (user-initiated support only)
- Full privacy policy: https://ladybosslook.lovable.app/privacy

## Support During Review
For any questions or issues during review, please use the test account to access support features or contact: support@ladybosslook.com

---

**App Version:** 1.0.0  
**Minimum iOS:** 13.0  
**Category:** Education  
**Content Rating:** 4+

Thank you for reviewing our app!
