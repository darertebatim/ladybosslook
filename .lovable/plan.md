
# New Action Sheet Redesign

## Overview
Redesigning the TaskQuickStartSheet to be more compact, modern, and feature-rich — inspired by Finch's category tabs and Me+'s "Spin your lucky task" feature.

---

## Issues to Fix

1. **Too much empty space** at top and sides
2. **Old action card design** — needs to match the simpler inline style (emoji + title + category)
3. **No category filters** — Finch shows categories at the bottom
4. **No "Random Action" button** — Me+ has "Spin your lucky task"
5. **No navigation to rituals page** — users should be able to browse more

---

## Proposed Design

### Layout Structure

```
┌────────────────────────────────────┐
│            [drag handle]            │
│               × close               │
│                                     │
│  [─────── Title input ───────]     │  ← Compact, inline title input
│                                     │
│  ┌─────────────┬─────────────────┐ │  ← Two quick action buttons
│  │ 🎲 Random   │ 📖 Browse All   │ │
│  └─────────────┴─────────────────┘ │
│                                     │
│  Suggestions                        │  ← Section header
│  ┌──────────────────────────────┐  │
│  │ 🏆 Find new Action... Easy Win│  │  ← Simpler action cards (no bg colors)
│  │ 💕 Compliment someone  Connect│  │
│  │ 💪 Do the "dreaded"... Strength│  │
│  └──────────────────────────────┘  │
│                                     │
│ ┌───────┬──────┬───────┬────────┐  │  ← Category pills at bottom
│ │Popular│ Calm │Connect│Strength│  │
│ └───────┴──────┴───────┴────────┘  │
│                                     │
└────────────────────────────────────┘
```

### Key Changes

**1. Reduce Spacing**
- Smaller top padding (pt-2 → pt-1)
- Compact header without title (use drag handle only)
- Smaller input container padding

**2. Modern Action Cards**
- Clean white cards with subtle border
- Emoji + Title + Category in a single row
- No colorful backgrounds — monochrome design
- Right-aligned "+" button

**3. Quick Action Buttons (2 buttons in a row)**
- **Random Action**: Pick a random template and auto-add
- **Browse All**: Navigate to `/app/inspire` (rituals discovery page)

**4. Category Pill Filters (at bottom)**
- Horizontal scrollable row of category pills
- Popular (default), Calm, Connection, Strength, etc.
- Fetched from `routine_categories` table
- Filtering updates the suggestions list

**5. Additional Idea: Greeting**
- Optional: Show a gentle prompt like "What would feel good right now?" instead of "Need some idea?"

---

## Technical Implementation

### File to Modify
- `src/components/app/TaskQuickStartSheet.tsx`

### New Features

**1. Category Filter State**
```tsx
const [selectedCategory, setSelectedCategory] = useState<string>('popular');
const { data: categories } = useRoutineBankCategories();
```

**2. Random Action Handler**
```tsx
const handleRandomAction = () => {
  const randomIndex = Math.floor(Math.random() * templates.length);
  const randomTemplate = templates[randomIndex];
  if (randomTemplate) {
    handleTemplateSelect(randomTemplate);
    haptic.success();
  }
};
```

**3. Filter by Category**
```tsx
const filteredSuggestions = useMemo(() => {
  let items = templates;
  if (selectedCategory === 'popular') {
    items = templates.filter(t => t.is_popular);
  } else {
    items = templates.filter(t => t.category === selectedCategory);
  }
  // Apply search filter if exists
  if (taskName.trim()) {
    items = items.filter(t => 
      t.title.toLowerCase().includes(taskName.toLowerCase())
    );
  }
  return items.slice(0, 8);
}, [templates, selectedCategory, taskName]);
```

**4. Simplified Action Card Design**
```tsx
<button className="flex items-center gap-3 w-full p-3 bg-white border border-border/50 rounded-xl">
  <FluentEmoji emoji={template.emoji} size={24} />
  <div className="flex-1 min-w-0">
    <p className="text-[15px] text-foreground truncate">{template.title}</p>
  </div>
  <span className="text-xs text-muted-foreground">{template.category}</span>
  <Plus className="w-4 h-4 text-muted-foreground" />
</button>
```

**5. Category Pills**
```tsx
<ScrollArea className="w-full">
  <div className="flex gap-2 px-4 pb-4">
    <button 
      className={cn("px-3 py-1.5 rounded-full text-sm", 
        selectedCategory === 'popular' ? "bg-foreground text-background" : "bg-muted"
      )}
      onClick={() => setSelectedCategory('popular')}
    >
      Popular
    </button>
    {categories?.map(cat => (
      <button key={cat.slug} ...>{cat.name}</button>
    ))}
  </div>
  <ScrollBar orientation="horizontal" />
</ScrollArea>
```

---

## Visual Comparison

| Before | After |
|--------|-------|
| Large empty header | Compact drag handle + close |
| No filtering | Category pills at bottom |
| No random button | Random + Browse All buttons |
| Colored card backgrounds | Clean white cards with border |
| Lots of padding | Tight, efficient spacing |

---

## Dependencies
- `useRoutineBankCategories` hook (already exists)
- `haptic` utility for feedback
- `useNavigate` for Browse All navigation

---

## Result
A compact, modern "New Action" sheet that:
- Feels faster and more efficient
- Gives users inspiration with categories and random picks
- Maintains the Simora warm-but-clean aesthetic
- Connects to the full rituals discovery page
