-- Add explicit deny policy for unauthenticated users on orders table
-- This prevents any anonymous/unauthenticated access to customer payment data
CREATE POLICY "Deny unauthenticated access to orders"
ON public.orders
FOR SELECT
TO anon
USING (false);