

## Plan: App Store Review Request System

### Goal
Implement a smart in-app review system that prompts happy, engaged users to leave a 5-star review on the App Store at the right moment.

---

## Strategy Overview

The key to getting 5-star reviews is asking the **right users** at the **right time**:

1. **Right Users** - Only ask users who are clearly satisfied (just completed something, have a streak, etc.)
2. **Right Time** - Ask after a "delight moment" when users feel accomplished
3. **Smart Gating** - Pre-screen with an in-app rating before triggering the native prompt

---

## The Flow

```
User completes a positive action
         ↓
Check if eligible (not asked recently, engaged enough)
         ↓
Show in-app "How are you enjoying the app?" prompt
         ↓
If 4-5 stars → Trigger native App Store review prompt
If 1-3 stars → Show feedback form (capture issues privately)
```

---

## Trigger Points (Best Moments to Ask)

Based on your existing celebration moments:

| Trigger | Why It Works | File |
|---------|--------------|------|
| **Track/Playlist Completed** | User just accomplished learning | `TrackCompletionCelebration.tsx` |
| **Streak Milestone** (3, 7, 14, 30 days) | User is deeply engaged | `StreakCelebration.tsx` |
| **Course Round Completed** | Major accomplishment | `CompletionCelebration.tsx` |
| **First Journal Entry** | Invested in the app | Journal flow |
| **5th Breathing Session** | Regular wellness user | Breathing flow |

---

## Technical Implementation

### Phase 1: Install Capacitor App Review Plugin

```bash
npm install @capawesome/capacitor-app-review
npx cap sync
```

This provides native iOS `SKStoreReviewController` integration (Apple's official review prompt).

### Phase 2: Create Review Request System

**New Files:**

| File | Purpose |
|------|---------|
| `src/lib/appReview.ts` | Core logic: eligibility checks, tracking, native prompt |
| `src/hooks/useAppReview.tsx` | React hook with trigger functions |
| `src/components/app/AppReviewPrompt.tsx` | Pre-screen UI with star rating |
| `src/components/app/FeedbackSheet.tsx` | Capture negative feedback privately |

**Database Table:**

```sql
CREATE TABLE app_review_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  event_type TEXT NOT NULL, -- 'prompted', 'rated_in_app', 'native_shown', 'feedback_given'
  in_app_rating INTEGER, -- 1-5 if rated
  feedback TEXT, -- If user gave feedback
  trigger_source TEXT, -- 'track_complete', 'streak', 'course_complete', etc.
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Phase 3: Eligibility Rules

Only show prompt if user meets ALL criteria:

1. **On Native iOS** - Only works on real iOS app
2. **Not Asked Recently** - At least 30 days since last prompt
3. **Engaged Enough** - Has completed at least 3 audio tracks OR has 3+ day streak
4. **Not Already Reviewed** - Track if native prompt was shown (Apple limits to 3x/year)
5. **After Delight Moment** - Triggered by celebration event

### Phase 4: The Pre-Screen UI

A friendly bottom sheet appears after a celebration:

```
┌────────────────────────────────────────┐
│                                        │
│    ✨ Enjoying Simora?                 │
│                                        │
│    Your feedback helps us improve!     │
│                                        │
│         ⭐ ⭐ ⭐ ⭐ ⭐                    │
│      (existing StarRating component)   │
│                                        │
│    [  Maybe Later  ]  [  Rate Now  ]   │
│                                        │
└────────────────────────────────────────┘
```

- **5 stars** → "Thank you! Would you mind rating us on the App Store?" → Triggers native prompt
- **4 stars** → Same as 5 stars
- **1-3 stars** → "We're sorry to hear that. What can we do better?" → Opens feedback form

### Phase 5: Integrate with Celebration Components

Modify existing celebrations to optionally trigger review prompt:

**Example: TrackCompletionCelebration.tsx**
```tsx
// After showing celebration, check if we should ask for review
useEffect(() => {
  if (isPlaylistComplete) {
    checkAndPromptReview('playlist_complete');
  }
}, [isPlaylistComplete]);
```

**Example: StreakCelebration.tsx**
```tsx
// On milestone streaks
useEffect(() => {
  if ([3, 7, 14, 30].includes(currentStreak)) {
    checkAndPromptReview('streak_milestone');
  }
}, [currentStreak]);
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/lib/appReview.ts` | **Create** - Core review logic |
| `src/hooks/useAppReview.tsx` | **Create** - React hook |
| `src/components/app/AppReviewPrompt.tsx` | **Create** - Pre-screen UI |
| `src/components/app/FeedbackSheet.tsx` | **Create** - Capture negative feedback |
| `src/components/audio/TrackCompletionCelebration.tsx` | **Modify** - Add review trigger |
| `src/components/app/StreakCelebration.tsx` | **Modify** - Add review trigger |
| `src/components/app/CompletionCelebration.tsx` | **Modify** - Add review trigger |
| Database migration | **Create** - `app_review_events` table |

---

## Apple Guidelines Compliance

Apple has strict rules for `SKStoreReviewController`:

1. **Max 3 prompts per 365 days** - The system enforces this automatically
2. **No custom UI before native prompt** - We pre-screen with in-app rating first
3. **Cannot guarantee prompt shows** - Apple may suppress it (our code handles this gracefully)
4. **No incentives** - We never offer rewards for reviews

---

## Admin Visibility

Add to Admin → System page:

- Count of users prompted
- Average in-app rating given
- Feedback submissions (view negative feedback)

---

## Expected Results

Based on industry data:
- **Pre-screening increases positive reviews by 300-400%**
- Users who rate 5 stars in-app almost always leave 5 stars on App Store
- Capturing 1-3 star feedback privately prevents negative public reviews

