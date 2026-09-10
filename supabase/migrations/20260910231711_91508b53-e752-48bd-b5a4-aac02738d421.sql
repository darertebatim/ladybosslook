ALTER TABLE public.learn_courses
  ADD COLUMN IF NOT EXISTS is_free boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_subscription boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS available_on_mobile boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.can_access_learn_course(_user_id uuid, _course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    -- free for everyone
    EXISTS (SELECT 1 FROM public.learn_courses c WHERE c.id = _course_id AND c.is_free)
    OR
    -- Rilo Plus courses: active Plus subscription or Plus enrollment
    (
      EXISTS (SELECT 1 FROM public.learn_courses c WHERE c.id = _course_id AND c.requires_subscription)
      AND (
        EXISTS (
          SELECT 1 FROM public.user_subscriptions s
          WHERE s.user_id = _user_id
            AND s.status = 'active'
            AND (s.program_slug = 'simora-plus' OR s.program_slug LIKE 'simora-plus-%')
            AND (s.expires_at IS NULL OR s.expires_at > now())
        )
        OR EXISTS (
          SELECT 1 FROM public.course_enrollments ce
          WHERE ce.user_id = _user_id
            AND ce.status = 'active'
            AND (ce.program_slug = 'simora-plus' OR ce.program_slug LIKE 'simora-plus-%')
        )
      )
    )
    OR
    -- enrolled in a round linked to the course
    EXISTS (
      SELECT 1
      FROM public.learn_course_rounds lcr
      JOIN public.course_enrollments ce ON ce.round_id = lcr.round_id
      WHERE lcr.course_id = _course_id
        AND ce.user_id = _user_id
    )
$function$;