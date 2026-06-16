
ALTER TABLE public.aperture_files ADD COLUMN IF NOT EXISTS chat_id uuid;
ALTER TABLE public.aperture_files ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'upload';
ALTER TABLE public.aperture_messages ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.aperture_memory_items ADD COLUMN IF NOT EXISTS chat_id uuid;
CREATE INDEX IF NOT EXISTS aperture_files_chat_id_idx ON public.aperture_files(chat_id);
CREATE INDEX IF NOT EXISTS aperture_memory_items_source_file_id_idx ON public.aperture_memory_items(source_file_id);
