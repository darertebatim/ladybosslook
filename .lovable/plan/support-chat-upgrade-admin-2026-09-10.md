# Support Chat upgrade (admin)

Turn the admin Support page into a real customer-service desk.

## 1. Filters on top

Move the search box, unread filter and program tags out of the narrow
conversation column and place them in a filter bar under "Manage customer
support conversations", so they span the full width and stop wrapping into
a wall of buttons.

The bar gets:
- Search (name, email, or message text)
- Status chips: All / Unread / Open / Waiting on us / Resolved
- A "Programs" dropdown with checkboxes instead of a long chip row
- Sort: newest activity / oldest waiting

## 2. Real names instead of "Unknown User"

Today 423 of 1136 conversations show "Unknown User" because the app profile
has no name. We will resolve a display name in this order:

1. Profile name
2. Name from their Stripe purchase (orders.name)
3. Email prefix
4. "Unknown User" only if nothing exists at all

The same lookup fills the email when the profile has none (order email or
linked email alias). The person's phone, city/country, purchase total and
last purchase also show in the side info panel.

## 3. Start a conversation with anyone

A "New message" button opens a people search (name, email, program, or
recent buyers). Pick a person, write the message, send. If they never had a
support thread, one is created and the message is delivered with the normal
push notification.

Bulk option: pick a program or round and message everyone in it, as
individual 1:1 support threads (not a broadcast channel).

## 4. Messages with buttons

The app already understands one link button per message. We extend it to up
to three buttons per message with a small composer UI: button label + link,
where the link can be an in-app page (My Program, a course, Tools) or an
outside URL. Buttons render as tappable buttons in the customer's chat.

## 5. Ready (saved) messages

A library of reusable replies stored in the database, editable in the admin:
- Title, message body, optional buttons, optional language (EN/FA)
- Grouped by category (Billing, Access, Technical, Welcome, Closing)
- Insert into the composer with one click (editable before sending), or send
  instantly
- Placeholders like {first_name} and {program} are filled in automatically

Replaces the four hardcoded quick replies.

## Extras worth adding

- **Status workflow**: mark a thread Open / Waiting / Resolved, plus an
  "Assigned to" field so staff don't answer the same person twice.
- **Internal notes**: notes only staff see, inside the thread.
- **Tags** on conversations (refund, bug, upsell) usable as filters.
- **Unanswered alert**: chips showing threads waiting over 24h.
- **Typing/last-seen and read receipts** already partly exist; surface
  "customer has read" on admin messages.
- **Keyboard shortcuts**: Enter to send, Cmd+K search, Cmd+/ ready messages.

## Technical notes

- New tables: `support_canned_replies` (title, body, buttons jsonb, category,
  language, is_active), `chat_internal_notes`, and columns on
  `chat_conversations` for `assigned_to`, `resolved_at`. All with RLS
  restricted to admin/staff via `has_role` / `can_access_admin_page`, plus
  explicit GRANTs.
- `chat_messages` gains a `buttons jsonb` column; `ChatMessage.tsx` renders
  `buttons` when present and keeps parsing the legacy
  `🔗 LINK_BUTTON:url:label` format for old messages.
- Name resolution runs in one batched query set in `Support.tsx`
  (profiles + orders + account_email_aliases keyed by user_id) instead of the
  current per-conversation N+1 fetch loop, which also speeds up the list.
- New-conversation flow reuses the existing conversation row when one exists
  (unique per user + inbox_type) and reuses `send-chat-notification`.
- `ChatConversationList.tsx` becomes list-only; filter state lifts to
  `Support.tsx` and is shared with the mobile admin page
  (`AppAdminSupport.tsx`).
