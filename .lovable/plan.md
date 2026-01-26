
# Change Header Star to Red

## Change

Update the star icon color next to "Today" in the Home header from orange to red.

## File to Modify

| File | Change |
|------|--------|
| `src/pages/app/AppHome.tsx` | Line 249: Change `text-orange-500 fill-orange-500` to `text-red-500 fill-red-500` |

## Code Change

```tsx
// Before
<Star className="h-3 w-3 text-orange-500 fill-orange-500" />

// After  
<Star className="h-3 w-3 text-red-500 fill-red-500" />
```
