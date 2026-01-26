
# Fix Haptic Feedback Conflicts - Complete Migration

## Problem Found

6 files still use **direct Capacitor Haptics calls** instead of the centralized `haptic` utility. These direct calls with `await` can cause the `TO JS undefined` error you're seeing.

## Files to Update

### 1. TaskDetailModal.tsx
**Replace:**
```tsx
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
```
**With:**
```tsx
import { haptic } from '@/lib/haptics';
```

**Replace all `await Haptics.impact()` calls with `haptic.light()` or `haptic.medium()`**

### 2. ProgramEventCard.tsx
- Replace 3 instances of `await Haptics.impact({ style: ImpactStyle.Light })`
- Use `haptic.light()` instead

### 3. SortableTaskList.tsx
- Replace drag start: `await Haptics.impact({ style: ImpactStyle.Medium })` → `haptic.medium()`
- Replace drop: `await Haptics.impact({ style: ImpactStyle.Light })` → `haptic.light()`

### 4. ChatInput.tsx
- Replace `Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})` → `haptic.light()`

### 5. FeedReplyInput.tsx
- Replace `Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})` → `haptic.light()`

### 6. TrackCompletionCelebration.tsx
- Replace `Haptics.notification({ type: NotificationType.Success }).catch(() => {})` → `haptic.success()`

## Why This Fixes the Error

The `TO JS undefined` error happens when:
1. `await Haptics.impact()` is called
2. The native bridge returns `undefined` 
3. The `await` tries to resolve `undefined`

The `haptic` utility:
- Uses **synchronous calls** (no `await`)
- Has built-in `.catch(() => {})` for every call
- Already checks `Capacitor.isNativePlatform()`

## Summary

| File | Current | Fixed |
|------|---------|-------|
| TaskDetailModal.tsx | 3 direct calls | `haptic.light()`, `haptic.medium()` |
| ProgramEventCard.tsx | 3 direct calls | `haptic.light()` |
| SortableTaskList.tsx | 2 direct calls | `haptic.medium()`, `haptic.light()` |
| ChatInput.tsx | 1 direct call | `haptic.light()` |
| FeedReplyInput.tsx | 1 direct call | `haptic.light()` |
| TrackCompletionCelebration.tsx | 1 direct call | `haptic.success()` |

After this fix, **all haptic calls will go through the centralized utility** with proper error handling.
