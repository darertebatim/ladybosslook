INSERT INTO public.content_hosts (content_type, content_id, host_id, role, sort_order)
SELECT 'program', slug, '73983235-9d48-433a-9e4f-d916f34862a8'::uuid, 'host', 0 FROM public.program_catalog
WHERE NOT EXISTS (SELECT 1 FROM public.content_hosts ch WHERE ch.content_type='program' AND ch.content_id=public.program_catalog.slug AND ch.host_id='73983235-9d48-433a-9e4f-d916f34862a8'::uuid)
UNION ALL
SELECT 'playlist', id::text, '73983235-9d48-433a-9e4f-d916f34862a8'::uuid, 'host', 0 FROM public.audio_playlists
WHERE NOT EXISTS (SELECT 1 FROM public.content_hosts ch WHERE ch.content_type='playlist' AND ch.content_id=public.audio_playlists.id::text AND ch.host_id='73983235-9d48-433a-9e4f-d916f34862a8'::uuid)
UNION ALL
SELECT 'routine', id::text, '73983235-9d48-433a-9e4f-d916f34862a8'::uuid, 'host', 0 FROM public.routines_bank
WHERE NOT EXISTS (SELECT 1 FROM public.content_hosts ch WHERE ch.content_type='routine' AND ch.content_id=public.routines_bank.id::text AND ch.host_id='73983235-9d48-433a-9e4f-d916f34862a8'::uuid);