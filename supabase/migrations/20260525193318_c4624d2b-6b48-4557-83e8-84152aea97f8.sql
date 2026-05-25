-- Curated tag bank
CREATE TABLE public.playlist_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  emoji text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.playlist_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view playlist tags"
  ON public.playlist_tags FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert playlist tags"
  ON public.playlist_tags FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update playlist tags"
  ON public.playlist_tags FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete playlist tags"
  ON public.playlist_tags FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_playlist_tags_updated_at
  BEFORE UPDATE ON public.playlist_tags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Join table: playlist <-> tag
CREATE TABLE public.audio_playlist_tag_links (
  playlist_id uuid NOT NULL REFERENCES public.audio_playlists(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.playlist_tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (playlist_id, tag_id)
);

CREATE INDEX idx_audio_playlist_tag_links_tag ON public.audio_playlist_tag_links(tag_id);
CREATE INDEX idx_audio_playlist_tag_links_playlist ON public.audio_playlist_tag_links(playlist_id);

ALTER TABLE public.audio_playlist_tag_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view playlist tag links"
  ON public.audio_playlist_tag_links FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert playlist tag links"
  ON public.audio_playlist_tag_links FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete playlist tag links"
  ON public.audio_playlist_tag_links FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));