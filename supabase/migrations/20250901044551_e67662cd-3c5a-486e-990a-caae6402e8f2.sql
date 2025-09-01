-- Security Fix 1: Replace overpermissive orders UPDATE policy
DROP POLICY IF EXISTS "Edge functions can update orders" ON public.orders;

-- Create more restrictive policy for order updates
-- Only allow updates from service role (edge functions) with specific conditions
CREATE POLICY "Service role can update order status and timestamps only" 
ON public.orders 
FOR UPDATE 
USING (
  -- Ensure only service role can make updates
  auth.role() = 'service_role'
) 
WITH CHECK (
  -- Only allow updating specific fields and prevent amount manipulation
  auth.role() = 'service_role' AND
  -- Ensure amount cannot be changed after creation (prevent financial manipulation)
  amount = (SELECT amount FROM public.orders WHERE id = orders.id)
);

-- Security Fix 2: Strengthen user roles RLS policies
DROP POLICY IF EXISTS "Only admins can manage user roles" ON public.user_roles;

-- Create more granular admin management policy
CREATE POLICY "Admins can manage user roles with restrictions" 
ON public.user_roles 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role) AND
  -- Prevent self-privilege escalation by checking the target user isn't the current user for role changes
  (user_id != auth.uid() OR TG_OP = 'SELECT')
);

-- Security Fix 3: Fix database function search paths
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

-- Security Fix 4: Add audit logging for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  action text NOT NULL,
  table_name text,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Security Fix 5: Add constraints to prevent data integrity issues
-- Ensure order amounts are positive
ALTER TABLE public.orders ADD CONSTRAINT orders_amount_positive CHECK (amount > 0);

-- Ensure order status is valid
ALTER TABLE public.orders ADD CONSTRAINT orders_status_valid 
CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded'));

-- Security Fix 6: Create function to safely update order status (for edge functions)
CREATE OR REPLACE FUNCTION public.update_order_status(
  p_stripe_session_id text,
  p_status text,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id uuid;
  v_old_status text;
BEGIN
  -- Validate status
  IF p_status NOT IN ('pending', 'paid', 'failed', 'cancelled', 'refunded') THEN
    RAISE EXCEPTION 'Invalid order status: %', p_status;
  END IF;

  -- Update order and get old status for audit
  UPDATE public.orders 
  SET 
    status = p_status, 
    updated_at = now()
  WHERE stripe_session_id = p_stripe_session_id
  RETURNING id, status INTO v_order_id, v_old_status;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found for session: %', p_stripe_session_id;
  END IF;

  -- Log the status change
  INSERT INTO public.security_audit_log (
    action, 
    table_name, 
    record_id, 
    old_values, 
    new_values,
    user_agent
  ) VALUES (
    'order_status_update',
    'orders',
    v_order_id,
    jsonb_build_object('status', v_old_status),
    jsonb_build_object('status', p_status),
    p_user_agent
  );

  RETURN v_order_id;
END;
$function$;