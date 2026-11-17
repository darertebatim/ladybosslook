DO $m$ DECLARE d text; BEGIN
  d := pg_get_functiondef('public.refresh_webinar_exact_email_jobs(uuid)'::regprocedure);
  d := replace(d, $q$NOT IN ('igadsfree','startads','powerfree')$q$, $q$NOT IN ('igadsfree','startads','powerfree','igfreewebinar')$q$);
  EXECUTE d;
END $m$;
INSERT INTO public.webinar_round_routing (program_slug, east_round_number, west_round_number, europe_round_number)
SELECT 'igfreewebinar', 1, 1, 1 WHERE NOT EXISTS (SELECT 1 FROM public.webinar_round_routing WHERE program_slug='igfreewebinar');
SELECT public.refresh_webinar_exact_email_jobs(id) FROM public.program_rounds WHERE program_slug = 'igfreewebinar';