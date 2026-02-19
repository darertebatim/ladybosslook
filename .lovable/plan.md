
## Fixing the Hand Hint & Button Layout

### Issues Identified

**Bug 1 — Button shifted up / misplaced:**
The sticky footer div at line 486 has `relative` class added alongside `fixed`, which breaks the fixed positioning. The `relative` class was incorrectly added there (likely when the hand hint was added with `absolute` positioning inside it). This causes the entire footer to shift up unexpectedly.

**Bug 2 — Hand hint problems (5 issues):**
1. **Wrong position**: The hint uses `absolute inset-0` filling the whole footer, but needs to be positioned relative to only the button, offset to the right side and above it
2. **Pointing straight up**: The hand 👆 points upward but should point downward (toward the button below it) — use 👇 or flip the emoji
3. **Native emoji, not 3D**: Using plain text `👆` emoji instead of the `FluentEmoji` 3D component
4. **Centered on button**: Currently centered horizontally — should be offset to the right side of the button
5. **Too small**: `text-4xl` (~36px) — needs to be ~6x bigger (~216px), so around 180-220px size

### Fix Plan

**File 1: `src/components/app/AddToRitualHandHint.tsx`**

Rewrite the component to:
- Use `FluentEmoji` component with the 👇 emoji (pointing down toward button) at size `180`
- Position it as a floating element using `fixed` positioning anchored above the button area, offset to the right-center of the button
- Add a drop-shadow filter for visibility
- Update animation to bounce downward (toward the button) instead of upward
- Keep the hook logic unchanged

```tsx
// New layout concept:
// Fixed position above the sticky footer, shifted right of center
<div
  className="pointer-events-none fixed z-50"
  style={{
    bottom: 'calc(env(safe-area-inset-bottom) + 100px)', // above the button
    right: '30%', // offset to right side
  }}
>
  <FluentEmoji emoji="👇" size={180} />  {/* 3D emoji, ~6x bigger */}
</div>
```

**File 2: `src/pages/app/AppInspireDetail.tsx`**

Fix the sticky footer at line 486:
- Remove the erroneous `relative` class from the `fixed` footer div
- Move `<AddToRitualHandHint>` outside the footer div entirely (rendered as a sibling), so it can use `fixed` positioning freely without being clipped by the footer's paint layer

```tsx
{/* Hand hint rendered OUTSIDE the sticky footer */}
<AddToRitualHandHint show={showHint && !isAdded} />

{/* Sticky Add Button — no 'relative' class */}
<div
  className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border"
  style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 72px)' }}
>
  <AddedToRoutineButton ... />
</div>
```

### Summary of All Changes

| File | Change |
|------|--------|
| `AddToRitualHandHint.tsx` | Use `FluentEmoji` 3D at size 180, fixed position above-right of button, downward-pointing animation |
| `AppInspireDetail.tsx` | Remove `relative` from fixed footer (fixes button shift), move hint outside footer div |
