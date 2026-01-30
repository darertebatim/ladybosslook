-- Allow new pro_link_type values used by Pro Tasks (breathe, water)
ALTER TABLE public.routine_plan_tasks
  DROP CONSTRAINT IF EXISTS routine_plan_tasks_pro_link_type_check;

ALTER TABLE public.routine_plan_tasks
  ADD CONSTRAINT routine_plan_tasks_pro_link_type_check
  CHECK (
    pro_link_type IS NULL
    OR pro_link_type = ANY(
      ARRAY[
        'playlist'::text,
        'journal'::text,
        'channel'::text,
        'program'::text,
        'planner'::text,
        'inspire'::text,
        'route'::text,
        'breathe'::text,
        'water'::text
      ]
    )
  );