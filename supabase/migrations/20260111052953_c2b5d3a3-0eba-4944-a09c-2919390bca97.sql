-- Add video_url column to program_catalog table
ALTER TABLE public.program_catalog 
ADD COLUMN video_url text;