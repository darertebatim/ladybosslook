-- Drop the existing vulnerable SELECT policy on orders
DROP POLICY IF EXISTS "Users can view their own orders or admins can view all" ON public.orders;

-- Create a secure SELECT policy that only allows access based on user_id match or admin role
-- This removes the email-based vulnerability
CREATE POLICY "Users can view only their authenticated orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  (user_id IS NOT NULL AND user_id = auth.uid()) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Add missing UPDATE policy for order status changes
CREATE POLICY "Admins and service role can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR auth.role() = 'service_role'
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR auth.role() = 'service_role'
);