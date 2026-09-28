CREATE OR REPLACE FUNCTION public.resubscribe_on_form_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND length(trim(NEW.email)) > 0 THEN
    DELETE FROM public.email_unsubscribes
    WHERE lower(email) = lower(trim(NEW.email));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_resubscribe_on_form_submission ON public.form_submissions;

CREATE TRIGGER trg_resubscribe_on_form_submission
AFTER INSERT ON public.form_submissions
FOR EACH ROW
EXECUTE FUNCTION public.resubscribe_on_form_submission();