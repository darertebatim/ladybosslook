
# Fix Onboarding Lab - Redesign All 50 Screens to Match Dear Me PDF

## Problem

The current renderer uses generic card-style layouts with small illustrations, while the Dear Me app uses full-bleed background illustrations that fill the top half (or more) of the screen, with text and controls overlaid or placed below. Almost every screen type needs a layout overhaul.

## Screen-by-Screen Issues and Fixes

### 1. Welcome (Page 1)
**Current**: Small rounded illustration, text below, stat badges as small pills
**PDF**: Full-bleed light blue background, illustration takes up top 60% of screen, 5 gold stars below "25 million+", three laurel-wreath badges ("Featured app", "Users' choice", "Favorite app")
**Fix**: Make illustration full-width with light blue bg, add star rating row, redesign badges with laurel wreath styling

### 2-3. Greeting (Pages 2-3)
**Current**: Small illustration box, text centered, button below
**PDF**: Full-screen illustration as background (fills entire screen), text overlaid on the illustration area, "Continue" button at absolute bottom
**Fix**: Use `illustrationImage` as full-screen background (object-cover), overlay text in the center, pin button to bottom

### 4-5. Multi-Select (Pages 4-5)
**Current**: Title at top, bordered option cards with emojis
**PDF**: Large illustration at top (takes up ~40% of screen), green progress bar below it, then title, then gray-bg rounded option rows (no borders, just light gray fill), no explicit Continue button (page 4 has none visible)
**Fix**: Show illustration full-width at top, add progress bar, change option cards to gray-fill pill style without borders, remove Continue button (auto-advance or scroll-based)

### 6-8. Yes/No (Pages 6-8)
**Current**: Title, small illustration, description text, two buttons side by side
**PDF**: Back chevron in circle, title "Does this sound like you?", then large illustration card (rounded corners, takes up middle of screen) with the quote text overlaid at bottom of card, then "No" and "Yes" buttons at bottom (both navy, equal width)
**Fix**: Restructure to show illustration as large card with text caption inside card at bottom, both buttons navy filled and equal width at bottom

### 9-11. Do-You-Want (Pages 9-11)
**Current**: Small title, subtitle text, illustration, two buttons
**PDF**: Cream/beige background, "Do you want to ..." title centered, large illustration card with subtitle text at bottom of card, "No" button outlined/smaller on left, "Sure, let's go" navy button wider on right
**Fix**: Beige bg, center title, large illustration card with embedded subtitle, asymmetric button layout (No smaller, CTA wider)

### 12. Rating Prompt (Page 12)
**Current**: Star emoji, title, description, buttons on white/cream bg
**PDF**: Full-screen colorful gradient background (green/yellow sky scene), beaver mascot with stars, title and description overlaid on gradient, navy buttons at bottom
**Fix**: Use illustration as full-screen background, overlay text and buttons at bottom

### 13. Rating Dialog (Page 13)
**Current**: Similar to above with iOS dialog
**PDF**: Shows the iOS native rating dialog overlay on top of a blurred background with stars visible
**Fix**: Simulate iOS rating dialog more faithfully

### 14-18. Single Select Questions (Pages 14-18)
**Current**: Title, option cards with borders
**PDF**: Back chevron in circle, title at top, options are gray-filled rounded rectangles (no border), no emoji visible on some, just text. Clean minimal look
**Fix**: Change option cards to gray-fill no-border style, larger text, cleaner spacing

### 19. Sleep Stat / Info-Stat (Page 19)
**Current**: Small illustration, bold stat text, description, button on cream bg
**PDF**: Full-bleed illustration (woman in bed, purple/dark scene) taking top 50%+, then light pink/lavender bottom section with purple-highlighted stat text ("Over 57% of users" in purple, rest in bold black), Continue button
**Fix**: Full-bleed illustration top half, gradient transition to pink bottom, purple highlight on stat percentage

### 20. Stress Level (Page 20)
**Current**: Standard single-select
**PDF**: Same clean single-select style with colored circle emojis
**Fix**: Same as single-select fix above

### 21. Support (Page 21)
**Current**: Standard single-select with descriptions
**PDF**: Clean cards with label + description, no borders
**Fix**: Gray-fill cards without borders

### 22. Motivational "We are here" (Page 22)
**Current**: Small illustration on cream bg
**PDF**: Full-bleed illustration top half (three people, hearts, peach/warm bg), light blue bottom half, "We are here **with you.**" with "with you" in blue/teal, description text, navy Continue button
**Fix**: Full-bleed illustration, blue gradient bottom, colored text highlight

### 23-24. Notification (Pages 23-24)
**Current**: Small illustration, buttons
**PDF**: Page 23 has illustration with notification bell, navy buttons. Page 24 shows iOS native permission dialog overlay
**Fix**: Larger illustration, proper iOS dialog simulation

### 25. Productivity (Page 25)
**Current**: Standard single-select with descriptions
**PDF**: Clean gray-fill option cards
**Fix**: Same gray-fill style

### 26-27. Results Chart (Pages 26-27)
**Current**: Purple gradient chart area with animated bars
**PDF**: Light green/mint background, actual line chart (not bars) with "Your expectation" (gray line, flat) vs "Actually happen" (green line, exponential curve), "Results" label, then bold text "Reach a 37x a better you" with "37x" in green, description below
**Fix**: Redesign chart as line chart with two lines (flat gray vs exponential green), green/mint background, colored stat text

### 28-29. Habit Loop (Pages 28-29)
**Current**: Title + illustration or animated diagram
**PDF**: Page 28: illustration with mascot and text, Continue button. Page 29: Circular habit loop diagram (Cue/Craving/Response/Reward) with description
**Fix**: Use actual illustrations, cleaner diagram on page 29

