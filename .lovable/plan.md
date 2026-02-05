
# Welcome Popup Ritual Feature

## Summary
Transform the current WelcomeRitualCard from an inline banner into a true popup/overlay that appears on top of the home screen content. Also make the ritual selection dynamic via admin panel instead of hardcoded.

## Current Issues
1. The card appears inline with page content, not as an overlay on top
2. Title/subtitle are hardcoded ("Your day is open", "Tap to pick your first actions")
3. The welcome ritual ID is hardcoded in the component
4. No admin UI to select which ritual appears as the welcome popup

## Implementation Plan

### 1. Database Change: Add Welcome Ritual Flag
Add a new column `is_welcome_popup` to the `routines_bank` table to mark which ritual should be used as the welcome popup (only one can be active at a time).

```sql
ALTER TABLE routines_bank 
ADD COLUMN is_welcome_popup boolean DEFAULT false;

-- Add trigger to ensure only one welcome popup at a time
CREATE OR REPLACE FUNCTION ensure_single_welcome_popup()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_welcome_popup = true THEN
    UPDATE routines_bank 
    SET is_welcome_popup = false 
    WHERE id != NEW.id AND is_welcome_popup = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER single_welcome_popup_trigger
BEFORE INSERT OR UPDATE ON routines_bank
FOR EACH ROW
EXECUTE FUNCTION ensure_single_welcome_popup();
```

### 2. Update useRoutinesBank Hook
Add a new hook `useWelcomePopupRitual` that fetches the ritual marked as welcome popup:

```typescript
export function useWelcomePopupRitual() {
  return useQuery({
    queryKey: ['welcome-popup-ritual'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routines_bank')
        .select('*')
        .eq('is_active', true)
        .eq('is_welcome_popup', true)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as RoutineBankItem | null;
    },
  });
}
```

### 3. Redesign WelcomeRitualCard Component
Transform it into a true popup overlay:

**Key changes:**
- Fixed position with `z-50` to overlay on top of content
- Semi-transparent background (light blur/dim based on your preference)
- Centered modal-like appearance
- Uses ritual's actual `title` and `subtitle` instead of hardcoded text
- Larger size (popup style, not banner)
- Keep the flip interaction for showing actions on the back

**Structure:**
```text
+----------------------------------------+
|  Fixed Overlay (z-50)                  |
|  +----------------------------------+  |
|  |  [X] Dismiss                     |  |
|  |                                  |  |
|  |  [Cover Image]                   |  |
|  |                                  |  |
|  |  Title: {ritual.title}           |  |
|  |  Subtitle: {ritual.subtitle}     |  |
|  |                                  |  |
|  |  "Tap to pick your first actions"|  |
|  +----------------------------------+  |
+----------------------------------------+
```

**Back of card (after flip):**
```text
+----------------------------------+
|  Pick an action            [X]  |
|  One is enough. Start small.    |
|----------------------------------|
|  [emoji] Action 1          [+]  |
|  [emoji] Action 2          [+]  |
|  [emoji] Action 3          [✓]  |
|----------------------------------|
|  Tap to flip back               |
+----------------------------------+
```

### 4. Update Admin Rituals Bank UI
Add a "Welcome Popup" toggle button next to the existing Popular/Active toggles in `RoutinesBank.tsx`:

- Add Crown or Gift icon for the welcome popup toggle
- Only one ritual can be marked as welcome popup (radio-style)
- Show visual indicator for the currently selected welcome ritual

### 5. Update AppHome Integration
- Import the new `useWelcomePopupRitual` hook
- Render `WelcomeRitualCard` as an overlay (fixed position) instead of inline
- Show only when `isNewUser` is true and no tasks exist and a welcome ritual is configured
- Hide the regular empty state content underneath (dimmed by overlay)

## Technical Details

### Files to Modify
1. **Database migration**: Add `is_welcome_popup` column and trigger
2. **src/hooks/useRoutinesBank.tsx**: Add `useWelcomePopupRitual` hook
3. **src/components/app/WelcomeRitualCard.tsx**: Complete redesign as overlay popup
4. **src/components/admin/RoutinesBank.tsx**: Add welcome popup toggle UI
5. **src/pages/app/AppHome.tsx**: Update rendering logic for overlay positioning

### Styling Approach
- Use `fixed inset-0 z-50` for the overlay container
- Light backdrop blur (`backdrop-blur-sm`) with subtle dim (`bg-black/20`)
- Card centered using `flex items-center justify-center`
- Card size: `max-w-sm` (similar to modal size from screenshot)
- Keep the 3D flip animation for interactivity

### Behavior
- Popup appears for new users with no tasks
- Stays visible until user clicks X (even after adding actions)
- Clears `simora_force_new_user` localStorage flag on dismiss
- If no ritual is marked as welcome popup, the card doesn't appear
