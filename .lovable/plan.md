

# Bottom Navigation Bar Redesign

## Problem Analysis

The current bottom navigation has a critical visual issue:
- When a tab is active, `fill-current` is applied to Lucide icons
- Lucide icons are **stroke-based** (outlines), not designed for solid fills
- Filling them creates an ugly, blocky appearance as seen in the screenshots

**Current Code (line 172):**
```tsx
<Icon className={`h-5 w-5 ${isActive ? 'fill-current' : ''}`} />
```

---

## Proposed Design: iOS-Native Tab Bar

Inspired by Apple's Human Interface Guidelines and modern iOS apps, we'll create a clean, premium tab bar with these characteristics:

### Visual Design

```text
+----------------------------------------------------+
|                                                    |
|   🏠          🛍️          🎵         👥        🎧    |
|   Home      Browse     Listen    Channels  Support |
|   ━━━━                                              |
|  (active)  (inactive) (inactive) (inactive) (badge)|
|                                                    |
+----------------------------------------------------+
```

### Active vs Inactive States

| State | Icon Style | Label | Indicator |
|-------|-----------|-------|-----------|
| **Inactive** | Light stroke (stroke-width: 1.5), muted color | `text-muted-foreground` | None |
| **Active** | Bold stroke (stroke-width: 2.5), primary color | `text-foreground font-semibold` | Subtle dot or underline below icon |

### Key Improvements

1. **Remove `fill-current`** - No more ugly filled icons
2. **Increase stroke weight on active** - Makes active icon visually heavier without filling
3. **Add active indicator** - Small dot or bar below active icon (iOS pattern)
4. **Better visual hierarchy** - Active tab has bolder text weight
5. **Refined spacing** - Consistent padding and alignment

---

## Implementation Details

### Icon Styling

```tsx
// Instead of fill-current, use stroke-width variation
<Icon 
  className={cn(
    'h-6 w-6',  // Slightly larger for better touch targets
    isActive 
      ? 'text-foreground' 
      : 'text-muted-foreground'
  )}
  strokeWidth={isActive ? 2.5 : 1.5}  // Bolder stroke when active
/>
```

### Active Indicator Options

**Option A: Dot indicator (Apple Music style)**
```tsx
{isActive && (
  <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-foreground" />
)}
```

**Option B: Underline bar (minimal)**
```tsx
{isActive && (
  <span className="absolute -bottom-0.5 w-4 h-0.5 rounded-full bg-foreground" />
)}
```

### Label Styling
```tsx
<span className={cn(
  'text-[10px] mt-0.5',
  isActive 
    ? 'text-foreground font-semibold' 
    : 'text-muted-foreground font-medium'
)}>
  {item.label}
</span>
```

### Badge Refinements
Keep badges as-is but ensure they don't interfere with the active indicator.

---

## File Changes

| File | Changes |
|------|---------|
| `src/layouts/NativeAppLayout.tsx` | Update icon styling, add active indicator, refine label styles |

---

## Technical Details

### Updated navItems Rendering

```tsx
{navItems.map((item) => {
  const isActive = location.pathname === item.path || 
    (item.path === '/app/channels' && location.pathname.startsWith('/app/channels'));
  const Icon = item.icon;
  
  return (
    <Link
      key={item.path}
      to={item.path}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 min-h-[44px]',
        'transition-colors',
        item.tourClass
      )}
    >
      <div className="relative flex flex-col items-center">
        <Icon 
          className={cn(
            'h-6 w-6',
            isActive ? 'text-foreground' : 'text-muted-foreground'
          )}
          strokeWidth={isActive ? 2.5 : 1.5}
        />
        
        {/* Badges... */}
        
        {/* Active indicator dot */}
        {isActive && (
          <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-foreground" />
        )}
      </div>
      
      <span className={cn(
        'text-[10px]',
        isActive 
          ? 'text-foreground font-semibold' 
          : 'text-muted-foreground font-medium'
      )}>
        {item.label}
      </span>
    </Link>
  );
})}
```

### Design Tokens Used

- Icon size: `h-6 w-6` (24px - better touch target)
- Stroke inactive: `1.5` (light)
- Stroke active: `2.5` (bold)
- Active text: `text-foreground font-semibold`
- Inactive text: `text-muted-foreground font-medium`
- Active indicator: 4px circle below icon
- Tab bar bg: `bg-background` with top border

---

## Summary

This redesign:
1. Fixes the ugly filled icon problem
2. Uses iOS-native stroke weight pattern for active states
3. Adds a subtle active indicator dot
4. Creates better visual hierarchy with font weight
5. Maintains all existing functionality (badges, routing, tour classes)

