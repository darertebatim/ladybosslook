## Goal

Flexible **multi-dimensional tag system** for audios, playlists, reflections, and breathing exercises. Open-ended so we can add new dimensions anytime without code changes. Plus two admin pages: **Tag Schema** (manage dimensions/tags) and **Content Tagging** (apply tags to content).

Multi-door is native — anything can carry tags from multiple dimensions (e.g. "Homesick" breathe = `door:emotion` + `door:immigrant` + `emotion:homesick` + `immigrant:homesickness`).

---

## 1. Architecture

```text
tag_dimensions          tags
─────────────           ────
id                      id
slug (unique)           dimension_id  ← FK
label                   slug          (unique per dimension)
emoji                   label
sort_order              emoji
description             sort_order
is_multi_select         description
                        is_active

content_tags
────────────
content_type   ('audio'|'playlist'|'reflection'|'breathing')
content_id     uuid
tag_id         FK → tags
PK (content_type, content_id, tag_id)
```

One polymorphic link table — adding a 5th content type later = one enum value, no new table. No hard rule of "one door per content" — it's all just tags across dimensions.

---

## 2. Seed dimensions (v1) — all editable later

### Door (4)
`selfcare`, `emotion`, `immigrant`, `productivity`

### Emotion (13) — from your breathe library
`anxiety`, `worry`, `fear`, `envy`, `anger`, `sadness`, `irritation`, `overwhelm`, `stressed`, `exhausted`, `lonely`, `missing-someone`, `homesick`
+ optional: `depressed`, `low-energy`
(Detailed mood-checklist sub-tags can come later as their own dimension.)

### Self-care cluster (4)
`body`, `mind`, `people`, `environment`
(Matches Self-Care Quiz `CLUSTER_MAP` in `src/utils/selfcare-scoring.ts`.)

### Self-care category (14) — reuse your existing task categories
`sleep`, `nutrition`, `movement`, `calm`, `Presence`, `gratitude`, `self-kindness`, `TidyUp`, `productivity`, `hygiene`, `Evening`, `easy-win`, `connection`, `LovedOnes`
(Pulled straight from `CLUSTER_MAP`. Each one will be linked to its cluster via the same tag system — see §3.)

### Immigrant theme (7)
`homesickness`, `identity`, `career`, `finance`, `english`, `community`, `healthcare`

### Productivity (seed — adjust freely in admin)
`focus`, `planning`, `deep-work`, `procrastination`, `motivation`, `morning-routine`, `evening-routine`

### Format (6) — no `reset`
`meditation`, `sleep-story`, `education`, `podcast`, `breathe`, `reflection`

### Language (optional)
`en`, `fa`, `tr`, `es`

---

## 3. Cross-door & cluster-to-category mapping

Two pieces of "join" logic, both handled by the same `content_tags` table:

**Multi-door content** — a track tagged with both `door:emotion` and `door:immigrant` shows up in both doors' My Rilo queries. Example: "Homesick" breathe →
`door:emotion`, `door:immigrant`, `emotion:homesick`, `immigrant:homesickness`, `format:breathe`.

**Self-care cluster ↔ category** — to avoid duplicating the cluster map, we store the parent cluster on each category tag (a new optional `parent_tag_id` column on `tags`). The admin Tag Schema page lets you set: `sleep → body`, `calm → mind`, etc. Then any content tagged `selfcare-category:sleep` automatically counts toward `selfcare-cluster:body` at query time (resolved in a `useTaggedContent` hook).

---

## 4. Database migration

One migration that:

1. Creates `tag_dimensions` + `tags` + `content_tags` with GRANTs (admin write, authenticated read) and RLS
2. Seeds the dimensions and tags listed in §2
3. Sets `parent_tag_id` for the 14 self-care categories → 4 clusters per `CLUSTER_MAP`
4. Migrates existing `playlist_tags` rows (currently the 3 door-like tags: immigrant/self-care/emotion) into the new `tags` table under the `door` dimension
5. Migrates `audio_playlist_tag_links` rows → `content_tags` (with `content_type='playlist'`)
6. Drops `playlist_tags` and `audio_playlist_tag_links` after verification

---

## 5. Auto-tag seed pass (one-time SQL, included in migration)

Best-guess tags from title patterns so you start with ~70% coverage and use the admin page to fix the rest.

