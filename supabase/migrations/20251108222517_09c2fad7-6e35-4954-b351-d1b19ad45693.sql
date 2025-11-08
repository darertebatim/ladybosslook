-- Allow admins to view all push subscriptions
CREATE POLICY "Admins can view all push subscriptions"
ON public.push_subscriptions
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);