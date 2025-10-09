-- Drop the overly permissive INSERT policy on security_audit_log
DROP POLICY IF EXISTS "System can insert audit logs" ON public.security_audit_log;

-- Create a secure INSERT policy that only allows service role
-- This prevents attackers from forging audit log entries
-- The log_security_event() function (SECURITY DEFINER) can still insert
CREATE POLICY "Only service role can insert audit logs"
ON public.security_audit_log
FOR INSERT
TO service_role
WITH CHECK (true);