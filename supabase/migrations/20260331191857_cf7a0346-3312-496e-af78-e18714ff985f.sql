-- Table for admin reference documents
CREATE TABLE public.admin_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type TEXT,
  extracted_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.admin_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage documents"
ON public.admin_documents
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-documents', 'admin-documents', false);

-- Storage RLS: only admins
CREATE POLICY "Admin docs upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'admin-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin docs read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'admin-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin docs delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'admin-documents' AND public.has_role(auth.uid(), 'admin'));

-- Updated at trigger
CREATE TRIGGER update_admin_documents_updated_at
BEFORE UPDATE ON public.admin_documents
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();