-- Remove the unnecessary RPC function since we're not pre-creating orders
DROP FUNCTION IF EXISTS public.update_order_status_secure(text, text);

-- Update orders table policies for the new simplified flow
-- Remove the old policies
DROP POLICY IF EXISTS "Anyone can create orders (for guest checkout)" ON public.orders;
DROP POLICY IF EXISTS "Service role can update order status only" ON public.orders;

-- Create new simplified policy - only edge functions can create orders after successful payment
CREATE POLICY "Edge functions can create completed orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Users and admins can still view orders
-- (Keep existing view policies as they are fine)