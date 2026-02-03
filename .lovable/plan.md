

## Plan: Unify Category System (Single Source of Truth)

### Problem Summary
Categories are currently defined in multiple places:
- **Database table** `routine_categories` (admin-managed)
- **Hardcoded** `CATEGORY_DISPLAY` mapping in code
- **Text fields** in `admin_task_bank.category` and `routines_bank.category`

When you change a category name in the admin panel, tasks and routines using the old slug don't update.

---

## Solution Overview

Create a single source of truth: **The `routine_categories` table** drives everything.

---

## Phase 1: Database Cleanup

**Fix the immediate issue:**
- Update `routines_bank` where `category = 'inner-strength'` to use `category = 'strength'`

---

## Phase 2: Refactor App Category Logic

**Current:** `useRoutineBankCategories()` pulls unique category slugs from `admin_task_bank` + `routines_bank`, then maps through hardcoded `CATEGORY_DISPLAY`

**New:** Fetch categories directly from `routine_categories` table (the same source admin uses)

```text
┌─────────────────────────────────────────┐
│         routine_categories              │
│  (slug, name, icon, color, is_active)   │
│              ▲                          │
│              │                          │
│   Single Source of Truth                │
│              │                          │
├──────────────┼──────────────────────────┤
│              │                          │
│   ┌──────────┴──────────┐               │
│   │                     │               │
│   ▼                     ▼               │
│ Admin UI            App UI              │
│ (RoutineManagement) (AppInspire)        │
│                                         │
└─────────────────────────────────────────┘
```

**Changes to `src/hooks/useRoutinesBank.tsx`:**
1. **Remove** the hardcoded `CATEGORY_DISPLAY` mapping entirely
2. **Rewrite** `useRoutineBankCategories()` to fetch from `routine_categories` table
3. Return categories with proper fields from database (slug, name, icon as emoji, color)

---

## Phase 3: Ensure Admin Updates Cascade

When a category slug changes in admin, tasks/routines using it should update.

**Option A (Recommended for now):** Add a database trigger that cascades slug updates
**Option B:** Add UI warning when editing categories that have associated content

For immediate fix, use database trigger:
```sql
CREATE OR REPLACE FUNCTION cascade_category_slug_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.slug IS DISTINCT FROM NEW.slug THEN
    UPDATE admin_task_bank SET category = NEW.slug WHERE category = OLD.slug;
    UPDATE routines_bank SET category = NEW.slug WHERE category = OLD.slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useRoutinesBank.tsx` | Remove `CATEGORY_DISPLAY`, rewrite `useRoutineBankCategories()` to fetch from `routine_categories` |
| Database migration | Fix remaining `inner-strength` → `strength` in `routines_bank`, add cascade trigger |

---

## Technical Details

### New `useRoutineBankCategories()` Implementation

```typescript
export function useRoutineBankCategories() {
  return useQuery({
    queryKey: ['routine-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_categories')
        .select('slug, name, icon, color, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Pro category goes last
      const sorted = (data || []).sort((a, b) => {
        if (a.slug === 'pro') return 1;
        if (b.slug === 'pro') return -1;
        return a.display_order - b.display_order;
      });

      return sorted.map(cat => ({
        slug: cat.slug,
        name: cat.name,
        icon: cat.icon || 'Sparkles',  // icon column stores emoji
        color: cat.color || 'purple',
        emoji: cat.icon,  // same as icon for FluentEmoji
      }));
    },
    staleTime: 1000 * 60 * 5,
  });
}
```

---

## Benefits After This Change

1. **One place to edit categories** - Admin → Tools → Routine Management
2. **Automatic updates** - Change a category slug, all tasks/routines update via trigger
3. **No code changes needed** - Add new categories in admin, they appear in app instantly
4. **Consistent emoji/icon** - Whatever you set in admin shows everywhere

