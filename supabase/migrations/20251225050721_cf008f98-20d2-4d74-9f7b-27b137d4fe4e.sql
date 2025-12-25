-- Add broadcast tracking columns to chat_messages
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_broadcast BOOLEAN DEFAULT false;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS broadcast_id UUID;

-- Create broadcast_messages table to track sends
CREATE TABLE public.broadcast_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  content TEXT NOT NULL,
  target_type TEXT DEFAULT 'all',
  target_course TEXT,
  target_round_id UUID REFERENCES public.program_rounds(id),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_count INTEGER DEFAULT 0,
  send_email BOOLEAN DEFAULT false,
  send_push BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for broadcast_messages
CREATE POLICY "Admins can manage broadcasts"
ON public.broadcast_messages
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add index for broadcast_id lookups
CREATE INDEX IF NOT EXISTS idx_chat_messages_broadcast_id ON public.chat_messages(broadcast_id);

-- Enable realtime for broadcast_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcast_messages;