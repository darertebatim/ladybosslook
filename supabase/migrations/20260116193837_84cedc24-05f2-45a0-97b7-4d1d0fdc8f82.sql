-- Drop the old constraint and add new one that includes 'audio'
ALTER TABLE public.playlist_supplements DROP CONSTRAINT playlist_supplements_type_check;

ALTER TABLE public.playlist_supplements ADD CONSTRAINT playlist_supplements_type_check 
  CHECK (type = ANY (ARRAY['video'::text, 'pdf'::text, 'link'::text, 'audio'::text]));