UPDATE public.admin_task_bank atb
SET category = rc.slug
FROM public.routine_categories rc
WHERE atb.category = rc.name
  AND atb.category <> rc.slug;