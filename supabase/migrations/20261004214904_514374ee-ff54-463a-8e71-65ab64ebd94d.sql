UPDATE public.program_catalog
SET includes_one_on_one = true,
    one_on_one_count = COALESCE(NULLIF(one_on_one_count, 1), default_session_count, 1)
WHERE is_one_on_one = true;