CREATE TABLE public.program_content_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_slug text NOT NULL REFERENCES public.program_catalog(slug) ON UPDATE CASCADE ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('audio', 'video', 'course')),
  content_id uuid NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program_slug, content_type, content_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_content_links TO authenticated;
GRANT ALL ON public.program_content_links TO service_role;
ALTER TABLE public.program_content_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage program content" ON public.program_content_links FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Students view enrolled program content" ON public.program_content_links FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.course_enrollments ce WHERE ce.user_id = auth.uid() AND ce.program_slug = program_content_links.program_slug AND ce.status = 'active'));
CREATE OR REPLACE FUNCTION public.touch_program_content_links() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER touch_program_content_links BEFORE UPDATE ON public.program_content_links FOR EACH ROW EXECUTE FUNCTION public.touch_program_content_links();
CREATE OR REPLACE FUNCTION public.can_access_learn_course(_user_id uuid, _course_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $function$
  SELECT
    EXISTS (SELECT 1 FROM public.learn_courses c WHERE c.id = _course_id AND c.is_free)
    OR (
      EXISTS (SELECT 1 FROM public.learn_courses c WHERE c.id = _course_id AND c.requires_subscription)
      AND (
        EXISTS (SELECT 1 FROM public.user_subscriptions s WHERE s.user_id = _user_id AND s.status = 'active' AND (s.program_slug = 'simora-plus' OR s.program_slug LIKE 'simora-plus-%') AND (s.expires_at IS NULL OR s.expires_at > now()))
        OR EXISTS (SELECT 1 FROM public.course_enrollments ce WHERE ce.user_id = _user_id AND ce.status = 'active' AND (ce.program_slug = 'simora-plus' OR ce.program_slug LIKE 'simora-plus-%'))
      )
    )
    OR EXISTS (SELECT 1 FROM public.learn_course_rounds lcr JOIN public.course_enrollments ce ON ce.round_id = lcr.round_id WHERE lcr.course_id = _course_id AND ce.user_id = _user_id)
    OR EXISTS (SELECT 1 FROM public.program_content_links pcl JOIN public.course_enrollments ce ON ce.program_slug = pcl.program_slug WHERE pcl.content_type = 'course' AND pcl.content_id = _course_id AND ce.user_id = _user_id AND ce.status = 'active')
$function$;