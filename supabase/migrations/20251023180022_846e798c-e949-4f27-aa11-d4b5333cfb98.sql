-- Add resource links and first session details to program_rounds table
ALTER TABLE public.program_rounds 
ADD COLUMN google_meet_link text,
ADD COLUMN google_drive_link text,
ADD COLUMN first_session_date timestamp with time zone,
ADD COLUMN first_session_duration integer DEFAULT 90;