

# Cart System + Program Pages Redesign

## Overview
Build a server-side cart system requiring sign-in, redesign the Programs listing page and individual Program detail page for a cleaner, more modern look. Admin can add programs to any user's cart.

---

## 1. Database: Create `cart_items` Table

New table with RLS policies:

```text
cart_items
-----------
id              uuid (PK, default gen_random_uuid())
user_id         uuid (NOT NULL, references profiles.id ON DELETE CASCADE)
program_slug    text (NOT NULL)
program_title   text (NOT NULL)
price_amount    integer (NOT NULL, in cents)
payment_type    text (NOT NULL)
deposit_price   integer (nullable)
added_by        uuid (nullable, references profiles.id) -- null = self, set = admin
created_at      timestamptz (default now())

UNIQUE(user_id, program_slug)
```

RLS policies:
- Users can SELECT/INSERT/DELETE their own rows (`user_id = auth.uid()`)
- Admins (via `has_role()`) can SELECT/INSERT/DELETE any rows

---

## 2. New Edge Function: `create-cart-checkout`

- Reads the authenticated user's `cart_items`
- For each item, looks up the current price from `program_catalog`
- Creates a single Stripe Checkout Session with multiple line items (handles one-time, deposit, and subscription types)
- Returns the Stripe checkout URL
- Metadata includes all program slugs for webhook processing

---

## 3. Update `stripe-webhook` 

After successful `checkout.session.completed`:
- Clear matching `cart_items` for the user (delete all items that were part of this checkout)
- Existing enrollment and order logic remains unchanged

---

## 4. New Page: `/cart` (CartPage.tsx)

Clean, minimal cart page:
- List of cart items with program title, price, payment type
- "Remove" button per item
- Total price summary
- "Proceed to Checkout" button that calls `create-cart-checkout`
- Empty state with link back to `/programs`
- Only accessible when signed in (redirect to `/auth` otherwise)

Add route in `App.tsx`: `/cart` pointing to `CartPage`

---

## 5. Redesign: Programs Listing Page (`/programs`)

Current issues visible in screenshots:
- Raw HTML tags showing in descriptions (`<p>...</p>`)
- Cards are visually heavy with too much info

Redesigned layout:
- Cleaner hero section with subtle gradient
- Program cards with: cover image, title, clean description (HTML stripped/rendered), price with original price strikethrough, duration badge, and "Add to Cart" button
- Grouped by type (courses, coaching, etc.) with cleaner section headers
- "Add to Cart" button requires sign-in -- if not signed in, redirect to `/auth?redirect=/programs`
- If item already in cart, show "In Cart" state with link to cart

---

## 6. Redesign: Individual Program Page (`/:slug` - ProgramPage.tsx)

Current issues:
- Description renders raw HTML
- Layout is generic

Redesigned layout:
- Two-column layout on desktop: left side has program details (title, description rendered from HTML, duration, type badge), right side has sticky pricing card with "Add to Cart" button
- Video section below hero if video_url exists
- Features section with modern card grid
- "Add to Cart" replaces "Enroll Now" -- requires sign-in
- Toast confirmation on add with "View Cart" link
- If already in cart, button shows "Already in Cart - Go to Cart"

---

## 7. Navigation: Cart Icon with Badge

Update `navigation.tsx`:
- Add a shopping cart icon (from lucide) next to auth buttons
- Show item count badge when cart has items
- Only visible when user is signed in
- Links to `/cart`

---

## 8. Admin: Add to User's Cart

Update `LeadsManager.tsx` (the existing user management component):
- Add an "Add to Cart" button in the user detail view
- Opens a dialog with a program selector dropdown (from `program_catalog`)
- Inserts into `cart_items` with `added_by = admin's user_id`
- Admin can then share `/cart` link with the user

---

## 9. Custom Hook: `useCart`

New hook `src/hooks/useCart.ts`:
- Fetch cart items for current user
- `addToCart(program)` -- insert with sign-in check
- `removeFromCart(programSlug)` -- delete
- `cartCount` -- for badge
- `isInCart(programSlug)` -- for button state
- Uses React Query with appropriate cache keys

---

## Files to Create
- `src/pages/CartPage.tsx` -- cart UI
- `src/hooks/useCart.ts` -- cart data hook
- `supabase/functions/create-cart-checkout/index.ts` -- multi-item Stripe checkout

## Files to Modify
- `src/pages/Programs.tsx` -- full redesign with Add to Cart
- `src/pages/ProgramPage.tsx` -- full redesign with Add to Cart
- `src/App.tsx` -- add `/cart` route
- `src/components/ui/navigation.tsx` -- cart icon badge
- `src/components/admin/LeadsManager.tsx` -- admin Add to Cart
- `supabase/functions/stripe-webhook/index.ts` -- clear cart after payment
- Database migration for `cart_items` table

## Implementation Order
1. Database migration (cart_items table + RLS)
2. `useCart` hook
3. Cart page
4. Update navigation with cart icon
5. Redesign Programs listing page with Add to Cart
6. Redesign ProgramPage with Add to Cart
7. `create-cart-checkout` edge function
8. Update stripe-webhook to clear cart
9. Admin Add to Cart in LeadsManager

