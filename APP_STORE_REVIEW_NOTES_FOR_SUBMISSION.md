# App Review Notes - Copy & Paste into App Store Connect

---

## For Reviewers:

**App Overview:**
LadyBoss Academy is an educational platform offering courses, audio content, and coaching programs for women's personal and professional development.

**Test Accounts:**

**Account 1 - Pre-Purchased Content (To View Features):**
- Email: reviewer@ladybossacademy.com
- Password: ReviewTest2025!
- Purpose: This account has all products already purchased. Use it to explore course content, audio playlists, and features without making purchases.

**Account 2 - For Testing In-App Purchases:**
- Email: reviewer2@ladybosslook.com
- Password: ReviewAccess2025!
- Purpose: This account has NO purchased products. Use it to test the in-app purchase flow in the Store tab.

**Key Features to Test:**

**With Account 1 (reviewer@ladybossacademy.com - Pre-purchased):**
1. **Sign in** → Access dashboard with enrolled courses
2. **Courses tab** → View purchased courses: "Bilingual Power Class" and "Courageous Character Course"
3. **Audio Player tab** → Browse and play audio playlists (supports background playback)
4. **Profile** → View user info, enrolled courses, and logout

**With Account 2 (reviewer2@ladybosslook.com - For IAP Testing):**
1. **Sign in** → Access dashboard (no enrolled courses)
2. **Store tab** → View all 3 available in-app purchase products
3. **Test Purchase Flow** → Select any product to see StoreKit purchase sheet (use App Store sandbox for testing)

**Content Language:**
All programs are taught in English. Do not mention any other languages or specific ethnic targeting in program descriptions to avoid review complications.

**External Services:**
- **Telegram (@ladybosslook)**: Student support communication (user-initiated only)
- **Google Meet links**: Live webinar sessions included with course enrollment
- **Calendar downloads**: ICS files for adding course events to user's calendar

**In-App Purchases:**
Three IAPs available via RevenueCat + StoreKit:
1. **Bilingual Power Class** - $1.00 (iOS: com.ladybosslook.bilingual_power)
2. **Courageous Character Course** - $97.00 (iOS: com.ladybosslook.courageous_character)
3. **Ready to Empowered Audiobook** - $9.99 (iOS: com.ladybosslook.ready_to_empowered_eng)

**Where to Find IAPs:**
- Navigate to **Store tab** (bottom navigation)
- All 3 products are visible with "Purchase" buttons
- Tapping purchase opens the native iOS StoreKit purchase sheet
- After purchase, products appear in the "Courses" tab

**Testing Notes:**
- Account 1 (reviewer@ladybossacademy.com) already has products - use for content review
- Account 2 (reviewer2@ladybosslook.com) has no products - use for IAP flow testing
- StoreKit integration via RevenueCat handles all purchase validation server-side

**Permissions:**
- Push Notifications: Course updates and announcements (user must opt-in)
- Calendar Access: Only when user explicitly taps "Add to Calendar"

**Privacy:**
- User data stored securely via Supabase
- No third-party data sharing except RevenueCat (purchase validation)
- Privacy Policy: https://ladybosslook.lovable.app/privacy

**Support:** support@ladybosslook.com

Thank you for reviewing LadyBoss Academy!

---
