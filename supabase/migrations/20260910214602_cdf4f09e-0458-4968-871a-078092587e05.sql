CREATE OR REPLACE FUNCTION public.validate_learn_lesson_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.lesson_type NOT IN ('video','audio','document','pdf','reading','link','session') THEN
    RAISE EXCEPTION 'invalid lesson_type: %', NEW.lesson_type;
  END IF;
  RETURN NEW;
END;
$$;