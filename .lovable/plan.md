
# Fix Support Chat Design - Clean Black & White Theme

## Issues Found
1. **Gradient card** has grey/purple tones instead of clean white
2. **Avatar circle** is grey with gradient
3. **Conversation starters** have colored backgrounds (rose, emerald, amber) 
4. **Header** uses purple `#F4ECFE` instead of white

## The Fix

### 1. Header - Clean White
Replace purple background with clean white:
```tsx
// Before: bg-[#F4ECFE]/80
// After: bg-background/95
```

### 2. Welcome Card - Remove Grey Gradient
Replace the gradient card with a clean white card with subtle border:
```tsx
// Before: bg-gradient-to-br from-primary/10 via-primary/5 to-transparent
// After: bg-card border border-border/50
```

### 3. Avatar - Clean White Circle
Replace grey gradient with clean white:
```tsx
// Before: bg-gradient-to-br from-primary/30 to-primary/10
// After: bg-muted border border-border
```

### 4. Conversation Starters - Uniform Clean Style
Remove colored gradients, use clean monochrome design:
```tsx
// Before: starter.color with different gradients per card
// After: bg-muted/50 hover:bg-muted for all cards
```

### 5. Remove Header Icon Gradient
Clean up the header icon styling to match.

---

## Files to Modify
- `src/pages/app/AppChat.tsx`

## Result
A clean, minimal black & white design that aligns with the app theme - warm in copy, clean in visuals.
