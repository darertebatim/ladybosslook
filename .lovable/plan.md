
# Unify playlist tagging on one schema

Today, playlists are tagged in two parallel systems:

- **Legacy** — `playlist_tags` (tag definitions) + `audio_playlist_tag_links` (playlist↔tag). Used by the playlist editor and by the current `useTodayPath.tsx` lookup.
- **New** — `tag_dimensions` + `tags` + `content_tags` (with `content_type` already supporting `"playlist"`). Used by the new `/admin/tags/content` Tag Schema page where you defined **Path role → Primary / Secondary** and dimensions like Self-care category, Immigrant theme, Productivity.

Goal: one source of truth. Playlists get tagged via the new schema. Legacy tables go away.

## What I will build

1. **Migrate legacy playlist tags into the new schema** (one-time, in SQL):
   - Create a new dimension `playlist-subject` (or reuse an existing matching dimension if you prefer — see Questions below).
   - For each row in `playlist_tags`, insert a matching row in `tags` under that dimension (preserving slug, label, emoji, sort_order).
   - For each row in `audio_playlist_tag_links`, insert into `content_tags` with `content_type='playlist'` pointing to the new tag id.
   - Skip duplicates safely.

2. **Rewire the playlist editor (`PlaylistManager.tsx` + `PlaylistTagPicker.tsx`)** to read/write `content_tags` via `useContentTagsByType('playlist')` + `useSaveContentTags()`. The picker becomes dimension-grouped (so admins can see Path role, Subject, Language, etc. side by side and tick the right tags).

3. **Rewire `useTodayPath.tsx`** to query `content_tags` (joined to `tags` + `tag_dimensions`) instead of `audio_playlist_tag_links`. Primary/Secondary lookup uses the `path-role` dimension you already created.

4. **Rewire `PlaylistTagChips.tsx`** (the user-facing chip strip) to read `content_tags` for the playlist.

5. **Delete legacy code & tables**:
   - Drop hook file `src/hooks/usePlaylistTags.ts`.
   - Delete `src/components/admin/PlaylistTagsBankDialog.tsx` (legacy bank manager — replaced by Tag Schema page).
   - Remove the "Manage tag bank" entry point from `PlaylistManager`.
   - SQL: `DROP TABLE audio_playlist_tag_links; DROP TABLE playlist_tags;` (after data migration is verified).

## Result

- Every playlist tag — including Path role: Primary/Secondary, subject, language — lives in **one** table (`content_tags`).
- The Tag Schema admin page is the only place to define tag dimensions and tags.
- The playlist editor shows all dimensions and you tick tags from each.
- `useTodayPath` reads Primary/Secondary directly from the unified schema, so when you tag a new playlist (e.g. Wellness Planning Persian) as Primary + language `fa`, Persian users auto-get it.

## Questions before I run the migration

1. **Subject tags** ("self-care", "immigrants", "planning"): do you want them migrated into a single new dimension called **"Playlist subject"**, or should I delete them entirely and rely only on your existing dimensions (Self-care category, Immigrant theme, Productivity) for subject grouping? The latter is cleaner long-term but means I won't carry the 3 legacy tags forward — you'd re-tag with the proper dimensions.

2. **`PlaylistTagChips`** (the public chip strip on playlist cards): which dimensions should show as user-visible chips? I'd suggest hiding internal ones (Path role) and showing only subject/category dimensions. Want me to add an `is_user_visible` flag on `tag_dimensions` for this?

Once you answer those two, I'll write the migration + code changes in one pass.
