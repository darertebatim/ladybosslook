-- Allow admins and staff with 'support' access to view shared journal entries
CREATE POLICY "Admins can view shared journal entries"
ON public.journal_entries
FOR SELECT
USING (
  shared_with_admin = true 
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.can_access_admin_page(auth.uid(), 'support')
  )
);