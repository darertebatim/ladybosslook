
# Apply Stable Scrolling Architecture to All Affected Pages

## Problem

The Home page scrolling is now fixed, but other pages are still using the old `min-h-full` pattern which causes scroll freezing on iOS WKWebView. The following pages need to be updated to use the stable scrolling architecture:

1. **AppFeed.tsx** (Channels) - `min-h-full bg-muted/30`
2. **AppJournal.tsx** - `min-h-full bg-background pb-24`
3. **AppPrograms.tsx** - `min-h-full bg-background`
4. **AppProfile.tsx** - `min-h-full` pattern
5. **AppStore.tsx** - `min-h-full bg-background`
6. **AppCourseDetail.tsx** - `min-h-full` pattern

## Solution

Refactor each page to use the stable scrolling architecture that works on Player and Routines:

```text
BEFORE (problematic):
<div className="min-h-full bg-background">
  <header fixed />
  <spacer />
  <main className="pb-24">...</main>
</div>

AFTER (stable):
<div className="flex flex-col h-full overflow-hidden bg-background">
  <header fixed />
  <div className="shrink-0" style={{ height }} />  // Static spacer
  <div className="flex-1 overflow-y-auto overscroll-contain">
    <div className="pb-safe">...</div>
  </div>
</div>
```

## Changes Per File

### 1. AppFeed.tsx (Channels)
| Line | Change |
|------|--------|
| 118 | Change `min-h-full bg-muted/30` to `flex flex-col h-full overflow-hidden bg-muted/30` |
| 150 | Wrap `<main>` content in a scroll container div |
| 150 | Change `pb-24` to `pb-safe` |

### 2. AppJournal.tsx
| Line | Change |
|------|--------|
| 111 | Change `min-h-full bg-background pb-24` to `flex flex-col h-full overflow-hidden bg-background` |
| 164-165 | Wrap content in scroll container with `flex-1 overflow-y-auto overscroll-contain` |
| Remove `pb-24` from outer div, add `pb-safe` to content wrapper |

### 3. AppPrograms.tsx
| Line | Change |
|------|--------|
| 130 | Change `min-h-full bg-background` to `flex flex-col h-full overflow-hidden bg-background` |
| 142 | Wrap content in scroll container |
| Change `pb-24` to `pb-safe` where applicable |

### 4. AppProfile.tsx
| Change outer container to `flex flex-col h-full overflow-hidden` |
| Add scroll container wrapper |
| Update bottom padding to use `pb-safe` |

### 5. AppStore.tsx
| Line | Change |
|------|--------|
| 130 | Change `min-h-full bg-background` to `flex flex-col h-full overflow-hidden bg-background` |
| 180 | Update scroll container to be the primary scrollable area |
| Update padding to use `pb-safe` |

### 6. AppCourseDetail.tsx
| Change outer container pattern |
| Add scroll container wrapper for content |
| Update bottom padding |

## Technical Architecture

Each page will follow this exact pattern:

```tsx
<div className="flex flex-col h-full overflow-hidden bg-background">
  {/* Fixed header */}
  <header 
    className="fixed top-0 left-0 right-0 z-10 ..."
    style={{ paddingTop: 'env(safe-area-inset-top)' }}
  >
    ...
  </header>

  {/* Static spacer for header */}
  <div 
    className="shrink-0" 
    style={{ height: 'calc(Xpx + env(safe-area-inset-top, 0px))' }} 
  />

  {/* Scroll container - this is the KEY change */}
  <div className="flex-1 overflow-y-auto overscroll-contain">
    <div className="p-4 pb-safe">
      {/* All scrollable content goes here */}
    </div>
  </div>
</div>
```

## Files to Modify

| File | Description |
|------|-------------|
| `src/pages/app/AppFeed.tsx` | Channels page - wrap in scroll container |
| `src/pages/app/AppJournal.tsx` | Journal list - wrap in scroll container |
| `src/pages/app/AppPrograms.tsx` | Programs list - wrap in scroll container |
| `src/pages/app/AppProfile.tsx` | Profile page - wrap in scroll container |
| `src/pages/app/AppStore.tsx` | Browse page - update scroll container |
| `src/pages/app/AppCourseDetail.tsx` | Course detail - wrap in scroll container |

## Expected Result

- All pages will scroll smoothly on iOS
- No more WKWebView scroll freezing
- Consistent behavior across all app pages
- Matches the working Player and Routines pages
