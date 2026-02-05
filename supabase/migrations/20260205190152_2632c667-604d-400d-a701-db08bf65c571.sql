-- Add welcome popup flag to routines_bank table
ALTER TABLE public.routines_bank 
ADD COLUMN is_welcome_popup boolean NOT NULL DEFAULT false;

-- Create function to ensure only one welcome popup at a time
CREATE OR REPLACE FUNCTION public.ensure_single_welcome_popup()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_welcome_popup = true THEN
    UPDATE public.routines_bank 
    SET is_welcome_popup = false 
    WHERE id != NEW.id AND is_welcome_popup = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for single welcome popup enforcement
CREATE TRIGGER single_welcome_popup_trigger
BEFORE INSERT OR UPDATE ON public.routines_bank
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_welcome_popup();