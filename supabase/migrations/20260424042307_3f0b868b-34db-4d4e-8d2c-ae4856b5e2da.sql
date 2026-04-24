-- Allow signed-in users to update existing app_installations rows for their own device,
-- even if the row was originally created anonymously (user_id IS NULL) before sign-in.
-- This fixes the upsert-on-conflict(device_id) RLS error during version tracking.

DROP POLICY IF EXISTS "Users can update their own installation version" ON public.app_installations;

CREATE POLICY "Users can claim and update their device installation"
ON public.app_installations
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND (user_id = auth.uid() OR user_id IS NULL)
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);