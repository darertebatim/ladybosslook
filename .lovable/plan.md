## Plan: Schedule channel posts for later

### What you'll be able to do
- In the admin channel composer (`/admin/channels` → New Message), pick a date+time to publish a post in the future.
- Send button changes label to **"Schedule"** when a future time is selected.
- Scheduled posts don't appear in the channel until their time arrives — they're held server-side and auto-published.
- A new **"Scheduled"** tab in `/admin/channels` shows all upcoming posts with Edit / Reschedule / Cancel actions.
- Push notifications respect the schedule too (only fire on publish).

### How it works

**1. DB schema (`feed_posts`)**
- Add `scheduled_for timestamptz NULL` — when set & in the future, post is hidden from members.
- Add `published_at timestamptz NULL DEFAULT now()` — the canonical visible-at timestamp (existing posts get `created_at`).
- Update RLS / `useFeedPosts` query to only return rows where `scheduled_for IS NULL OR scheduled_for <= now()`.

**2. Auto-publish job**
- New Postgres function `publish_due_scheduled_posts()` that:
  - Sets `scheduled_for = NULL`, `published_at = now()`, `created_at = now()` for due rows.
  - If `send_push = true`, calls the existing push edge function via `pg_net`.
- `pg_cron` job runs every minute.

**3. Composer UI (`FeedChatComposer.tsx`)**
- Add a small "Schedule" toggle next to Pin / Push, opening a date+time picker (shadcn `Calendar` + native time input).
- When set: insert with `scheduled_for`, button reads "Schedule for May 20, 3:00 PM", and toast confirms.
- Defaults to immediate send if not set.

**4. Scheduled tab (`/admin/channels`)**
- New `ScheduledPostsList` component listing future posts grouped by channel.
- Row actions: **Reschedule** (re-opens picker), **Send now** (clears `scheduled_for`), **Delete**.

### Files to touch

- `supabase/migrations/...` — add `scheduled_for`, `published_at`, indexes, `publish_due_scheduled_posts()` function.
- Separate insert (not migration) — `pg_cron` schedule + `pg_net` call (contains project URL/key).
- `src/components/admin/FeedChatComposer.tsx` — schedule toggle + picker + insert payload.
- `src/components/admin/ScheduledPostsList.tsx` — new component.
- `src/pages/admin/Community.tsx` — add "Scheduled" tab.
- `src/hooks/useFeed.tsx` — filter out future-scheduled posts from member views; add `useScheduledPosts` for admin.

### Out of scope
- Timezone selector (uses admin's local TZ → stored as UTC).
- Recurring scheduled posts.
- End-user scheduled DMs.
