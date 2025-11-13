-- Create table for auto-enrollment rules
CREATE TABLE public.program_auto_enrollment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_slug text NOT NULL UNIQUE,
  round_id uuid NOT NULL REFERENCES public.program_rounds(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.program_auto_enrollment ENABLE ROW LEVEL SECURITY;

-- Admins can view all auto-enrollment rules
CREATE POLICY "Admins can view all auto-enrollment rules"
ON public.program_auto_enrollment
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert auto-enrollment rules
CREATE POLICY "Admins can insert auto-enrollment rules"
ON public.program_auto_enrollment
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update auto-enrollment rules
CREATE POLICY "Admins can update auto-enrollment rules"
ON public.program_auto_enrollment
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete auto-enrollment rules
CREATE POLICY "Admins can delete auto-enrollment rules"
ON public.program_auto_enrollment
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can read auto-enrollment rules (for edge functions)
CREATE POLICY "Service role can read auto-enrollment rules"
ON public.program_auto_enrollment
FOR SELECT
TO service_role
USING (true);

-- Create trigger to update updated_at
CREATE TRIGGER update_program_auto_enrollment_updated_at
BEFORE UPDATE ON public.program_auto_enrollment
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();

-- Insert default rule for Bilingual Power Class -> Round #2
-- First, get the round #2 ID for one-bilingual program
DO $$
DECLARE
  round_2_id uuid;
BEGIN
  -- Find round #2 for one-bilingual
  SELECT id INTO round_2_id
  FROM public.program_rounds
  WHERE program_slug = 'one-bilingual' AND round_number = 2
  LIMIT 1;
  
  -- If found, insert the auto-enrollment rule
  IF round_2_id IS NOT NULL THEN
    INSERT INTO public.program_auto_enrollment (program_slug, round_id)
    VALUES ('one-bilingual', round_2_id)
    ON CONFLICT (program_slug) DO UPDATE
    SET round_id = EXCLUDED.round_id;
  END IF;
END $$;