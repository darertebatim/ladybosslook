CREATE TABLE public.student_admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  whatsapp_number text,
  check_whatsapp boolean NOT NULL DEFAULT false,
  check_connection boolean NOT NULL DEFAULT false,
  check_ontrack boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_admin_notes TO authenticated;
GRANT ALL ON public.student_admin_notes TO service_role;

ALTER TABLE public.student_admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage student admin notes"
ON public.student_admin_notes
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.user_admin_permissions uap WHERE uap.user_id = auth.uid()))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.user_admin_permissions uap WHERE uap.user_id = auth.uid()));

CREATE TRIGGER update_student_admin_notes_updated_at
BEFORE UPDATE ON public.student_admin_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();