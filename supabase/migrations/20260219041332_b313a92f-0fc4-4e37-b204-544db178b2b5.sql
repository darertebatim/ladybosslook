
-- Drop the existing policy and recreate with proper WITH CHECK
DROP POLICY IF EXISTS "Admins can manage conversation tags" ON public.chat_conversation_tags;

CREATE POLICY "Admins can manage conversation tags"
ON public.chat_conversation_tags
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
