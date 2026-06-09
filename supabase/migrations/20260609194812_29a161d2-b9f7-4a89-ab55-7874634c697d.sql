ALTER TABLE public.program_rounds
  ADD COLUMN IF NOT EXISTS auto_create_feed_channel boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.create_feed_channel_for_round()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_program_title text;
  v_catalog_auto boolean;
  v_channel_slug text;
BEGIN
  -- Never create channels for 1:1 rounds
  IF COALESCE(NEW.is_one_on_one, false) = true THEN
    RETURN NEW;
  END IF;

  -- Per-round opt-out
  IF COALESCE(NEW.auto_create_feed_channel, true) = false THEN
    RETURN NEW;
  END IF;

  -- Program-level opt-out
  SELECT COALESCE(auto_create_feed_channel, true), title
    INTO v_catalog_auto, v_program_title
  FROM public.program_catalog
  WHERE slug = NEW.program_slug;

  IF COALESCE(v_catalog_auto, true) = false THEN
    RETURN NEW;
  END IF;

  v_channel_slug := lower(regexp_replace(NEW.program_slug || '-round-' || NEW.round_number, '\s+', '-', 'g'));

  INSERT INTO public.feed_channels (
    name, slug, type, program_slug, round_id, allow_reactions, allow_comments
  ) VALUES (
    COALESCE(v_program_title, NEW.program_slug) || ' - ' || NEW.round_name,
    v_channel_slug,
    'round',
    NEW.program_slug,
    NEW.id,
    true,
    true
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;