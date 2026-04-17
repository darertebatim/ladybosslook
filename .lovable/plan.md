

# Firebase Analytics Integration Plan

## Goal
Track every meaningful user action on iOS and Android to understand first-session behavior, retention drivers, and feature engagement. Data will appear in Firebase Console + can be exported to BigQuery / linked with Google Ads.

---

## Part 1: What I'll build (code side)

### 1. Install plugin
- `@capacitor-firebase/analytics` (works on iOS + Android, no-op on web)

### 2. Core wrapper (`src/lib/firebaseAnalytics.ts`)
A safe wrapper similar to `appsflyer.ts`:
- `initFirebaseAnalytics()` — called from `main.tsx`
- `logEvent(name, params)` — universal event logger
- `setUserId(userId)` — link events to your user
- `setUserProperty(key, value)` — set sticky attributes (e.g. `is_subscribed`, `language`, `age_group`)
- `logScreenView(screenName)` — for screen tracking

### 3. Auto screen tracking
Hook into React Router so every route change auto-fires `screen_view`. One file: `src/hooks/useFirebaseScreenTracking.ts`, mounted in `AppLayout`.

### 4. Event taxonomy (the actual events we'll fire)

**🎯 First Session / Activation (most critical for retention)**
| Event | Where | Why it matters |
|---|---|---|
| `app_first_open` | First launch ever | Cohort baseline |
| `onboarding_started` | `AppOnboarding.tsx` mount | Funnel top |
| `onboarding_step_viewed` | each step (with `step_id`, `step_index`) | Find drop-off step |
| `onboarding_answered` | `handleAnswer` | Engagement quality |
| `onboarding_completed` | last step | Activation rate |
| `onboarding_skipped` | Skip button | Friction signal |
| `signup_started` / `signup_completed` | Auth page | Conversion |
| `quiz_started` / `quiz_completed` | Self-care quiz | Activation #2 |

**🔁 Retention / Daily engagement**
| Event | Trigger |
|---|---|
| `app_open` | Every foreground (debounced 5min, reuses existing logic) |
| `routine_started` / `routine_completed` | Routine play |
| `task_created` / `task_completed` | Tasks |
| `mood_logged` | Mood check-in |
| `water_logged`, `period_logged` | Trackers |
| `meditation_played`, `audio_played` | Audio sessions |
| `streak_milestone` | 3, 7, 14, 30, 60, 100 days |
| `notification_opened` | Push tap |

**💰 Monetization**
| Event | Trigger |
|---|---|
| `paywall_viewed` (with `variant_id`, `source`) | Paywall mount |
| `paywall_dismissed` | Close |
| `trial_started` | RevenueCat success |
| `subscription_started` | Purchase complete (with revenue) |
| `subscription_cancelled` | Cancel flow |

**👤 User properties (sticky attributes)**
- `is_subscribed`, `subscription_plan`, `nickname`, `gender`, `age_group`, `language`, `signup_date`, `app_version`, `streak_days`

### 5. Integration points (existing files to touch)
- `src/main.tsx` → init
- `src/pages/app/AppOnboarding.tsx` → onboarding events
- `src/pages/Auth.tsx` → signup events
- `src/components/app/paywalls/*.tsx` → paywall events
- `src/components/app/DeferredLayoutHooks.tsx` → user properties + user_id
- `src/hooks/useSubscription.ts` → subscription user property
- Routine/task/mood/water/period pages → engagement events

---

## Part 2: What YOU need to do (step by step)

### Step 1 — Create Firebase project (5 min)
1. Go to https://console.firebase.google.com
2. Click **Add project** → name it `Rilo` (or reuse existing `gen-lang-client-0911896172` Gemini project — recommended since FCM already uses it)
3. Enable **Google Analytics** when prompted → choose/create a GA4 account

### Step 2 — Register your iOS app (5 min)
1. In Firebase Console → Project Settings → **Add app → iOS**
2. Bundle ID: `com.ladybosslook.academy` (or your iOS bundle — confirm in Xcode)
3. Download `GoogleService-Info.plist`
4. Send me the file → I'll tell you exactly where to drop it (`ios/App/App/`)

### Step 3 — Register your Android app (5 min)
1. Same Project Settings → **Add app → Android**
2. Package name: `com.ladybosslook.academy`
3. Download `google-services.json`
4. **You probably already have one** (used for FCM) — if so, replace it with the newly downloaded one (it now includes Analytics config). Place at `android/app/google-services.json`

### Step 4 — I implement the code
After you confirm Firebase project is created, I'll:
- Install `@capacitor-firebase/analytics`
- Build the wrapper + tracking hook
- Wire all events listed above
- Set user properties

### Step 5 — Sync & build (you run locally)
```bash
git pull
npm install
npx cap sync
npx cap run ios     # or android
```

### Step 6 — Verify in Firebase (within minutes)
1. Firebase Console → **Analytics → DebugView**
2. Open the app on your phone
3. Watch events stream in real-time
4. Production data appears in dashboards within 24h

### Step 7 — (Optional, recommended later)
- Link Firebase ↔ **Google Ads** for install campaign optimization
- Enable **BigQuery export** for raw event SQL access
- Build **Funnels** in GA4 (Onboarding → Signup → Subscription)
- Build **Retention reports** (Day 1 / 7 / 30)

---

## Notes
- **Web stays untouched** — plugin is no-op in browser. Web analytics already covered by your GA4 setup if any.
- **Privacy**: We will NOT log PII (emails, names in event params). User ID is the Supabase UUID only.
- **No conflict with AppsFlyer** — they serve different purposes (AppsFlyer = paid attribution, Firebase = behavior). Both can run together.
- **iOS ATT prompt**: Already handled by AppsFlyer init; Firebase will respect the same consent.

