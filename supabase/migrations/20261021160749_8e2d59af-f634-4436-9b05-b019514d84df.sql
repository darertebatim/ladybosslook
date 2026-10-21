DO $m$ DECLARE d text; BEGIN
  d := pg_get_functiondef('public.refresh_webinar_exact_email_jobs(uuid)'::regprocedure);
  d := replace(d, $q$NOT IN ('igadsfree','startads')$q$, $q$NOT IN ('igadsfree','startads','powerfree')$q$);
  EXECUTE d;
END $m$;
SELECT public.refresh_webinar_exact_email_jobs(id) FROM public.program_rounds WHERE program_slug = 'powerfree';