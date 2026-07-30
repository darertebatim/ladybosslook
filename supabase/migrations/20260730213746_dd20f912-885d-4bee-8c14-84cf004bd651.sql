DROP POLICY IF EXISTS "Public form submissions allowed" ON public.form_submissions;

CREATE POLICY "Public form submissions allowed"
ON public.form_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (COALESCE(email, ''::text) <> ''::text)
  AND (char_length(email) <= 254)
  AND (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'::text)
  AND (char_length(COALESCE(name, ''::text)) <= 120)
  AND (char_length(COALESCE(phone, ''::text)) <= 40)
  AND (char_length(COALESCE(city, ''::text)) <= 120)
  AND (char_length(COALESCE(source, ''::text)) <= 120)
);