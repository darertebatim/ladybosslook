
-- Create a table for chat conversation tags (like WhatsApp Business labels)
CREATE TABLE public.chat_conversation_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, tag)
);

-- Enable RLS
ALTER TABLE public.chat_conversation_tags ENABLE ROW LEVEL SECURITY;

-- Admin-only access (using has_role function)
CREATE POLICY "Admins can manage conversation tags"
ON public.chat_conversation_tags
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for fast lookups
CREATE INDEX idx_chat_conversation_tags_conversation ON public.chat_conversation_tags(conversation_id);
CREATE INDEX idx_chat_conversation_tags_tag ON public.chat_conversation_tags(tag);
