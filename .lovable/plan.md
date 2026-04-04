

## Redesign Read: Unified List, Color Palette, Emoji Covers

### What Changes

**1. Remove Stories/Lessons tabs** -- merge into one unified list in both admin and app, differentiated by category instead of type.

**2. Add `emoji` column to `reading_content`** -- for 3D Fluent emoji covers (like feed channels and routines).

**3. Use task color palette for theme colors** -- replace the free-form color picker with the same pastel palette used in tasks/routines:
```
pink: #FFD6E8, peach: #FFE4C4, yellow: #FFF59D, lime: #E8F5A3,
sky: #C5E8FA, mint: #B8F5E4, lavender: #E8D4F8
```

**4. Cover system: emoji OR image upload** -- same pattern as FeedChannelManager (None/Emoji/Image toggle), using existing `EmojiPicker` and `ImageUploader` components.

**5. Redesign all UI** -- make it visually rich and consistent with the rest of the app.

### Database Migration

```sql
ALTER TABLE reading_content ADD COLUMN emoji text DEFAULT '📖';
```

### Admin (`ReadingManager.tsx`) -- Redesign

- Remove Stories/Lessons tabs -- show all content in one list
- Replace plain `<Table>` with styled cards showing color + emoji/cover preview
- Content form gets:
  - Color palette swatches (clickable circles, same as task colors)
  - Cover type toggle: Emoji (with `EmojiPicker` sheet) or Image (with `ImageUploader` to `reading-covers` bucket)
  - Type dropdown stays (story/lesson) but just as metadata, not a filter tab
- "New Content" button instead of "New Story" / "New Lesson"

### App Library (`AppRead.tsx`) -- Redesign

- Remove Stories/Lessons pill tabs
- Single vertical list of all published content
- Each card: full-width rounded card with `theme_color` background, large 3D `FluentEmoji` (or cover image), title, subtitle, reading time badge, category chip, completion checkmark
- Visually similar to routine/tool cards in the app

### App Detail (`AppReadDetail.tsx`) -- Redesign

- Hero area uses theme_color background with large centered FluentEmoji or cover image
- Gradient overlay with title and author
- Polished info card below with description, reading time, category badge
- Prominent CTA button

### App Reader (`AppReadReader.tsx`) -- Minor Polish

- Keep current layout (already clean)
- Use `theme_color` in progress bar accent

### Files Modified

| File | Change |
|------|--------|
| Migration SQL | Add `emoji` column |
| `src/hooks/useReading.ts` | Add `emoji` to `ReadingContent` interface |
| `src/pages/admin/ReadingManager.tsx` | Remove tabs, add color palette + emoji/image cover picker, card-based list |
| `src/pages/app/AppRead.tsx` | Remove tabs, unified list with FluentEmoji covers + pastel cards |
| `src/pages/app/AppReadDetail.tsx` | Redesign hero with emoji/color, polish layout |
| `src/pages/app/AppReadReader.tsx` | Minor: theme color accent on progress bar |

### Reused Components
- `EmojiPicker` (3D emoji selection sheet)
- `FluentEmoji` (3D emoji rendering)
- `ImageUploader` (file upload to Supabase Storage)