### 30-31. Focus / Procrastinate Questions
**Current**: Standard selects
**PDF**: Clean gray-fill options
**Fix**: Same gray-fill style

### 32. Focus Stat (Page 32)
**Current**: Standard info-stat
**PDF**: Similar to page 19 - full-bleed illustration top, stat text below
**Fix**: Full-bleed illustration layout

### 33. ADHD/CBT (Page 33)
**Current**: Title, illustration, checklist
**PDF**: Full-width illustration at top (brain comparison), title text, green checkmarks with descriptions, navy button
**Fix**: Larger illustration, better checklist styling

### 34-35. Loading with Testimonials (Pages 34-35)
**Current**: Progress ring, vertical testimonial cards
**PDF**: Orange/amber progress ring with percentage, title in orange text, subtitle in gray, testimonial cards in horizontal scrolling rows (2 rows), large mascot/people illustration at bottom, warm cream background
**Fix**: Orange progress ring, orange title text, horizontal card rows, add illustration at bottom

### 36. Personal Summary (Page 36)
**Current**: Progress bars (red/orange gradient), stat badges
**PDF**: Light blue/pink gradient background, title, three yellow/gold rounded pill bars with emoji icons and "Could be better" status badges, illustration (star on mountain) in middle, "94% of users" in orange/gold text, description, three laurel-badge icons at bottom, Continue button
**Fix**: Complete redesign - yellow pill bars, gradient bg, different color scheme, laurel badges

### 37. First Habit (Page 37)
**Current**: Calendar row, habit card in indigo
**PDF**: Title centered, beaver mascot peeking over a card, "Today" calendar with green checkmarks on past days, blue gradient habit card "Take a deep breath" with toggle, navy button
**Fix**: Add mascot illustration, green checkmark days, blue gradient habit card

### 38-39. Breathing (Pages 38-39)
**Current**: Dark bg with circle animation
**PDF**: Dark navy bg with meditation illustration, breathing circle
**Fix**: Layout adjustments to match

### 40. Breathing Done (Page 40)
**Current**: Title, description, green card
**PDF**: Similar but with calendar row and completed habit card
**Fix**: Minor layout adjustments

### 41-42. Streak (Pages 41-42)
**Current**: Animated calendar, amber gradient card with streak number
**PDF**: Light green background, clean white card with "Today" calendar, separate streak card with fire emoji, "BEST STREAK" label, number in large text, "21 days" highlighted in green in description
**Fix**: Green bg, separate cards (calendar + streak), fire emoji, green highlights

### 43-46. Paywalls (Pages 43-46)
**Current**: Close button, title, vertical pricing cards, subtitle, navy button
**PDF**: "Restore" link top right, large title, full-width illustration (before/after person), three pricing columns side-by-side (not stacked) with colored badges (green "BEST VALUE", purple "POPULAR"), selected tier has orange/amber fill, subtitle below pricing, navy button, Terms & Privacy links
**Fix**: Complete redesign - horizontal pricing columns, illustration, "Restore" link, colored badges, orange selected state

### 47. Motivational Final (Page 47)
**Current**: Small illustration on cream bg
**PDF**: Full-bleed illustration (person looking in mirror), light blue/pink gradient bg, bold title, description, navy button
**Fix**: Full-bleed illustration layout

### 48. Science Backed (Page 48)
**Current**: Small illustration, title, description, gray badge pills
**PDF**: Full-bleed illustration (scientist), pink/lavender gradient bg, bold title, description, four institution logo badges (Harvard, Johns Hopkins, healthline, Stanford) in white rounded cards
**Fix**: Full-bleed illustration, pink bg, white badge cards

### 49. Before/After (Page 49)
**Current**: Two side-by-side colored panels (red/green)
**PDF**: Cream/beige bg, title centered, "Before" card on left (gray, with sad person illustration at bottom, list items with dashes), "After" card overlapping to right (yellow/warm, with confident person illustration, rainbow, confetti), curved arrow between them, Continue button
**Fix**: Complete redesign - overlapping cards with illustrations, arrow, confetti decorations

### 50. Home Screen (Page 50)
**Current**: Full image
**PDF**: App home screen
**Fix**: Keep as-is (image-based)

## Technical Approach

### File changes:
1. **`src/components/admin/onboarding/OnboardingStepRenderer.tsx`** - Complete rewrite of all screen components to match PDF layouts. Key changes:
   - Full-bleed illustration backgrounds (images fill top section, text overlays below)
   - Screen-specific background colors (light blue, cream, green, pink, etc.)
   - Gray-fill no-border option cards for select screens
   - Horizontal pricing columns for paywalls
   - Orange/amber color scheme for loading screens
   - Yellow pill bars for personal summary
   - Line chart for results screen
   - Proper card-based layouts for streak, first habit, etc.

2. **`src/data/onboarding-flows/dear-me.ts`** - Minor data updates:
   - Add "Comparing yourself to others" to beforeItems on page 49
   - Add "Brand new life" to afterItems
   - Update statBadges to include "Featured app", "Users' choice", "Favorite app" for welcome

### Design tokens used throughout:
- Navy CTA: `#1a1f3d`
- Cream bg: `#fdf8f4` or `#faf5ef`
- Light blue bg: `#e8f4f8` or `#dbeef5`
- Light green bg: `#f0f9f0`
- Light pink bg: `#fdf0f5`
- Orange/amber accent: `#f59e0b`
- Purple accent: `#8b5cf6`
- Green accent: `#22c55e`

This is a large renderer rewrite (~800 lines) but all changes are contained to the two files above.
