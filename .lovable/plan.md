## 1. Fix Plus slug mismatch (web Annual buyers locked out of Plus videos)

iOS RevenueCat writes `program_slug = 'simora-plus'`. Web Stripe writes `'simora-plus'` for Monthly but `'simora-plus-annual'` for Annual. Many gates check the literal `'simora-plus'`, so web Annual buyers cannot open Plus playlists / videos / gifts.

**`src/hooks/useSubscription.tsx`** — make Plus access slug-family aware:
- Add internal helper: `const isPlusSlug = (s: string | null) => !!s && (s === 'simora-plus' || s.startsWith('simora-plus-'));`
- `isSubscribed`: keep `subscriptions.length > 0`, but also treat any enrolled slug matching `isPlusSlug` as subscribed.
- `hasAccessToProgram(slug)`: when `slug === 'simora-plus'`, return true if ANY active subscription or enrollment matches `isPlusSlug` (so Annual unlocks Plus). For other slugs keep exact match.
- `getSubscriptionForProgram('simora-plus')`: also return first sub whose slug matches `isPlusSlug`.

This single change fixes `AppWatch.tsx`, `AppVideoPlaylistDetail.tsx`, `AppPlaylistDetail.tsx`, and any future Plus gate without touching each call site.

No changes needed to `usePlaylistGifts` (looks up sender's gift row), `AppPrograms`, `useNewHomeData`, `ActiveRound` (those intentionally filter out the literal Plus slug from the program list).

## 2. Rilo Plus Monthly — already correct, no code change

Verified in `program_catalog`:
- `simora-plus`: $7.99, `subscription_interval='month'`, `subscription_interval_count=0`, `stripe_price_id` set → Stripe creates a true monthly recurring subscription that auto-renews every month forever (no auto-cancel).
- `simora-plus-annual`: $59.99, `interval='year'`, `count=0`, no stored price ID → first checkout creates a yearly recurring price on the fly; renews every 12 months forever.

Both behave the same as iOS (monthly vs annual auto-renewing). User is charged immediately at checkout for the first period, then on each renewal.

## 3. Wire `trial_days` into Stripe Checkout (currently ignored)

`program_catalog.trial_days` exists (all rows currently `0`) but `create-payment` never passes it to Stripe, so even if an admin sets `trial_days = 7`, the user would still be charged instantly.

**`supabase/functions/create-payment/index.ts`** — in the subscription branch:
- Add `trial_days` to the `.select(...)` columns.
- When building `subscriptionData`, if `programData.trial_days && programData.trial_days > 0` set `subscriptionData.trial_period_days = programData.trial_days`.
- Also set `payment_method_collection: 'always'` on the session so the card is captured up front (Stripe default for trials, but explicit avoids surprises).

### What happens with a trial on web (Stripe behavior)
- Customer enters card at checkout. **No charge today** — Stripe creates the subscription in `trialing` status with `$0` invoice for the trial.
- At trial end (`trial_period_days` later) Stripe automatically generates the first real invoice and charges the saved card. From then on it renews monthly/annually like normal.
- Customer can cancel during the trial in the Stripe customer portal (or via your own cancel flow) and is never charged.
- A `checkout.session.completed` webhook fires immediately (so the user is granted access right away in `user_subscriptions` / `course_enrollments` with `expires_at = trial_end`). Then `invoice.paid` fires after the trial when the first real charge succeeds — existing webhook logic must extend `expires_at` to the new `current_period_end`.

**Heads-up to verify after build**: confirm `stripe-webhook` updates `expires_at` on `invoice.paid` / `customer.subscription.updated`, otherwise a trial sub would appear "expired" after day 7 in `useSubscription`'s expiry filter. If the webhook only writes on initial `checkout.session.completed`, I will add the update there too.

## Files to edit
- `src/hooks/useSubscription.tsx` — Plus-family access helper
- `supabase/functions/create-payment/index.ts` — pass `trial_period_days`
- (conditional) `supabase/functions/stripe-webhook/index.ts` — extend `expires_at` on renewal/trial-end, only if not already handled
