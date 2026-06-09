CREATE OR REPLACE FUNCTION public.auto_provision_one_on_one_round()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cat RECORD;
  v_first_name text;
  v_round_id uuid;
BEGIN
  IF NEW.program_slug IS NULL OR NEW.round_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT is_one_on_one, default_session_count, title
    INTO v_cat
    FROM public.program_catalog
   WHERE slug = NEW.program_slug
   LIMIT 1;

  IF v_cat IS NULL OR v_cat.is_one_on_one IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(split_part(full_name, ' ', 1), ''), 'Client')
    INTO v_first_name
    FROM public.profiles
   WHERE id = NEW.user_id;

  INSERT INTO public.program_rounds (
    program_slug,
    round_name,
    round_number,
    start_date,
    status,
    max_students,
    is_self_paced,
    is_one_on_one,
    owner_user_id
  ) VALUES (
    NEW.program_slug,
    COALESCE(v_first_name, 'Client') || '''s 1:1 — ' || COALESCE(v_cat.title, NEW.program_slug),
    0,
    CURRENT_DATE,
    'active',
    1,
    false,
    true,
    NEW.user_id
  )
  RETURNING id INTO v_round_id;

  NEW.round_id := v_round_id;
  IF NEW.sessions_purchased IS NULL THEN
    NEW.sessions_purchased := v_cat.default_session_count;
  END IF;

  RETURN NEW;
END;
$$;