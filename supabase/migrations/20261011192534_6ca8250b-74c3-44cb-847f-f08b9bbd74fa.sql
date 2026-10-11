CREATE OR REPLACE FUNCTION public.propagate_enrollment_delete_to_family()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN RETURN OLD; END IF;
  DELETE FROM course_enrollments x
  WHERE x.user_id IN (SELECT f FROM account_family_ids(OLD.user_id) f WHERE f <> OLD.user_id)
    AND x.program_slug IS NOT DISTINCT FROM OLD.program_slug AND x.round_id IS NOT DISTINCT FROM OLD.round_id;
  RETURN OLD;
EXCEPTION WHEN OTHERS THEN RETURN OLD;
END $$;
REVOKE ALL ON FUNCTION public.propagate_enrollment_delete_to_family() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_enrollment_family_delete AFTER DELETE ON public.course_enrollments
FOR EACH ROW EXECUTE FUNCTION public.propagate_enrollment_delete_to_family();