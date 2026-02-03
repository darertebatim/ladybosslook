

# Profile Page Redesign Plan

## Overview
Redesign the AppProfile page to be more professional, visually consistent with other app pages (like AppPlayer, AppJournal, AppHome), and follow the established Me+ inspired aesthetic with better information hierarchy and modern UI patterns.

---

## Design Analysis

### Current Issues
1. **Long scrolling page** with 10+ cards stacked vertically - overwhelming
2. **Quick navigation grid** at top uses small icon-only buttons - hard to scan
3. **Inconsistent card styling** - some cards are heavy, others minimal
4. **No visual grouping** - all sections look the same
5. **Header is plain** - just text, doesn't match the immersive headers on other pages
6. **Profile avatar area** is separate from header - wastes vertical space

### Design Inspiration from Other Pages
- **AppPlayer**: Category circles, tabbed filtering, clean header with search
- **AppJournal**: Stats pills in header, grouped entries by date
- **AppHome**: Gradient header with greeting, compact stat pills, card-based sections
- **HomeMenu**: Pill-based navigation groups

---

## New Design Structure

### 1. Hero Header with Profile Card (Lines 631-650)
Replace the plain header with an immersive header containing the user's profile info.

```text
┌────────────────────────────────────────┐
│  ← (back)           Profile    ⚙️      │ ← Header row
├────────────────────────────────────────┤
│    ┌──────┐                            │
│    │  JD  │   John Doe                 │ ← Avatar + Name
│    └──────┘   john@email.com           │
│                                        │
│   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│   │ 5    │ │ 12   │ │ 28   │ │ $50  │  │ ← Stats row
│   │Prog. │ │Streak│ │Posts │ │Credit│  │
│   └──────┘ └──────┘ └──────┘ └──────┘  │
└────────────────────────────────────────┘
```

### 2. Tab-Based Content Organization (Lines 653-760)
Use tabs to organize content into logical groups instead of a single long scroll.

**Tab Structure:**
- **Account** - Personal info, password, actions
- **Activity** - Programs, journal stats, orders
- **Settings** - Notifications, calendar, support

### 3. Modernized Section Cards
Each section uses consistent card styling with:
- Icon + title in a row
- Subtle background tint for status areas
- Chevron indicators for expandable items

---

## Technical Implementation

### File Changes

**`src/pages/app/AppProfile.tsx`** - Complete restructure:

1. **New Header Component** (embedded):
   - Gradient background matching other pages (`bg-[#F4ECFE]`)
   - Centered avatar with name/email below
   - Horizontal stats pills (programs, journal streak, credits)

2. **Tabs Structure**:
   - Use existing `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from shadcn
   - Three tabs: Account, Activity, Settings
   - Content wrapped in scroll container per tab

3. **Account Tab Contents**:
   - Profile Info Card (editable fields)
   - Password Management Card
   - Actions Card (sign out, delete, replay tour)

4. **Activity Tab Contents**:
   - JournalStats component (already exists)
   - My Programs Card (with list)
   - Orders Card (with list)
   - Wallet Card (balance + transactions)

5. **Settings Tab Contents**:
   - Push Notifications Card (native only)
   - Calendar Sync Card (native only)
   - Support Card (chat button + telegram form)

### Color & Styling Updates

| Element | Current | New |
|---------|---------|-----|
| Header | Plain white | `bg-[#F4ECFE] rounded-b-3xl` |
| Avatar | Small 64px | Larger 80px with ring |
| Stats | Not visible | Pill badges below name |
| Cards | Heavy borders | Subtle shadows, rounded-2xl |
| Tabs | N/A | Pill-style tabs matching app theme |

### Component Structure

```tsx
// Simplified structure
<div className="flex flex-col h-full">
  {/* Fixed Hero Header */}
  <header className="bg-[#F4ECFE] rounded-b-3xl shadow-sm">
    <div className="flex items-center justify-between px-4 pt-safe">
      <BackButton />
      <h1>Profile</h1>
      <SettingsButton />
    </div>
    
    {/* Avatar + Name */}
    <div className="flex flex-col items-center py-4">
      <Avatar className="h-20 w-20" />
      <h2 className="font-bold">{name}</h2>
      <p className="text-muted">{email}</p>
    </div>
    
    {/* Stats Pills */}
    <div className="flex justify-center gap-3 pb-4">
      <StatPill label="Programs" value={5} />
      <StatPill label="Streak" value={12} />
      <StatPill label="Credits" value={50} />
    </div>
  </header>

  {/* Tabs */}
  <Tabs defaultValue="account" className="flex-1 overflow-hidden">
    <TabsList className="sticky px-4 py-2 bg-background">
      <TabsTrigger value="account">Account</TabsTrigger>
      <TabsTrigger value="activity">Activity</TabsTrigger>
      <TabsTrigger value="settings">Settings</TabsTrigger>
    </TabsList>
    
    <TabsContent value="account" className="overflow-y-auto">
      {/* Account cards */}
    </TabsContent>
    
    <TabsContent value="activity" className="overflow-y-auto">
      {/* Activity cards */}
    </TabsContent>
    
    <TabsContent value="settings" className="overflow-y-auto">
      {/* Settings cards */}
    </TabsContent>
  </Tabs>
</div>
```

---

## Visual Improvements

### Stats Pill Component (new)
```tsx
const StatPill = ({ label, value, icon }) => (
  <div className="flex flex-col items-center bg-white/60 px-4 py-2 rounded-xl">
    <span className="text-lg font-bold">{value}</span>
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
);
```

### Card Styling Updates
- Remove heavy `CardHeader` borders
- Use `rounded-2xl` for softer corners
- Add subtle `shadow-sm` instead of borders
- Group related items with `bg-muted/30` backgrounds

### Quick Actions Removal
Remove the icon-only quick navigation grid at the top - the tabs replace this functionality with better UX.

---

## Implementation Phases

### Phase 1: Restructure Layout
- Add tabs component
- Move content into appropriate tabs
- Remove old quick navigation grid

### Phase 2: Hero Header
- Redesign header with gradient background
- Move avatar into header
- Add stats pills row

### Phase 3: Card Polish
- Update card styling across all sections
- Improve spacing and visual hierarchy
- Add status indicators with consistent colors

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/app/AppProfile.tsx` | Complete redesign with tabs, hero header, reorganized content |

---

## Expected Outcome
A cleaner, more organized profile page that:
- Reduces cognitive load with tabbed navigation
- Puts key user info (name, stats) front and center
- Matches the visual style of other app pages
- Improves discoverability of settings and actions
- Feels more "app-like" and professional

