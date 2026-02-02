-- Add description column to user_tasks table
ALTER TABLE public.user_tasks 
ADD COLUMN description TEXT DEFAULT NULL;