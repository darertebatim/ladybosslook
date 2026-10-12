INSERT INTO public.webinar_round_routing (program_slug, east_round_number, west_round_number, europe_round_number)
SELECT 'aliagads', east_round_number, west_round_number, europe_round_number FROM public.webinar_round_routing WHERE program_slug='igadsfree'
ON CONFLICT (program_slug) DO NOTHING;