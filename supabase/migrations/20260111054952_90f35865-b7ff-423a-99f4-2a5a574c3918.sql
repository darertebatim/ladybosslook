-- Create trigger function to auto-create feed channel when a program round is created
CREATE OR REPLACE FUNCTION public.create_feed_channel_for_round()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert a new feed channel for this round
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
$$;

-- Create trigger on program_rounds table
DROP TRIGGER IF EXISTS create_feed_channel_on_round_insert ON public.program_rounds;
CREATE TRIGGER create_feed_channel_on_round_insert
  AFTER INSERT ON public.program_rounds
  FOR EACH ROW
  EXECUTE FUNCTION public.create_feed_channel_for_round();