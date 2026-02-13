
ALTER TABLE public.chat_conversations 
ADD COLUMN inbox_type TEXT NOT NULL DEFAULT 'support';

ALTER TABLE public.chat_conversations 
ADD CONSTRAINT chat_conversations_inbox_type_check 
CHECK (inbox_type IN ('support', 'coach'));
