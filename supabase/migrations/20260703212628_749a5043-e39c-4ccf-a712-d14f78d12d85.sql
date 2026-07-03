
DROP POLICY IF EXISTS "Anyone can insert clicks" ON public.friend_invite_clicks;
CREATE POLICY "Users can insert their own clicks"
  ON public.friend_invite_clicks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    installed_user_id IS NULL
    OR installed_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Public form submissions allowed" ON public.form_submissions;
CREATE POLICY "Public form submissions allowed"
  ON public.form_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    COALESCE(name, '')  <> '' AND char_length(name)  <= 120
    AND COALESCE(email, '') <> '' AND char_length(email) <= 254
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND COALESCE(phone, '') <> '' AND char_length(phone) <= 40
    AND COALESCE(city, '')  <> '' AND char_length(city)  <= 120
    AND char_length(COALESCE(source, '')) <= 120
  );

DROP POLICY IF EXISTS "Users can read all ratings" ON public.routine_plan_ratings;

ALTER FUNCTION public.aperture_bucket_half_valid(text, text) SET search_path = public;
