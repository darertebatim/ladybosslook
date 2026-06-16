
-- Files
CREATE TABLE public.aperture_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  storage_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  extracted_text text,
  extracted_fact_count integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aperture_files TO authenticated;
GRANT ALL ON public.aperture_files TO service_role;
ALTER TABLE public.aperture_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "files_owner_all" ON public.aperture_files
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX aperture_files_user_idx ON public.aperture_files(user_id, created_at DESC);

-- User tools
CREATE TABLE public.aperture_user_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_slug text NOT NULL,
  tool_name text NOT NULL,
  category text,
  custom boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  connected_at timestamptz,
  connection_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tool_slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aperture_user_tools TO authenticated;
GRANT ALL ON public.aperture_user_tools TO service_role;
ALTER TABLE public.aperture_user_tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tools_owner_all" ON public.aperture_user_tools
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Link memory items to a source file
ALTER TABLE public.aperture_memory_items
  ADD COLUMN IF NOT EXISTS source_file_id uuid REFERENCES public.aperture_files(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS aperture_memory_items_source_file_idx
  ON public.aperture_memory_items(source_file_id);

-- Storage policies for the aperture-files bucket (bucket created via storage tool)
CREATE POLICY "aperture_files_owner_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'aperture-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "aperture_files_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'aperture-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "aperture_files_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'aperture-files' AND (storage.foldername(name))[1] = auth.uid()::text);
