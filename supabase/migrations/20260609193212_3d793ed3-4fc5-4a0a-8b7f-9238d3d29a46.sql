ALTER TABLE public.program_catalog
  ADD COLUMN IF NOT EXISTS auto_create_feed_channel boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.create_feed_channel_for_round()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_auto boolean;
BEGIN
  -- Never create a feed channel for 1:1 session rounds
  IF NEW.is_one_on_one IS TRUE THEN
    RETURN NEW;
  END IF;

  -- Respect the per-program toggle
  SELECT auto_create_feed_channel
    INTO v_auto
    FROM public.program_catalog
   WHERE slug = NEW.program_slug
   LIMIT 1;

  IF v_auto IS DISTINCT FROM TRUE THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.feed_channels (
    name,
    slug,
    type,
    round_id,
    program_slug,
    allow_comments,
    allow_reactions,
    sort_order
  ) VALUES (
    NEW.round_name,
    NEW.program_slug || '-round-' || NEW.round_number,
    'round',
    NEW.id,
    NEW.program_slug,
    true,
    true,
    100 + NEW.round_number
  );

  RETURN NEW;
END;
$function$;