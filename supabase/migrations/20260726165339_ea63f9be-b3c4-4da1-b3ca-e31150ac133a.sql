ALTER TABLE public.program_catalog
ADD COLUMN IF NOT EXISTS restricted_regions text[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN public.program_catalog.restricted_regions IS 'ISO country codes (uppercase, e.g. IR, AF, IQ) blocked from enrolling in this program. Enforced server-side in enrollment edge functions.';