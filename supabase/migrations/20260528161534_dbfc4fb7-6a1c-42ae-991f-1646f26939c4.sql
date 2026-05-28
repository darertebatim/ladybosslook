ALTER TABLE public.audio_playlists ADD COLUMN IF NOT EXISTS path_role text;
ALTER TABLE public.audio_playlists DROP CONSTRAINT IF EXISTS audio_playlists_path_role_check;
ALTER TABLE public.audio_playlists ADD CONSTRAINT audio_playlists_path_role_check CHECK (path_role IS NULL OR path_role IN ('primary','secondary'));
CREATE INDEX IF NOT EXISTS audio_playlists_path_role_idx ON public.audio_playlists(path_role) WHERE path_role IS NOT NULL;