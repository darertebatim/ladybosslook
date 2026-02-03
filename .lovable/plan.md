

# Fluent Emoji 3D Integration Plan

## Overview

Replace all native emojis with Microsoft Fluent Emoji 3D style throughout the app, giving it a premium "Me+" aesthetic. This involves creating a reusable component that fetches 3D emoji images from a CDN and updating all existing emoji usage.

---

## Technical Approach

### CDN Source
Use the **lobehub CDN** which hosts Microsoft Fluent Emoji assets:
- **3D Style URL Pattern**: `https://registry.npmmirror.com/@lobehub/fluent-emoji-3d/latest/files/assets/{unicode}.webp`
- Example: For 🤯 (unicode `1f92f`) → `https://registry.npmmirror.com/@lobehub/fluent-emoji-3d/latest/files/assets/1f92f.webp`

### Conversion Logic
Convert emoji characters to their unicode hex codes:
```text
☀️ (sun) → "2600" or "2600-fe0f"
💧 (droplet) → "1f4a7"
🎯 (target) → "1f3af"
```

---

## Implementation Steps

### Step 1: Create FluentEmoji Component
Create a new reusable component at `src/components/ui/FluentEmoji.tsx`:

- Accept `emoji` (string - native emoji character) and `size` (number) props
- Convert emoji to unicode hex code
- Render as an `<img>` tag fetching from CDN
- Include loading state (optional blur/skeleton)
- Fallback to native emoji if image fails to load

```text
Example usage:
<FluentEmoji emoji="☀️" size={32} />
```

### Step 2: Create Emoji-to-Unicode Utility
Add a helper function in `src/lib/fluentEmoji.ts`:

- `emojiToUnicode(emoji: string): string` - converts emoji to hex codes
- Handle compound emojis (like 👨‍👩‍👧 which have multiple codepoints joined by ZWJ)
- Handle variation selectors (fe0f)

### Step 3: Update EmojiPicker Component
Modify `src/components/app/EmojiPicker.tsx`:

- Replace native emoji text with `<FluentEmoji>` component in the grid
- Show 3D previews when selecting emojis
- Keep selection value as native emoji character (for database storage compatibility)

### Step 4: Update TaskIcon Component  
Modify `src/components/app/IconPicker.tsx`:

- Update `TaskIcon` to use `FluentEmoji` when rendering emojis
- Keep fallback to Lucide icons for legacy icon names

### Step 5: Update Task Bank in Database
Create a script/migration to update `admin_task_bank` table:
- Emojis remain stored as native characters (no DB change needed)
- The rendering layer handles converting to 3D visually

### Step 6: Update All Emoji Display Locations

The following components render emojis and need updates:

| Component | Current Rendering | Change |
|-----------|-------------------|--------|
| `TaskCard.tsx` | `<TaskIcon>` | Already uses TaskIcon - will auto-update |
| `TaskDetailModal.tsx` | `<TaskIcon>` | Already uses TaskIcon - will auto-update |
| `TaskQuickStartSheet.tsx` | `{template.emoji}` text | Use `<FluentEmoji>` |
| `TaskTemplateCard.tsx` | `{template.emoji}` text | Use `<FluentEmoji>` |
| `RoutineBankCard.tsx` | `{routineEmoji}` text | Use `<FluentEmoji>` |
| `RoutinePlanCard.tsx` | `{planEmoji}` text | Use `<FluentEmoji>` |
| `AppTaskCreate.tsx` | `<TaskIcon>` + emoji picker | Already uses TaskIcon |
| `RoutinesBank.tsx` (admin) | `<TaskIcon>` | Already uses TaskIcon |

---

## Data Flow

```text
Database (stores native emoji: "☀️")
       ↓
Component receives emoji prop
       ↓
FluentEmoji component
       ↓
emojiToUnicode("☀️") → "2600"
       ↓
Fetch: registry.npmmirror.com/...3d/.../2600.webp
       ↓
Render <img> with 3D emoji
       ↓
Fallback to native "☀️" if load fails
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/fluentEmoji.ts` | Emoji-to-unicode conversion utility |
| `src/components/ui/FluentEmoji.tsx` | Reusable 3D emoji component |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/app/IconPicker.tsx` | Update `TaskIcon` to use `FluentEmoji` |
| `src/components/app/EmojiPicker.tsx` | Show 3D previews in picker grid |
| `src/components/app/TaskQuickStartSheet.tsx` | Use `FluentEmoji` for template display |
| `src/components/app/TaskTemplateCard.tsx` | Use `FluentEmoji` for emoji display |
| `src/components/app/RoutineBankCard.tsx` | Use `FluentEmoji` for routine emoji |
| `src/components/app/RoutinePlanCard.tsx` | Use `FluentEmoji` for plan emoji |

---

## Performance Considerations

1. **Lazy Loading**: Use `loading="lazy"` on images
2. **Caching**: Browser will cache CDN images automatically
3. **Size Optimization**: WebP format is already optimized (~10-50KB per emoji)
4. **Fallback**: Native emoji shown instantly if CDN is slow/fails

---

## No Database Changes Required

Emojis continue to be stored as native characters (e.g., "☀️"). Only the display layer changes to fetch 3D images from CDN.

