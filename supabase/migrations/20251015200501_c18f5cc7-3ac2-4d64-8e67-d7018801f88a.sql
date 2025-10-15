-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active programs" ON public.program_catalog;
DROP POLICY IF EXISTS "Admins can insert programs" ON public.program_catalog;
DROP POLICY IF EXISTS "Admins can update programs" ON public.program_catalog;
DROP POLICY IF EXISTS "Admins can delete programs" ON public.program_catalog;

-- Everyone can view active programs
CREATE POLICY "Anyone can view active programs"
ON public.program_catalog
FOR SELECT
USING (is_active = true);

-- Only admins can modify programs
CREATE POLICY "Admins can insert programs"
ON public.program_catalog
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update programs"
ON public.program_catalog
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete programs"
ON public.program_catalog
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));