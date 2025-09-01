-- Fix remaining functions with mutable search_path
-- Check and fix the update_orders_updated_at function
CREATE OR REPLACE FUNCTION public.update_orders_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Ensure all functions have immutable search_path set properly
-- Double-check our security functions are properly configured
CREATE OR REPLACE FUNCTION public.validate_role_assignment()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
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
$$;