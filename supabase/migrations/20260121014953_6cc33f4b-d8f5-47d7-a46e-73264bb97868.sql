-- Tighten overly-permissive INSERT RLS policies flagged by linter

-- 1) app_installations: prevent clients from spoofing someone else's user_id
ALTER POLICY "Public app installation tracking allowed"
  ON public.app_installations
  WITH CHECK (
    user_id IS NULL OR auth.uid() = user_id
  );

-- 2) form_submissions: keep public inserts but require non-empty core fields
ALTER POLICY "Public form submissions allowed"
  ON public.form_submissions
  WITH CHECK (
    coalesce(email, '') <> ''
    AND coalesce(name, '') <> ''
    AND coalesce(phone, '') <> ''
    AND coalesce(city, '') <> ''
  );