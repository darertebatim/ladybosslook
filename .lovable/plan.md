
# Subscription Model Activation Plan

## Overview
Build a complete subscription system using RevenueCat (iOS) and Stripe (web) that lets you control which tools, playlists, rituals, and programs require a subscription -- all manageable from the admin panel.

---

## Phase 1: Database Foundation

### New Tables

**`user_subscriptions`** - Track each user's subscription status
- `user_id`, `status` (active, expired, trial, cancelled), `platform` (ios, web, stripe), `product_id`, `expires_at`, `trial_ends_at`, `revenuecat_id`, `stripe_subscription_id`, `created_at`, `updated_at`

**`subscription_products`** - Define available subscription tiers
- `id`, `name` (e.g. "Simora Premium Monthly"), `ios_product_id`, `stripe_price_id`, `interval` (monthly, yearly), `price_amount`, `trial_days`, `is_active`, `created_at`

### Schema Changes to Existing Tables
- **`audio_playlists`**: Add `requires_subscription` (boolean, default false)
- **`routines_bank`**: Add `requires_subscription` (boolean, default false)
- **`program_catalog`**: Add `requires_subscription` (boolean, default false)
- **New table `tool_access_config`**: `tool_id` (text, unique), `requires_subscription` (boolean), `free_usage_limit` (integer, nullable) -- to control which wellness tools (journal, breathe, water, etc.) need a subscription and optionally allow limited free usage

### RLS Policies
- Users can read their own subscription record
- Admins can read/write all subscriptions
- `tool_access_config` readable by all authenticated users

---

## Phase 2: Subscription Hook and Context

### `useSubscription` Hook
- Fetches the current user's subscription from `user_subscriptions`
- Exposes: `isSubscribed`, `subscriptionStatus`, `trialEndsAt`, `expiresAt`, `platform`
- Cached with React Query, refreshed on app focus
- A helper `hasAccess(featureId)` that cross-references `tool_access_config`, playlist/ritual/program `requires_subscription` flags

### Paywall Component
- A reusable `<PaywallGate>` wrapper component
- Shows subscription prompt when user lacks access
- Displays pricing, trial info, and subscribe buttons
- Routes to RevenueCat (iOS) or Stripe Checkout (web) based on platform

---

## Phase 3: RevenueCat Integration (iOS)

### Edge Function: `revenuecat-webhook`
- Receives RevenueCat webhook events (INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION)
- Updates `user_subscriptions` table accordingly
- Maps RevenueCat app_user_id to Supabase user_id

### Client-Side (Capacitor)
- Initialize RevenueCat SDK with the existing `REVENUECAT_API_KEY` secret
- On app launch, identify user with their Supabase user_id
- Purchase flow: present RevenueCat paywall, handle purchase result, update local state
- Restore purchases support

---

## Phase 4: Stripe Integration (Web)

### Edge Function: `create-subscription-checkout`
- Creates a Stripe Checkout session for subscription products
- Uses existing `STRIPE_SECRET_KEY`
- Returns checkout URL

### Stripe Webhook Updates
- Extend existing `stripe-webhook` to handle `customer.subscription.updated`, `customer.subscription.deleted` events
- Update `user_subscriptions` table on subscription lifecycle changes

---

## Phase 5: Access Control Integration

### Tools (Journal, Breathe, Water, etc.)
- Wrap tool routes with `<PaywallGate toolId="journal">` check
- Read `tool_access_config` to determine if tool requires subscription
- Option for "free_usage_limit" (e.g., 3 free journal entries per month)

### Playlists
- Extend existing `isPlaylistLocked` logic: locked if `requires_subscription = true` AND user is not subscribed
- Show lock icon with "Subscribe" CTA instead of "Enroll"

### Rituals
- Check `requires_subscription` on `routines_bank` before allowing ritual activation
- Show paywall prompt for premium rituals

### Programs
- Check `requires_subscription` on `program_catalog`
- Premium programs show subscription CTA in course detail page

---

## Phase 6: Admin Panel - Subscription Management

### New Admin Page: "Subscriptions" (`/admin/subscriptions`)

**Tab 1: Products**
- Manage subscription products (name, price, iOS product ID, Stripe price ID, trial days)

**Tab 2: Access Control**
- **Tools section**: Toggle which tools require subscription, set free usage limits
- **Playlists section**: List all playlists with a "Premium" toggle
- **Rituals section**: List all rituals with a "Premium" toggle  
- **Programs section**: List all programs with a "Premium" toggle

**Tab 3: Subscribers**
- View all active subscribers, their status, platform, expiry dates
- Search/filter by user, status, platform

---

## Phase 7: UI Polish

- Add a "Premium" badge/crown icon on locked content throughout the app
- Subscription status indicator in user profile
- "Manage Subscription" option in profile settings (links to App Store / Stripe portal)
- Graceful handling of expired subscriptions (grace period messaging)

---

## Implementation Order

1. Database migrations (tables + columns)
2. `useSubscription` hook + `PaywallGate` component
3. Admin "Access Control" page (so you can configure what's premium)
4. RevenueCat webhook edge function
5. RevenueCat client-side integration (iOS)
6. Stripe subscription checkout + webhook updates (web)
7. Wire access checks into tools, playlists, rituals, programs
8. UI polish (badges, profile, manage subscription)

---

## Technical Notes

- The existing `REVENUECAT_API_KEY` secret is already configured
- The existing `STRIPE_SECRET_KEY` and `stripe-webhook` function will be extended
- RevenueCat Capacitor plugin (`@revenuecat/purchases-capacitor`) will need to be installed
- Platform detection uses the existing `isNativeApp()` utility
- The `tool_access_config` table decouples access rules from code, letting you toggle tools on/off from admin without code changes
