CREATE OR REPLACE FUNCTION public.sync_round_first_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_id uuid;
BEGIN
  IF NEW.first_session_date IS NULL OR COALESCE(NEW.is_self_paced, false) THEN
    RETURN NEW;
  END IF;

  SELECT id INTO existing_id
  FROM public.program_sessions
  WHERE round_id = NEW.id AND session_number = 1
  LIMIT 1;

  IF existing_id IS NULL THEN
    INSERT INTO public.program_sessions (round_id, session_number, title, session_date, duration_minutes, meeting_link)
    VALUES (
      NEW.id,
      1,
      'Session 1',
      NEW.first_session_date,
      COALESCE(NEW.first_session_duration, 90),
      NEW.google_meet_link
    );
  ELSIF TG_OP = 'UPDATE' AND (OLD.first_session_date IS DISTINCT FROM NEW.first_session_date) THEN
    UPDATE public.program_sessions
    SET session_date = NEW.first_session_date, updated_at = now()
    WHERE id = existing_id AND title = 'Session 1';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_round_first_session ON public.program_rounds;
CREATE TRIGGER trg_sync_round_first_session
AFTER INSERT OR UPDATE OF first_session_date, first_session_duration ON public.program_rounds
FOR EACH ROW EXECUTE FUNCTION public.sync_round_first_session();

INSERT INTO public.program_sessions (round_id, session_number, title, session_date, duration_minutes, meeting_link)
SELECT r.id, 1, 'Session 1', r.first_session_date, COALESCE(r.first_session_duration, 90), r.google_meet_link
FROM public.program_rounds r
WHERE r.first_session_date IS NOT NULL
  AND COALESCE(r.is_self_paced, false) = false
  AND NOT EXISTS (SELECT 1 FROM public.program_sessions s WHERE s.round_id = r.id);