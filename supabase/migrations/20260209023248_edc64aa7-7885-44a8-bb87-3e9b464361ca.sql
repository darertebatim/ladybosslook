-- Add foreign key to profiles table for the join to work
ALTER TABLE public.local_notification_events
ADD CONSTRAINT local_notification_events_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Allow admins to delete events for cleanup
CREATE POLICY "Admins can delete notification events"
ON public.local_notification_events
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));