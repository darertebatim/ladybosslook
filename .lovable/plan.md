

## Enhance Small Count Goal Tap Animations

Currently, tapping +1 on a small count goal only shows a floating "+1" text. The plan is to trigger the same rich animation suite used for task completion, plus a goal number counter effect.

### Changes

**`src/components/app/TaskCard.tsx`**

In `handleOpenGoalInput`, when `isSmallCountGoal`:
1. **Trigger `isAnimating = true`** (same as completion) — this activates:
   - `animate-emoji-bounce` on the emoji icon (wave/bounce)
   - `animate-ripple-wave` on the text content (jelly effect)
2. **Add haptic `medium`** feedback instead of just `light`
3. **Animate the goal number changing** — wrap the goal progress number in a `motion.span` with a `key` tied to `goalProgress` so it animates on each increment (scale pop + color flash)
4. Keep the existing floating "+1" animation

**`src/components/app/TaskCard.tsx` — Goal label rendering (both regular and Pro sections)**

Replace the static goal progress number with an animated `motion.span`:
```
<motion.span
  key={goalProgress}
  initial={{ scale: 1.4, color: '#14b8a6' }}
  animate={{ scale: 1, color: 'inherit' }}
  transition={{ duration: 0.4, ease: 'easeOut' }}
>
  {goalProgress}
</motion.span>
```

This gives a "pop" effect on the changing number with a brief teal color highlight.

### Summary of effects on each tap:
- Floating "+1" rises and fades (existing)
- Emoji bounces/waves (reusing completion animation)
- Text does a ripple/jelly wave (reusing completion animation)
- Goal counter number pops and flashes teal
- Medium haptic feedback

