-- Fix overly permissive RLS policies that use WITH CHECK (true)
-- These tables should only allow service_role to insert

-- 1. Fix security_audit_log INSERT policy
DROP POLICY IF EXISTS "Only service role can insert audit logs" ON public.security_audit_log;

CREATE POLICY "Only service role can insert audit logs" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- 2. Fix email_logs INSERT policy  
DROP POLICY IF EXISTS "Service role can insert email logs" ON public.email_logs;

CREATE POLICY "Service role can insert email logs" 
ON public.email_logs 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');