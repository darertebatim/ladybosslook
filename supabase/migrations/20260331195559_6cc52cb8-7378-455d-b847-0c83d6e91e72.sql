
-- Create document folders table
CREATE TABLE public.document_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.document_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin staff can manage folders"
  ON public.document_folders FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Add folder_id to admin_documents
ALTER TABLE public.admin_documents
  ADD COLUMN folder_id uuid REFERENCES public.document_folders(id) ON DELETE SET NULL;

-- RLS on document_folders for read
CREATE POLICY "Admin staff can read folders"
  ON public.document_folders FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