| Pattern (ILIKE on title/description) | Tags added |
|---|---|
| `%homesick%` | door:emotion, door:immigrant, emotion:homesick, immigrant:homesickness |
| `%anxiety%`, `%anxious%` | door:emotion, emotion:anxiety |
| `%worry%`, `%worrying%` | door:emotion, emotion:worry |
| `%stress%` | door:emotion, emotion:stressed |
| `%overwhelm%` | door:emotion, emotion:overwhelm |
| `%exhaust%`, `%tired%` | door:emotion, emotion:exhausted |
| `%lonely%`, `%loneliness%` | door:emotion, emotion:lonely |
| `%missing%` | door:emotion, emotion:missing-someone |
| `%anger%`, `%angry%` | door:emotion, emotion:anger |
| `%sad%` | door:emotion, emotion:sadness |
| `%fear%`, `%afraid%` | door:emotion, emotion:fear |
| `%envy%`, `%jealous%` | door:emotion, emotion:envy |
| `%irritat%` | door:emotion, emotion:irritation |
| title contains "sleep story" | format:sleep-story |
| title contains "meditation" | format:meditation |
| title contains "(FA)" | language:fa |
| Immigrant series titles (Homesickness / Identity / Career / Financial / English / Community / Healthcare) | door:immigrant + matching immigrant:* |
| Self-care reset / 4-cluster series | door:selfcare + matching cluster |
| All `breathing_exercises.*` | format:breathe (+ emotion guessed from category) |
| All `reflections.*` | format:reflection |

You'll review/fix in admin afterward.

---

## 6. Admin — two new pages

### A. `/admin/content/tag-schema`
Two-pane manager.

```text
┌─ Dimensions ───────────────┐  ┌─ Tags in "Self-care category" ─┐
│ • Door                     │  │ 💤 sleep         → body         │
│ • Emotion                  │  │ 🥗 nutrition     → body         │
│ • Self-care cluster        │  │ 🏃 movement      → body         │
│ • Self-care category [act.]│  │ 🧘 calm          → mind         │
│ • Immigrant theme          │  │ 🙏 gratitude     → mind         │
│ • Productivity             │  │ ... [+ Add tag]                 │
│ • Format                   │  │                                 │
│ • Language                 │  │ Edit: parent tag, emoji, label  │
│ [+ Add dimension]          │  │                                 │
└────────────────────────────┘  └─────────────────────────────────┘
```

Inline create/edit/delete/reorder for both. `is_multi_select` controls picker UX. `parent_tag_id` shown when relevant (the cluster→category link).

### B. `/admin/content/tagging`
Review and edit tags on actual content.

```text
[Tabs: Audios | Playlists | Reflections | Breathes]
[Filter: any dimension ▾] [Untagged only ☐] [Search…]

[emoji] Title                  [door chips] [emotion chips] [format]   [Edit]
[emoji] Title                  …                                       [Edit]
```

Edit drawer = one chip section per dimension, multi-select where allowed. Same UX as today's `PlaylistTagPicker`, just grouped.

Added under existing "Content" admin nav.

---

## 7. What this does NOT do (next step, not now)

- No onboarding wiring
- No My Rilo recommendation queries
- No frontend changes outside admin

Once tags are clean across all ~317 pieces of content (192 audios + 34 playlists + 65 reflections + 26 breathes), the onboarding → My Rilo mapping becomes one `content_tags` query per door.

---

## Technical details

**New tables:** `tag_dimensions`, `tags` (with `parent_tag_id`), `content_tags` — full GRANTs + RLS (admin write, authenticated read).
**Dropped after migration:** `playlist_tags`, `audio_playlist_tag_links`.
**Updated files:**
- `src/hooks/usePlaylistTags.ts` → replaced by `src/hooks/useTags.ts` (reads dimensions + tags) and `src/hooks/useContentTags.ts` (reads/writes `content_tags`)
- `src/components/admin/PlaylistTagPicker.tsx` → generic `TagPicker.tsx` grouped by dimension
- `src/components/admin/PlaylistTagsBankDialog.tsx` → replaced by new Tag Schema page
- `src/components/app/PlaylistTagChips.tsx` → reads `content_tags` for `content_type='playlist'`
- Admin nav: add "Tag Schema" + "Content Tagging" under Content section
**New files:**
- `src/pages/admin/TagSchema.tsx`
- `src/pages/admin/ContentTagging.tsx`
- `src/components/admin/TagPicker.tsx`
- `src/hooks/useTagDimensions.ts`, `useTags.ts`, `useContentTags.ts`
- Migration: schema + GRANTs + RLS + seed dimensions/tags + cluster mapping + auto-tag pass + data migration from old playlist_tags

Ready to build on approval. After the migration runs, we'll do a quick audit in the new admin page to fix the auto-tagged content before wiring up onboarding.
