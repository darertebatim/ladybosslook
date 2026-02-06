

## Plan: Add App Store Review Prompt + Remove Debugging Leftovers

### Overview
This plan addresses two requests:
1. **Add App Store Review functionality** - Implement an in-app review prompt using a Capacitor plugin that triggers the native iOS App Store rating dialog
2. **Remove debugging leftovers** - Clean up fallback loading/error displays in `index.html` that were added during v1.1.07 blackness debugging

---

### Part 1: App Store Review Implementation

**Approach**: Use `@capacitor-community/in-app-review` plugin - this is the community-maintained standard for Capacitor 5+ and works seamlessly on iOS.

#### Files to Create/Modify:

**1. Install the plugin** (dependency)
- Add `@capacitor-community/in-app-review` to package.json

**2. Create `src/lib/appReview.ts`** (new file)
```text
- Helper functions to trigger the review prompt
- Safety checks for native platform
- Rate limiting (only prompt once per 30 days)
- Error handling with try-catch
```

**3. Create a custom hook `src/hooks/useAppReview.tsx`** (new file)
```text
- Determines when to show review prompt
- Triggers after meaningful user actions (e.g., 5th streak celebration, course completion)
- Tracks last review prompt date in localStorage
```

**4. Update `src/components/app/StreakCelebration.tsx`**
```text
- Add review trigger after user reaches certain milestones (e.g., 5-day streak)
- Call the review prompt after celebration modal closes
```

**5. Update `src/components/app/CompletionCelebration.tsx`**
```text
- Optionally trigger review after course completion
```

**6. Add test button to `src/pages/admin/AppTest.tsx`**
```text
- Add "Request App Review" button for testing
```

#### Review Trigger Strategy:
- Trigger after 5th streak (first meaningful engagement)
- Trigger after completing a program/course
- Maximum once per 30 days (iOS limits to 3 per year anyway)
- Only on native iOS platform

---

### Part 2: Remove Debugging Leftovers

**File: `index.html`**

Remove these debugging elements (lines 71-103):
- `#loading-fallback` div with "Loading Simora..." message
- `#error-display` div for native error display  
- `#debug-info` element
- The script that hides the loading fallback

These were added during v1.1.07 debugging but are no longer needed since:
- The app loads correctly now
- React has its own loading states via Suspense/PageLoader
- The `window.onerror` handler in `main.tsx` already captures errors

**File: `src/main.tsx`**

Remove or simplify:
- The `window.onerror` handler that writes to `#error-display` (which will be removed)

---

### Technical Details

**In-App Review Plugin Usage:**
```typescript
import { InAppReview } from '@capacitor-community/in-app-review';

export async function requestAppReview(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  
  try {
    await InAppReview.requestReview();
    console.log('[Review] Review requested successfully');
  } catch (error) {
    console.error('[Review] Error requesting review:', error);
  }
}
```

**iOS Limitations to Note:**
- iOS limits to 3 review prompts per 365 days per user
- iOS decides whether to actually show the dialog (not guaranteed)
- Cannot be triggered in response to button tap (must feel natural)
- In development, dialog always shows but reviews can't be submitted

---

### Summary of Changes

| File | Action |
|------|--------|
| `package.json` | Add `@capacitor-community/in-app-review` |
| `src/lib/appReview.ts` | Create - review helper functions |
| `src/hooks/useAppReview.tsx` | Create - review trigger logic |
| `src/components/app/StreakCelebration.tsx` | Modify - add review trigger |
| `src/pages/admin/AppTest.tsx` | Modify - add test button |
| `index.html` | Remove debugging fallback elements |
| `src/main.tsx` | Simplify error handler |

After implementation, run `npx cap sync` to sync the new plugin with the native iOS project.

