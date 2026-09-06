CREATE TABLE public.program_round_playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid NOT NULL REFERENCES public.program_rounds(id) ON DELETE CASCADE,
  playlist_type text NOT NULL,
  playlist_id uuid NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT program_round_playlists_type_check CHECK (playlist_type IN ('audio','video')),
  CONSTRAINT program_round_playlists_unique UNIQUE (round_id, playlist_type, playlist_id)
);

GRANT SELECT ON public.program_round_playlists TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_round_playlists TO authenticated;
GRANT ALL ON public.program_round_playlists TO service_role;

ALTER TABLE public.program_round_playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view round playlists"
  ON public.program_round_playlists FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage round playlists"
  ON public.program_round_playlists FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_program_round_playlists_round ON public.program_round_playlists(round_id, sort_order);

CREATE TRIGGER update_program_round_playlists_updated_at
  BEFORE UPDATE ON public.program_round_playlists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.program_round_playlists (round_id, playlist_type, playlist_id, sort_order)
SELECT id, 'audio', audio_playlist_id, 0
FROM public.program_rounds
WHERE audio_playlist_id IS NOT NULL
ON CONFLICT DO NOTHING;