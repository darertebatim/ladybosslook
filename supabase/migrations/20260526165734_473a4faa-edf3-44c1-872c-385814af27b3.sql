
DELETE FROM public.content_tags WHERE content_type = 'audio';

INSERT INTO public.content_tags (content_type, content_id, tag_id)
SELECT DISTINCT 'audio', api.audio_id, ct.tag_id
FROM public.audio_playlist_items api
JOIN public.content_tags ct
  ON ct.content_type = 'playlist' AND ct.content_id = api.playlist_id
ON CONFLICT DO NOTHING;
