-- Phase 1: Critical Privilege Escalation Fix
-- Create a function to validate role assignments (prevent unauthorized admin creation)
CREATE OR REPLACE FUNCTION public.validate_role_assignment()
RETURNS TRIGGER AS $$
DECLARE
  assigning_user_role app_role;
BEGIN
  -- Get the role of the user making the assignment
  SELECT role INTO assigning_user_role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  -- Only allow admin role assignment if the assigning user is already an admin
  -- and prevent users from modifying their own roles
  IF NEW.role = 'admin' AND (assigning_user_role != 'admin' OR NEW.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized admin role assignment';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for role assignment validation
DROP TRIGGER IF EXISTS validate_role_assignment_trigger ON public.user_roles;
CREATE TRIGGER validate_role_assignment_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_assignment();

-- Phase 2: Fix Admin Orders Access
-- Drop the restrictive orders SELECT policy and create a new one
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;

CREATE POLICY "Users can view their own orders or admins can view all"
ON public.orders
FOR SELECT
USING (
  (user_id = auth.uid()) OR 
  (email = auth.email()) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Phase 3: Secure Database Functions with proper search_path
-- Update existing functions to set proper search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role::text 
  FROM public.user_roles 
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.update_order_status_secure(p_stripe_session_id text, p_status text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order_id uuid;
BEGIN
  -- Validate status with whitelist
  IF p_status NOT IN ('pending', 'paid', 'failed', 'cancelled', 'refunded') THEN
    RAISE EXCEPTION 'Invalid order status: %', p_status;
  END IF;

  -- Validate session ID format (basic validation)
  IF p_stripe_session_id IS NULL OR LENGTH(p_stripe_session_id) < 10 THEN
    RAISE EXCEPTION 'Invalid session ID format';
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
$$;

-- Phase 4: Add audit logging table for security events
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.security_audit_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert audit logs (for triggers)
CREATE POLICY "System can insert audit logs"
ON public.security_audit_log
FOR INSERT
WITH CHECK (true);

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action text,
  p_details jsonb DEFAULT NULL,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.security_audit_log (user_id, action, details)
  VALUES (p_user_id, p_action, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add trigger to log role changes
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_security_event(
      'role_assigned',
      jsonb_build_object(
        'target_user_id', NEW.user_id,
        'role', NEW.role,
        'assigned_by', auth.uid()
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_security_event(
      'role_updated',
      jsonb_build_object(
        'target_user_id', NEW.user_id,
        'old_role', OLD.role,
        'new_role', NEW.role,
        'updated_by', auth.uid()
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_security_event(
      'role_removed',
      jsonb_build_object(
        'target_user_id', OLD.user_id,
        'role', OLD.role,
        'removed_by', auth.uid()
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create audit trigger
DROP TRIGGER IF EXISTS audit_role_changes_trigger ON public.user_roles;
CREATE TRIGGER audit_role_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_role_changes();