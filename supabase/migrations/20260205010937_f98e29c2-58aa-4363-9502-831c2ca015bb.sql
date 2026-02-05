-- Allow admins to delete chat messages (for broadcast cleanup)
CREATE POLICY "Admins can delete chat messages" 
ON public.chat_messages 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));