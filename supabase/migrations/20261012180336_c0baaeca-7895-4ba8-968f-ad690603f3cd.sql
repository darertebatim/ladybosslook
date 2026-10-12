CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM public, anon, authenticated;
CREATE TABLE IF NOT EXISTS private.cron_secret (token text NOT NULL);
REVOKE ALL ON private.cron_secret FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.verify_cron_secret(_token text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = private, public AS $$
  SELECT EXISTS (SELECT 1 FROM private.cron_secret WHERE token = _token);
$$;
REVOKE EXECUTE ON FUNCTION public.verify_cron_secret(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_cron_secret(text) TO service_role;

DO $$
DECLARE t text; j record;
BEGIN
  DELETE FROM private.cron_secret;
  t := encode(extensions.gen_random_bytes(32), 'hex');
  INSERT INTO private.cron_secret(token) VALUES (t);
  FOR j IN SELECT jobid, command FROM cron.job WHERE command ILIKE '%functions/v1/%' LOOP
    PERFORM cron.alter_job(j.jobid, command := replace(j.command,
      '"Content-Type": "application/json",',
      '"Content-Type": "application/json", "x-cron-secret": "' || t || '",'));
  END LOOP;
END $$;