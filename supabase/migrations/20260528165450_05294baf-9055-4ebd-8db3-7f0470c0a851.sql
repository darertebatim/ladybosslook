-- Step 1: Create a "Playlist subject" dimension to receive the 4 legacy playlist_tags
INSERT INTO public.tag_dimensions (slug, label, emoji, sort_order, description, is_multi_select, is_active)
VALUES ('playlist-subject', 'Playlist subject', '🏷️', 50,
        'Legacy playlist groupings (migrated from playlist_tags). Used for "more like this" suggestions.',
        true, true)
ON CONFLICT (slug) DO NOTHING;

-- Step 2: Copy every playlist_tags row into tags under the new dimension.
-- Tag slugs in `tags` are unique per dimension, so prefix is not needed.
INSERT INTO public.tags (dimension_id, slug, label, emoji, sort_order, is_active)
SELECT
  (SELECT id FROM public.tag_dimensions WHERE slug = 'playlist-subject'),
  pt.slug,
  pt.label,
  pt.emoji,
  pt.sort_order,
  true
FROM public.playlist_tags pt
ON CONFLICT (dimension_id, slug) DO NOTHING;

-- Step 3: Copy every audio_playlist_tag_links row into content_tags
INSERT INTO public.content_tags (content_type, content_id, tag_id)
SELECT
  'playlist'::text,
  apl.playlist_id,
  t.id
FROM public.audio_playlist_tag_links apl
JOIN public.playlist_tags pt ON pt.id = apl.tag_id
JOIN public.tags t
  ON t.slug = pt.slug
 AND t.dimension_id = (SELECT id FROM public.tag_dimensions WHERE slug = 'playlist-subject')
ON CONFLICT (content_type, content_id, tag_id) DO NOTHING;

-- Step 4: Drop legacy tables (cascade removes any FKs/policies on them)
DROP TABLE IF EXISTS public.audio_playlist_tag_links CASCADE;
DROP TABLE IF EXISTS public.playlist_tags CASCADE;