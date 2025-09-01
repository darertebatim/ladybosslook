-- First drop all existing policies on orders table
DROP POLICY IF EXISTS "Service role can update order status only" ON public.orders;
DROP POLICY IF EXISTS "Edge functions can update orders" ON public.orders;

-- Security Fix 1: Create secure order update policy
CREATE POLICY "Service role can update order status only" 
ON public.orders 
FOR UPDATE 
USING (auth.role() = 'service_role') 
WITH CHECK (
  auth.role() = 'service_role' AND
  -- Prevent amount manipulation after order creation
  amount = (SELECT amount FROM public.orders o WHERE o.id = orders.id)
);

-- Security Fix 2: Strengthen user roles RLS policies
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update user roles (not self)" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles (not self)" ON public.user_roles;

-- Create separate policies for different operations
CREATE POLICY "Admins can view all user roles" 
ON public.user_roles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert user roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update user roles (not self)" 
ON public.user_roles 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) AND 
  user_id != auth.uid()
);

CREATE POLICY "Admins can delete user roles (not self)" 
ON public.user_roles 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role) AND 
  user_id != auth.uid()
);

-- Security Fix 3: Update database functions with secure search paths
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role::text 
  FROM public.user_roles 
  WHERE user_id = auth.uid()
  LIMIT 1
$function$;

-- Security Fix 4: Add data integrity constraints
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_amount_positive') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_amount_positive CHECK (amount > 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_status_valid') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_status_valid 
    CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded'));
  END IF;
END $$;

-- Security Fix 5: Create secure order status update function
CREATE OR REPLACE FUNCTION public.update_order_status_secure(
  p_stripe_session_id text,
  p_status text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id uuid;
BEGIN
  -- Validate status
  IF p_status NOT IN ('pending', 'paid', 'failed', 'cancelled', 'refunded') THEN
    RAISE EXCEPTION 'Invalid order status: %', p_status;
  END IF;

  -- Update order status only
  UPDATE public.orders 
  SET 
    status = p_status, 
    updated_at = now()
  WHERE stripe_session_id = p_stripe_session_id
  RETURNING id INTO v_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found for session: %', p_stripe_session_id;
  END IF;

  RETURN v_order_id;
END;
$function$;