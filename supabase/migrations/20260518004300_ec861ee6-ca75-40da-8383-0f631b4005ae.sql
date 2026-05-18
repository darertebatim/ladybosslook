DROP INDEX IF EXISTS public.dedications_one_per_moment;

CREATE UNIQUE INDEX IF NOT EXISTS dedications_one_per_moment_in_app
ON public.dedications(moment_id)
WHERE recipient_id IS NOT NULL;