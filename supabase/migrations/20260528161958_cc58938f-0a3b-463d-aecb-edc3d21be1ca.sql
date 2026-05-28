-- Drop the temporary column-based approach
ALTER TABLE public.audio_playlists DROP CONSTRAINT IF EXISTS audio_playlists_path_role_check;
DROP INDEX IF EXISTS public.audio_playlists_path_role_idx;
ALTER TABLE public.audio_playlists DROP COLUMN IF EXISTS path_role;

-- Add the new Path role dimension
INSERT INTO public.tag_dimensions (slug, label, emoji, sort_order, description, is_multi_select, is_active)
VALUES ('path-role', 'Path role', '🛤️', 95, 'Marks a playlist as the engine''s Primary or Secondary audio pick. The engine selects the language-matching variant automatically.', false, true)
ON CONFLICT (slug) DO NOTHING;

-- Add the two tags under it
INSERT INTO public.tags (dimension_id, slug, label, emoji, sort_order, description, is_active)
SELECT d.id, 'primary', 'Primary', '⭐', 1, 'Featured (hero) audio in the daily path.', true
FROM public.tag_dimensions d WHERE d.slug = 'path-role'
ON CONFLICT (dimension_id, slug) DO NOTHING;

INSERT INTO public.tags (dimension_id, slug, label, emoji, sort_order, description, is_active)
SELECT d.id, 'secondary', 'Secondary', '🎧', 2, 'Secondary audio slot in the daily path.', true
FROM public.tag_dimensions d WHERE d.slug = 'path-role'
ON CONFLICT (dimension_id, slug) DO NOTHING;